import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");

    // Helper function to decode base64 parameters
    const decodeParams = (paramName: string): string[] => {
      return (searchParams.get(paramName)?.split(",").filter(Boolean) || [])
        .map((p) => {
          try {
            return decodeURIComponent(atob(p));
          } catch (e) {
            console.error(`Error decoding ${paramName}:`, e);
            return "";
          }
        })
        .filter(Boolean);
    };

    // Parse filter parameters
    const categories = decodeParams("category_b64");
    const manufacturers = decodeParams("manufacturer_b64");
    const patterns = decodeParams("pattern_b64");
    const collections = decodeParams("collection_b64");
    const quickShip = searchParams.get("quickShip") === "true";
    const dead = searchParams.get("dead") === "true";

    // Build search criteria
    // Split search term into individual words and treat all fields as one
    // Each word must match in at least one field (AND logic across words, OR logic across fields)
    const searchWords = searchTerm
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    console.log("=== SEARCH DEBUG ===");
    console.log("Original search term:", searchTerm);
    console.log("Parsed search words:", searchWords);

    const whereClause: Prisma.ProductWhereInput = {};
    const andConditions: Prisma.ProductWhereInput[] = [];

    // If there are search words, build AND conditions for each word
    // Each word must match in at least one field (AND logic across words, OR logic across fields)
    // We use contains for initial filtering, then post-filter to ensure whole word matches only
    // This prevents "pan" from matching "company" (which contains "pan" as substring)
    if (searchWords.length > 0) {
      searchWords.forEach((word) => {
        andConditions.push({
          OR: [
            { title: { contains: word } },
            { sku: { contains: word } },
            { description: { contains: word } },
            { longDescription: { contains: word } },
            { manufacturer: { contains: word } },
            { category: { contains: word } },
            { uom: { contains: word } },
            { aqcat: { contains: word } },
            { pattern: { contains: word } },
            { tags: { contains: word } },
          ],
        });
      });
    }

    // Add filters if present
    if (categories.length > 0) {
      andConditions.push({ category: { in: categories } });
    }
    if (manufacturers.length > 0) {
      andConditions.push({ manufacturer: { in: manufacturers } });
    }
    if (collections.length > 0) {
      andConditions.push({ aqcat: { in: collections } });
    }
    // Pattern filtering will be done in application code after fetching
    // because we need to check if any pattern in the comma-separated string matches
    if (quickShip) {
      andConditions.push({ quickship: { equals: true } });
    }
    if (dead) {
      andConditions.push({ dead: { equals: true } });
    }

    // Only add AND if we have conditions
    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    console.log(
      "Where clause structure:",
      JSON.stringify(whereClause, null, 2),
    );
    console.log("Number of AND conditions:", andConditions.length);

    // Also check products that match only the first word to see if they're incorrectly included
    if (searchWords.length > 1) {
      const onlyFirstWord = await prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchWords[0] } },
                { sku: { contains: searchWords[0] } },
                { description: { contains: searchWords[0] } },
                { longDescription: { contains: searchWords[0] } },
                { manufacturer: { contains: searchWords[0] } },
                { category: { contains: searchWords[0] } },
                { uom: { contains: searchWords[0] } },
                { aqcat: { contains: searchWords[0] } },
                { pattern: { contains: searchWords[0] } },
                { tags: { contains: searchWords[0] } },
              ],
            },
          ],
        },
        take: 5,
        select: {
          sku: true,
          title: true,
          manufacturer: true,
          description: true,
        },
      });
      console.log(
        `\nProducts matching only "${searchWords[0]}" (first 5):`,
        onlyFirstWord.length,
      );
    }

    // Fetch products - we'll post-filter to ensure whole word matches
    // This ensures "pan" doesn't match "company" (which contains "pan" as substring)
    let products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { title: "asc" },
      include: { images: true },
    });

    // Filter by patterns if specified (check if any pattern in comma-separated string matches)
    if (patterns.length > 0) {
      products = products.filter((product) => {
        if (!product.pattern) return false;
        const productPatterns = product.pattern.split(",").map((p) => p.trim());
        return productPatterns.some((p) => patterns.includes(p));
      });
    }

    // Post-filter to ensure whole word matches only
    if (searchWords.length > 0) {
      const wordRegexes = searchWords.map((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
      });

      products = products.filter((product) => {
        // Each search word must match as a whole word in at least one field
        return searchWords.every((word, idx) => {
          const regex = wordRegexes[idx];
          const productPatterns = product.pattern
            ? product.pattern.split(",").map((p) => p.trim())
            : [];
          const productTags = product.tags
            ? product.tags.split(",").map((t) => t.trim())
            : [];
          const searchableFields = [
            product.title,
            product.sku,
            product.description,
            product.longDescription,
            product.manufacturer,
            product.category,
            product.uom,
            product.aqcat,
            ...productPatterns,
            ...productTags,
          ]
            .filter(Boolean)
            .join(" ");

          return regex.test(searchableFields);
        });
      });
    }

    // Apply pagination after filtering
    const total = products.length;
    console.log("Total matching products after whole-word filtering:", total);
    const paginatedProducts = products.slice(
      (page - 1) * pageSize,
      page * pageSize,
    );

    // Format product data
    const serializedProducts = paginatedProducts.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: Number(product.id),
      qtyAvailable: Number(product.qtyAvailable),
      pattern: product.pattern
        ? product.pattern.split(",").map((p) => p.trim())
        : null,
      dead: product.dead || false,
      images: product.images.map((img) => ({ url: img.url })),
    }));

    // Log sample results for debugging
    if (searchWords.length > 0 && products.length > 0) {
      console.log("Sample results (first 3):");
      products.slice(0, 3).forEach((product, idx) => {
        console.log(`\nProduct ${idx + 1}:`);
        console.log("  SKU:", product.sku);
        console.log("  Title:", product.title);
        console.log("  Manufacturer:", product.manufacturer);
        console.log("  Description:", product.description?.substring(0, 100));
        console.log(
          "  Long Description:",
          product.longDescription?.substring(0, 100),
        );
        console.log("  Category:", product.category);
        console.log("  Pattern:", product.pattern);
        console.log("  AQCat:", product.aqcat);

        // Check if each search word appears in any field and show which field
        searchWords.forEach((word) => {
          const wordLower = word.toLowerCase();
          const matches: string[] = [];

          if (product.title?.toLowerCase().includes(wordLower))
            matches.push("title");
          if (product.sku?.toLowerCase().includes(wordLower))
            matches.push("sku");
          if (product.description?.toLowerCase().includes(wordLower))
            matches.push("description");
          if (product.longDescription?.toLowerCase().includes(wordLower))
            matches.push("longDescription");
          if (product.manufacturer?.toLowerCase().includes(wordLower))
            matches.push("manufacturer");
          if (product.category?.toLowerCase().includes(wordLower))
            matches.push("category");
          if (product.uom?.toLowerCase().includes(wordLower))
            matches.push("uom");
          if (product.aqcat?.toLowerCase().includes(wordLower))
            matches.push("aqcat");
          const productPatterns = product.pattern
            ? product.pattern.split(",").map((p) => p.trim())
            : [];
          if (productPatterns.some((p) => p?.toLowerCase().includes(wordLower)))
            matches.push("pattern");

          console.log(
            `  Contains "${word}":`,
            matches.length > 0,
            matches.length > 0 ? `(in: ${matches.join(", ")})` : "",
          );

          // Show the actual field values that match
          matches.forEach((field) => {
            let fieldValue = "";
            switch (field) {
              case "title":
                fieldValue = product.title || "";
                break;
              case "sku":
                fieldValue = product.sku || "";
                break;
              case "description":
                fieldValue = product.description || "";
                break;
              case "longDescription":
                fieldValue = product.longDescription || "";
                break;
              case "manufacturer":
                fieldValue = product.manufacturer || "";
                break;
              case "category":
                fieldValue = product.category || "";
                break;
              case "uom":
                fieldValue = product.uom || "";
                break;
              case "aqcat":
                fieldValue = product.aqcat || "";
                break;
              case "pattern":
                const productPatterns = product.pattern
                  ? product.pattern.split(",").map((p) => p.trim())
                  : [];
                fieldValue = productPatterns.join(", ") || "";
                break;
            }
            console.log(`    ${field}: "${fieldValue}"`);
          });
        });
      });
    }
    console.log("=== END SEARCH DEBUG ===");

    // Get all products matching the criteria for filter options
    // Use the same post-filtering logic to get accurate filter options
    let allMatchingProducts = await prisma.product.findMany({
      where: whereClause,
      select: {
        category: true,
        manufacturer: true,
        pattern: true,
        aqcat: true,
        quickship: true,
        title: true,
        sku: true,
        description: true,
        longDescription: true,
        uom: true,
        tags: true,
      },
    });

    // Apply same whole-word filtering for filter options
    if (searchWords.length > 0) {
      const wordRegexes = searchWords.map((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
      });

      allMatchingProducts = allMatchingProducts.filter((product) => {
        return searchWords.every((word, idx) => {
          const regex = wordRegexes[idx];
          const productPatterns = product.pattern
            ? product.pattern.split(",").map((p) => p.trim())
            : [];
          const productTags = product.tags
            ? product.tags.split(",").map((t) => t.trim())
            : [];
          const searchableFields = [
            product.title,
            product.sku,
            product.description,
            product.longDescription,
            product.manufacturer,
            product.category,
            product.uom,
            product.aqcat,
            ...productPatterns,
            ...productTags,
          ]
            .filter(Boolean)
            .join(" ");

          return regex.test(searchableFields);
        });
      });
    }

    // Filter by patterns if specified
    if (patterns.length > 0) {
      allMatchingProducts = allMatchingProducts.filter((product) => {
        if (!product.pattern) return false;
        const productPatterns = product.pattern.split(",").map((p) => p.trim());
        return productPatterns.some((p) => patterns.includes(p));
      });
    }

    // Extract available filter options
    const filterOptions = {
      availableCategories: [
        ...new Set(allMatchingProducts.map((p) => p.category).filter(Boolean)),
      ].sort(),
      availableManufacturers: [
        ...new Set(
          allMatchingProducts.map((p) => p.manufacturer).filter(Boolean),
        ),
      ].sort(),
      availablePatterns: [
        ...new Set(
          allMatchingProducts.flatMap((p) => {
            if (!p.pattern) return [];
            return p.pattern
              .split(",")
              .map((pat) => pat.trim())
              .filter(Boolean);
          }),
        ),
      ].sort(),
      availableCollections: [
        ...new Set(allMatchingProducts.map((p) => p.aqcat).filter(Boolean)),
      ].sort(),
      hasQuickShip: allMatchingProducts.some((p) => p.quickship),
    };

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      products: serializedProducts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        ...filterOptions,
        appliedCategories: categories || [],
        appliedManufacturers: manufacturers || [],
        appliedCollection: collections.join(",") || "",
        appliedPattern: patterns.join(",") || "",
        appliedQuickShip: quickShip,
        appliedDead: dead,
      },
    });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
