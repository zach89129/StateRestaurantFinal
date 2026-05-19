import Link from "next/link";
import {
  PATTERN_BROWSE_CATEGORIES,
  type PatternBrowseCategory,
} from "@/lib/patternBrowse";

const TAB_SLUGS: Record<PatternBrowseCategory, string> = {
  China: "china",
  Flatware: "flatware",
  Glassware: "glassware",
};

function getPatternsHref(category?: string): string {
  if (
    category &&
    PATTERN_BROWSE_CATEGORIES.includes(category as PatternBrowseCategory)
  ) {
    return `/patterns?tab=${TAB_SLUGS[category as PatternBrowseCategory]}`;
  }
  return "/patterns";
}

interface PatternBrowseCalloutProps {
  category?: string;
}

export default function PatternBrowseCallout({
  category,
}: PatternBrowseCalloutProps) {
  const href = getPatternsHref(category);

  return (
    <div
      className="mb-6 rounded-lg border border-[#B87B5C]/30 bg-[#B87B5C]/5 px-4 py-3 text-sm text-gray-700"
      role="note"
    >
      Looking for a specific look?{" "}
      <Link
        href={href}
        className="font-medium text-[#B87B5C] hover:text-[#A66D4F] underline"
      >
        Browse our china, flatware, and glassware patterns
      </Link>
      .
    </div>
  );
}
