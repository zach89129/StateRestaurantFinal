import Link from "next/link";

interface CatalogClearFiltersLinkProps {
  href: string;
}

export default function CatalogClearFiltersLink({
  href,
}: CatalogClearFiltersLinkProps) {
  return (
    <Link
      href={href}
      className="ml-3 shrink-0 text-xs sm:text-sm font-bold text-red-500 hover:text-red-400 uppercase tracking-wide"
    >
      CLEAR FILTER-NEW SEARCH
    </Link>
  );
}
