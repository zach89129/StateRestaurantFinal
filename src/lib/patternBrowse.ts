export const PATTERN_BROWSE_CATEGORIES = [
  "China",
  "Flatware",
  "Glassware",
] as const;

export type PatternBrowseCategory = (typeof PATTERN_BROWSE_CATEGORIES)[number];

export type PatternBrowseProduct = {
  title: string;
  category: string;
  pattern: string;
  manufacturer: string | null;
  images: { url: string }[];
};

export type ManufacturersByCategory = Record<
  PatternBrowseCategory,
  string[]
>;

export type PatternBrowseEntry = {
  name: string;
  imageUrl: string | null;
  productCount: number;
  manufacturer: string | null;
};

function formatPatternManufacturers(manufacturers: Set<string>): string | null {
  if (manufacturers.size === 0) return null;
  return Array.from(manufacturers)
    .sort((a, b) => a.localeCompare(b))
    .join(", ");
}

export type PatternBrowseByCategory = Record<
  PatternBrowseCategory,
  PatternBrowseEntry[]
>;

export function buildManufacturersByCategory(
  products: PatternBrowseProduct[],
): ManufacturersByCategory {
  const manufacturerSets = new Map<PatternBrowseCategory, Set<string>>();

  for (const category of PATTERN_BROWSE_CATEGORIES) {
    manufacturerSets.set(category, new Set());
  }

  for (const product of products) {
    const category = product.category as PatternBrowseCategory;
    if (!PATTERN_BROWSE_CATEGORIES.includes(category)) continue;
    if (!product.manufacturer?.trim()) continue;
    if (splitPatterns(product.pattern).length === 0) continue;

    manufacturerSets.get(category)!.add(product.manufacturer.trim());
  }

  const result = {} as ManufacturersByCategory;
  for (const category of PATTERN_BROWSE_CATEGORIES) {
    result[category] = Array.from(manufacturerSets.get(category)!).sort(
      (a, b) => a.localeCompare(b),
    );
  }
  return result;
}

export function splitPatterns(pattern: string): string[] {
  return pattern
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function chinaTitleScore(title: string): number {
  const lower = title.toLowerCase();
  if (/\bplatter\b/.test(lower)) return 3;
  if (/\bplate\b/.test(lower)) return 2;
  return 0;
}

function hasImage(product: PatternBrowseProduct): boolean {
  return product.images.length > 0 && Boolean(product.images[0]?.url);
}

function compareProductsForRepresentative(
  a: PatternBrowseProduct,
  b: PatternBrowseProduct,
  category: string,
): number {
  if (category === "China") {
    const scoreDiff = chinaTitleScore(b.title) - chinaTitleScore(a.title);
    if (scoreDiff !== 0) return scoreDiff;
  }

  const aHasImage = hasImage(a);
  const bHasImage = hasImage(b);
  if (aHasImage !== bHasImage) {
    return aHasImage ? -1 : 1;
  }

  return a.title.localeCompare(b.title);
}

function pickBetterRepresentative(
  current: PatternBrowseProduct | undefined,
  candidate: PatternBrowseProduct,
  category: string,
): PatternBrowseProduct {
  if (!current) return candidate;
  return compareProductsForRepresentative(current, candidate, category) <= 0
    ? current
    : candidate;
}

export function buildPatternBrowseByCategory(
  products: PatternBrowseProduct[],
): PatternBrowseByCategory {
  const representatives = new Map<
    PatternBrowseCategory,
    Map<string, PatternBrowseProduct>
  >();
  const productCounts = new Map<
    PatternBrowseCategory,
    Map<string, number>
  >();
  const manufacturersByPattern = new Map<
    PatternBrowseCategory,
    Map<string, Set<string>>
  >();

  for (const category of PATTERN_BROWSE_CATEGORIES) {
    representatives.set(category, new Map());
    productCounts.set(category, new Map());
    manufacturersByPattern.set(category, new Map());
  }

  for (const product of products) {
    const category = product.category as PatternBrowseCategory;
    if (!PATTERN_BROWSE_CATEGORIES.includes(category)) continue;

    const categoryMap = representatives.get(category)!;
    const countMap = productCounts.get(category)!;
    const manufacturerMap = manufacturersByPattern.get(category)!;
    for (const patternName of splitPatterns(product.pattern)) {
      countMap.set(patternName, (countMap.get(patternName) ?? 0) + 1);

      if (product.manufacturer?.trim()) {
        const manufacturers =
          manufacturerMap.get(patternName) ?? new Set<string>();
        manufacturers.add(product.manufacturer.trim());
        manufacturerMap.set(patternName, manufacturers);
      }

      const existing = categoryMap.get(patternName);
      categoryMap.set(
        patternName,
        pickBetterRepresentative(existing, product, category),
      );
    }
  }

  const result = {} as PatternBrowseByCategory;

  for (const category of PATTERN_BROWSE_CATEGORIES) {
    const categoryMap = representatives.get(category)!;
    const countMap = productCounts.get(category)!;
    const manufacturerMap = manufacturersByPattern.get(category)!;
    result[category] = Array.from(categoryMap.entries())
      .map(([name, product]) => ({
        name,
        imageUrl: product.images[0]?.url ?? null,
        productCount: countMap.get(name) ?? 0,
        manufacturer: formatPatternManufacturers(
          manufacturerMap.get(name) ?? new Set(),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}
