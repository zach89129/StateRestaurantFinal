import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildManufacturersByCategory,
  buildPatternBrowseByCategory,
  splitPatterns,
  type PatternBrowseProduct,
} from "./patternBrowse";

function product(
  overrides: Partial<PatternBrowseProduct> & Pick<PatternBrowseProduct, "title" | "pattern">,
): PatternBrowseProduct {
  return {
    category: "China",
    manufacturer: null,
    images: [],
    ...overrides,
  };
}

describe("splitPatterns", () => {
  it("splits comma-separated patterns and trims whitespace", () => {
    assert.deepEqual(splitPatterns("Alpha, Beta ,Gamma"), [
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("returns empty array for blank pattern string", () => {
    assert.deepEqual(splitPatterns("  , , "), []);
  });
});

describe("buildPatternBrowseByCategory", () => {
  it("dedupes multiple products per pattern", () => {
    const result = buildPatternBrowseByCategory([
      product({
        title: "Cup A",
        pattern: "Willow",
        images: [{ url: "https://example.com/cup.jpg" }],
      }),
      product({
        title: "Cup B",
        pattern: "Willow",
        images: [{ url: "https://example.com/cup2.jpg" }],
      }),
    ]);

    assert.equal(result.China.length, 1);
    assert.equal(result.China[0]?.name, "Willow");
    assert.equal(result.China[0]?.productCount, 2);
    assert.equal(result.China[0]?.manufacturer, null);
  });

  it("includes manufacturer on pattern entries", () => {
    const result = buildPatternBrowseByCategory([
      product({
        manufacturer: "Acme China",
        pattern: "Willow",
        title: "Dinner Plate",
      }),
    ]);

    assert.equal(result.China[0]?.manufacturer, "Acme China");
  });

  it("assigns comma-separated patterns from one product to separate entries", () => {
    const result = buildPatternBrowseByCategory([
      product({
        title: "Set",
        pattern: "Alpha, Beta",
        images: [{ url: "https://example.com/set.jpg" }],
      }),
    ]);

    assert.equal(result.China.length, 2);
    assert.deepEqual(
      result.China.map((entry) => entry.name).sort(),
      ["Alpha", "Beta"],
    );
    assert.equal(result.China.find((e) => e.name === "Alpha")?.productCount, 1);
    assert.equal(result.China.find((e) => e.name === "Beta")?.productCount, 1);
    assert.equal(
      result.China[0]?.imageUrl,
      "https://example.com/set.jpg",
    );
  });

  it("prefers plate or platter titles for China patterns", () => {
    const result = buildPatternBrowseByCategory([
      product({
        title: "Tea Cup",
        pattern: "Classic",
        images: [{ url: "https://example.com/cup.jpg" }],
      }),
      product({
        title: "Dinner Plate 10in",
        pattern: "Classic",
        images: [{ url: "https://example.com/plate.jpg" }],
      }),
    ]);

    assert.equal(result.China[0]?.imageUrl, "https://example.com/plate.jpg");
  });

  it("prefers platter over plate for China patterns", () => {
    const result = buildPatternBrowseByCategory([
      product({
        title: "Dinner Plate",
        pattern: "Classic",
        images: [{ url: "https://example.com/plate.jpg" }],
      }),
      product({
        title: "Serving Platter",
        pattern: "Classic",
        images: [{ url: "https://example.com/platter.jpg" }],
      }),
    ]);

    assert.equal(result.China[0]?.imageUrl, "https://example.com/platter.jpg");
  });

  it("falls back to any product when no plate or platter exists", () => {
    const result = buildPatternBrowseByCategory([
      product({
        title: "Tea Cup",
        pattern: "Classic",
        images: [{ url: "https://example.com/cup.jpg" }],
      }),
      product({
        title: "Bowl",
        pattern: "Classic",
        images: [{ url: "https://example.com/bowl.jpg" }],
      }),
    ]);

    assert.equal(result.China[0]?.imageUrl, "https://example.com/bowl.jpg");
  });

  it("prefers products with images for non-China categories", () => {
    const result = buildPatternBrowseByCategory([
      product({
        category: "Flatware",
        title: "Fork without image",
        pattern: "Elite",
        images: [],
      }),
      product({
        category: "Flatware",
        title: "Fork with image",
        pattern: "Elite",
        images: [{ url: "https://example.com/fork.jpg" }],
      }),
    ]);

    assert.equal(result.Flatware[0]?.imageUrl, "https://example.com/fork.jpg");
  });

  it("scopes patterns by category and sorts alphabetically", () => {
    const result = buildPatternBrowseByCategory([
      product({
        category: "Glassware",
        title: "Tumbler",
        pattern: "Zebra",
        images: [{ url: "https://example.com/z.jpg" }],
      }),
      product({
        category: "Glassware",
        title: "Goblet",
        pattern: "Apple",
        images: [{ url: "https://example.com/a.jpg" }],
      }),
      product({
        category: "China",
        title: "Plate",
        pattern: "Beta",
        images: [{ url: "https://example.com/b.jpg" }],
      }),
    ]);

    assert.deepEqual(
      result.Glassware.map((entry) => entry.name),
      ["Apple", "Zebra"],
    );
    assert.deepEqual(result.China.map((entry) => entry.name), ["Beta"]);
    assert.equal(result.Flatware.length, 0);
  });

  it("ignores products outside browse categories", () => {
    const result = buildPatternBrowseByCategory([
      product({
        category: "Buffet Items",
        title: "Riser",
        pattern: "Modern",
        images: [{ url: "https://example.com/riser.jpg" }],
      }),
    ]);

    assert.equal(result.China.length, 0);
    assert.equal(result.Flatware.length, 0);
    assert.equal(result.Glassware.length, 0);
  });

  it("counts only products matching a manufacturer when filtered upstream", () => {
    const all = [
      product({
        manufacturer: "Acme",
        pattern: "Classic",
        title: "Plate A",
      }),
      product({
        manufacturer: "Acme",
        pattern: "Classic",
        title: "Plate B",
      }),
      product({
        manufacturer: "Other Co",
        pattern: "Classic",
        title: "Plate C",
      }),
    ];
    const filtered = all.filter((p) => p.manufacturer === "Acme");
    const result = buildPatternBrowseByCategory(filtered);

    assert.equal(result.China[0]?.productCount, 2);
  });
});

describe("buildManufacturersByCategory", () => {
  it("returns sorted unique manufacturers per category", () => {
    const result = buildManufacturersByCategory([
      product({
        category: "China",
        manufacturer: "Zebra Mfg",
        pattern: "A",
        title: "Plate",
      }),
      product({
        category: "China",
        manufacturer: "Acme",
        pattern: "B",
        title: "Cup",
      }),
      product({
        category: "Flatware",
        manufacturer: "Acme",
        pattern: "C",
        title: "Fork",
      }),
      product({
        category: "China",
        manufacturer: "Acme",
        pattern: "D",
        title: "Bowl",
      }),
    ]);

    assert.deepEqual(result.China, ["Acme", "Zebra Mfg"]);
    assert.deepEqual(result.Flatware, ["Acme"]);
    assert.deepEqual(result.Glassware, []);
  });

  it("ignores products outside browse categories", () => {
    const result = buildManufacturersByCategory([
      product({
        category: "Buffet Items",
        title: "Riser",
        pattern: "Modern",
        manufacturer: "Acme",
      }),
    ]);

    assert.deepEqual(result.China, []);
    assert.deepEqual(result.Flatware, []);
    assert.deepEqual(result.Glassware, []);
  });

  it("excludes manufacturers whose products have no usable pattern names", () => {
    const result = buildManufacturersByCategory([
      product({
        category: "China",
        manufacturer: "Ghost Co",
        pattern: " , ",
        title: "Plate",
      }),
      product({
        category: "China",
        manufacturer: "Acme",
        pattern: "Willow",
        title: "Dinner Plate",
      }),
    ]);

    assert.deepEqual(result.China, ["Acme"]);
  });
});
