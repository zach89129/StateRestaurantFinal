import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const CACHE_DURATION_DAYS = 365;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchResult {
  url: string;
  content: string;
  title?: string;
}

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperResult[];
}

export async function POST(request: NextRequest) {
  try {
    const { stateSku, manufacturer, details } = await request.json();

    const sku = stateSku.split("-").slice(1).join("-");

    if (!sku || !manufacturer) {
      return NextResponse.json(
        { success: false, error: "SKU and manufacturer are required" },
        { status: 400 }
      );
    }

    const cacheExpirationDate = new Date();
    cacheExpirationDate.setDate(
      cacheExpirationDate.getDate() - CACHE_DURATION_DAYS
    );

    const cachedDetails = await prisma.manufacturerDetails.findFirst({
      where: {
        sku: sku,
        updatedAt: {
          gte: cacheExpirationDate,
        },
      },
    });

    if (cachedDetails) {
      return NextResponse.json({
        success: true,
        details: JSON.parse(cachedDetails.details),
        cached: true,
      });
    }

    console.log(
      `[Manufacturer Details] Searching for: ${manufacturer} - ${sku}`
    );

    // Clean up manufacturer name for better matching
    const manufacturerKeywords = manufacturer
      .toLowerCase()
      .replace(
        /equipment|corp|corporation|inc|incorporated|ltd|llc|products|manufacturing|company|co\./gi,
        ""
      )
      .trim();

    // Helper function to perform Serper search
    const performSerperSearch = async (
      query: string
    ): Promise<SearchResult[]> => {
      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            num: 10,
          }),
        });

        if (!response.ok) {
          console.log(
            `[Manufacturer Details] Serper search failed: ${response.status}`
          );
          return [];
        }

        const data: SerperResponse = await response.json();

        if (!data.organic || data.organic.length === 0) {
          return [];
        }

        return data.organic.map((item: SerperResult) => ({
          url: item.link,
          content: item.snippet,
          title: item.title,
        }));
      } catch (error) {
        console.error("[Manufacturer Details] Serper search error:", error);
        return [];
      }
    };

    // Strategy 1: Exact SKU match with manufacturer
    const searchQuery1 = `"${sku}" ${manufacturerKeywords} specifications`;
    console.log(
      `[Manufacturer Details] Search query 1 (exact match): ${searchQuery1}`
    );
    const results1 = await performSerperSearch(searchQuery1);

    // Strategy 2: General product search
    const searchQuery2 = `${manufacturerKeywords} ${sku} product details`;
    console.log(
      `[Manufacturer Details] Search query 2 (general): ${searchQuery2}`
    );
    const results2 = await performSerperSearch(searchQuery2);

    // Strategy 3: Site-specific search (if we can guess the domain)
    const manufacturerDomain = manufacturerKeywords.replace(/\s+/g, "");
    const searchQuery3 = `site:${manufacturerDomain}.com ${sku}`;
    console.log(
      `[Manufacturer Details] Search query 3 (site-specific): ${searchQuery3}`
    );
    const results3 = await performSerperSearch(searchQuery3);

    // Combine all results, removing duplicates
    const allResults = [
      ...results1,
      ...results2.filter((r2) => !results1.some((r1) => r1.url === r2.url)),
      ...results3.filter(
        (r3) =>
          !results1.some((r1) => r1.url === r3.url) &&
          !results2.some((r2) => r2.url === r3.url)
      ),
    ];

    console.log(
      `[Manufacturer Details] Combined ${allResults.length} unique results from Serper`
    );

    if (allResults.length === 0) {
      console.log(
        `[Manufacturer Details] No search results found from any strategy`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "No product information found. Please contact the State Restaurant sales team for detailed specifications.",
        },
        { status: 404 }
      );
    }

    // Log URLs for debugging
    console.log(
      "[Manufacturer Details] Top result URLs:",
      allResults.slice(0, 5).map((r) => r.url)
    );

    console.log("[Manufacturer Details] Using top results for AI extraction");

    // Use top 8 results for comprehensive coverage
    const topResults = allResults.slice(0, 8);
    const contextText = topResults
      .map(
        (result: SearchResult, index: number) =>
          `Source ${index + 1} - ${result.title || "Unknown"}
    URL: ${result.url}
    Content: ${result.content}`
      )
      .join("\n\n");

    const systemPrompt = `You are a product information specialist. Extract comprehensive factual product information from the provided sources.

    CRITICAL RULES - NEVER BREAK THESE:
    1. ABSOLUTELY NO PRICING INFORMATION - Do not include prices, MSRP, costs, or any dollar amounts
    2. NO CUSTOMER REVIEWS OR RATINGS - Only include factual specifications
    3. NO WEBSITE LINKS OR URLs in your response
    4. NO COMPETITOR MENTIONS - Do not name other retailers or suppliers
    5. Be thorough - extract ALL available technical details and specifications
    6. Use PLAIN TEXT ONLY - no markdown formatting, no asterisks, no special characters
    7. Write in clear, simple sentences and bullet points using hyphens (-)
    8. If specific information is not available, state "Information not available"

    Extract the following information if available:
    - Technical Specifications: dimensions, materials, weight, capacity, voltage, power, features, construction details, certifications
    - Material Details & Construction: materials used, build quality, design features
    - Care & Maintenance Instructions: cleaning, maintenance requirements
    - Warranty Information: warranty terms and coverage
    - Certifications & Compliance: safety certifications (NSF, UL, FDA, etc.), compliance standards

    If any of the above categories have duplicate information, consolidate it so that we dont have repeating information in the response. the response should be concise and informative with minimal repeating or redundant information.
    `;

    const userPrompt = `Product SKU: ${sku}
    Manufacturer: ${manufacturer}
    In-House product details: ${details}

    Extract ALL available product information from the following sources. Be thorough and detailed. Remember: NO pricing, NO reviews, NO links, NO competitor mentions, NO markdown formatting.

    SOURCES TO ANALYZE:
    ${contextText}

    Provide a comprehensive response in PLAIN TEXT with these exact section labels (NOTE: IMPORTANT if there is repeating information between the labels or redundancy, consolidate the response to be consice and avoid repeating information or sections .):

    Technical Specifications:
    (List all specifications as simple bullet points with hyphens. Include dimensions, weight, capacity, voltage, power, materials, features, certifications)

    Materials & Construction:
    (Describe materials used, build quality, and design features in simple sentences)

    Care & Maintenance:
    (List cleaning and maintenance instructions as simple bullet points)

    Warranty:
    (State warranty terms in simple sentences)

    Certifications:
    (List any safety certifications like NSF, UL, FDA, etc.)

    Response filter rules IMPORTANT: 
    - If the data gathered from the web sources does not roughly match the In-House product details, it is probably not a match and you should just say that no information was found. 

    Format rules:
    - Use simple hyphens (-) for bullet points
    - NO asterisks, NO bold text, NO special formatting
    - Write clear, concise sentences
    - Keep it readable and professional`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const parseAIResponse = (response: string) => {
      const sections = {
        specifications: "",
        care: "",
        warranty: "",
        certifications: "",
        materials: "",
      };

      // More flexible regex patterns to handle various formats
      const specMatch = response.match(
        /(?:Technical\s)?Specifications:?\s*\n([\s\S]*?)(?=\n(?:Materials|Care|Warranty|Certifications):|$)/i
      );
      const materialMatch = response.match(
        /Materials?\s*(?:&|and)?\s*Construction:?\s*\n([\s\S]*?)(?=\n(?:Care|Warranty|Certifications|Technical):|$)/i
      );
      const careMatch = response.match(
        /Care\s*(?:&|and)?\s*Maintenance:?\s*\n([\s\S]*?)(?=\n(?:Warranty|Certifications|Materials|Technical):|$)/i
      );
      const warrantyMatch = response.match(
        /Warranty:?\s*\n([\s\S]*?)(?=\n(?:Care|Certifications|Materials|Technical):|$)/i
      );
      const certMatch = response.match(
        /Certifications?(?:\s*(?:&|and)?\s*Compliance)?:?\s*\n([\s\S]*?)(?=\n(?:Care|Warranty|Materials|Technical):|$)/i
      );

      // Clean up extracted content - remove extra whitespace and empty lines
      const cleanSection = (text: string | undefined) => {
        if (!text) return "Information not available";
        const cleaned = text
          .trim()
          .replace(/^\n+|\n+$/g, "") // Remove leading/trailing newlines
          .replace(/\n{3,}/g, "\n\n"); // Replace 3+ newlines with 2
        return cleaned || "Information not available";
      };

      sections.specifications = cleanSection(specMatch?.[1]);
      // sections.materials = cleanSection(materialMatch?.[1]);
      // sections.care = cleanSection(careMatch?.[1]);
      sections.warranty = cleanSection(warrantyMatch?.[1]);
      sections.certifications = cleanSection(certMatch?.[1]);

      return sections;
    };

    // const parsedDetails = aiResponse;
    const parsedDetails = parseAIResponse(aiResponse);

    const detailsPayload = {
      ...parsedDetails,
      sources: [], // No longer showing sources
    };

    await prisma.manufacturerDetails.upsert({
      where: { sku },
      update: {
        manufacturer,
        details: JSON.stringify(detailsPayload),
        sources: JSON.stringify([]),
        updatedAt: new Date(),
      },
      create: {
        sku,
        manufacturer,
        details: JSON.stringify(detailsPayload),
        sources: JSON.stringify([]),
      },
    });

    console.log(
      "[Manufacturer Details] Successfully generated and cached details"
    );
    console.log(detailsPayload);

    return NextResponse.json({
      success: true,
      details: detailsPayload,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching manufacturer details:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch manufacturer details",
      },
      { status: 500 }
    );
  }
}
