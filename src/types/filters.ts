interface Product {
  id: number;
  tags: string | null;
}

export interface TagGroup {
  family: string;
  values: string[];
}

export function organizeTagsByFamily(products: Product[]): TagGroup[] {
  const tagGroups = new Map<string, Set<string>>();

  products.forEach((product) => {
    const tags =
      product.tags?.split(",").map((tag: string) => tag.trim()) || [];

    tags.forEach((tag: string) => {
      if (tag.includes("_")) {
        const [family, ...valueParts] = tag.split("_");
        const value = valueParts.join("_");

        if (!tagGroups.has(family)) {
          tagGroups.set(family, new Set());
        }
        tagGroups.get(family)?.add(value);
      }
    });
  });

  return Array.from(tagGroups.entries()).map(([family, values]) => ({
    family,
    values: Array.from(values).sort(),
  }));
}
