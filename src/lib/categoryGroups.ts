const LIGHT_EQUIPMENT_DISPLAY = "Light equipment";

const CATEGORY_GROUPS = [
  {
    display: LIGHT_EQUIPMENT_DISPLAY,
    members: ["Light equipment", "Light equipment contract"] as const,
  },
] as const;

function normalizeCategoryKey(category: string): string {
  return category.trim().toLowerCase();
}

function findGroupForCategory(category: string) {
  const key = normalizeCategoryKey(category);
  return (
    CATEGORY_GROUPS.find(
      (group) =>
        normalizeCategoryKey(group.display) === key ||
        group.members.some(
          (member) => normalizeCategoryKey(member) === key
        )
    ) ?? null
  );
}

export function expandCategoryFilter(categories: string[]): string[] {
  const expanded = new Set<string>();

  for (const category of categories) {
    const group = findGroupForCategory(category);
    if (group) {
      for (const member of group.members) {
        expanded.add(member);
      }
    } else {
      expanded.add(category);
    }
  }

  return [...expanded];
}

export function getDisplayCategories(categories: string[]): string[] {
  const hiddenKeys = new Set<string>();

  for (const group of CATEGORY_GROUPS) {
    for (const member of group.members) {
      if (normalizeCategoryKey(member) !== normalizeCategoryKey(group.display)) {
        hiddenKeys.add(normalizeCategoryKey(member));
      }
    }
  }

  return categories.filter(
    (category) => !hiddenKeys.has(normalizeCategoryKey(category))
  );
}

export function getDisplayCategoryLabel(category: string): string {
  return findGroupForCategory(category)?.display ?? category;
}

export function getCategoryNavSlug(displayCategory: string): string {
  return displayCategory.toLowerCase().replace(/\s+/g, "-");
}

function decodeSelectedCategory(value: string): string {
  try {
    return atob(value);
  } catch {
    return value;
  }
}

export function isDisplayCategorySelected(
  displayCategory: string,
  selectedCategoriesB64: string[]
): boolean {
  const group = findGroupForCategory(displayCategory);
  const members = group ? [...group.members] : [displayCategory];
  const selectedDecoded = selectedCategoriesB64.map(decodeSelectedCategory);

  return members.some((member) =>
    selectedDecoded.some(
      (selected) =>
        normalizeCategoryKey(selected) === normalizeCategoryKey(member)
    )
  );
}

export function toggleDisplayCategoryInFilter(
  displayCategory: string,
  selectedCategoriesB64: string[]
): string[] {
  const group = findGroupForCategory(displayCategory);
  const members = group ? [...group.members] : [displayCategory];
  const memberKeys = new Set(members.map(normalizeCategoryKey));
  const isSelected = isDisplayCategorySelected(
    displayCategory,
    selectedCategoriesB64
  );

  const withoutGroupMembers = selectedCategoriesB64.filter((value) => {
    const decoded = decodeSelectedCategory(value);
    return !memberKeys.has(normalizeCategoryKey(decoded));
  });

  if (isSelected) {
    return withoutGroupMembers;
  }

  const newEntries = members.map((member) => btoa(member));
  return [...withoutGroupMembers, ...newEntries];
}

export function encodeExpandedCategoryFilter(categories: string[]): string {
  return expandCategoryFilter(categories)
    .map((category) => btoa(category))
    .join(",");
}
