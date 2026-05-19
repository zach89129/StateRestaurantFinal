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
  images: { url: string }[];
};

export type PatternBrowseEntry = {
  name: string;
  imageUrl: string | null;
};

export type PatternBrowseByCategory = Record<
  PatternBrowseCategory,
  PatternBrowseEntry[]
>;

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

  for (const category of PATTERN_BROWSE_CATEGORIES) {
    representatives.set(category, new Map());
  }

  for (const product of products) {
    const category = product.category as PatternBrowseCategory;
    if (!PATTERN_BROWSE_CATEGORIES.includes(category)) continue;

    const categoryMap = representatives.get(category)!;
    for (const patternName of splitPatterns(product.pattern)) {
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
    result[category] = Array.from(categoryMap.entries())
      .map(([name, product]) => ({
        name,
        imageUrl: product.images[0]?.url ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}
