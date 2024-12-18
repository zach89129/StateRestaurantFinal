import { Product } from "@/types/product";
import { TagGroup } from "@/types/filters";

export function parseProductTags(products: Product[]): TagGroup[] {
  const tagGroups = new Map<string, Set<string>>();

  products.forEach((product) => {
    const tags = product.tags?.split(",") || [];

    tags.forEach((tag) => {
      const trimmedTag = tag.trim();
      if (trimmedTag.includes("_")) {
        const [family, ...valueParts] = trimmedTag.split("_");
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
