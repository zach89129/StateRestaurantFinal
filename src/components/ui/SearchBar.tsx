"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface SearchBarProps {
  disabled?: boolean;
}

export default function SearchBar({ disabled = false }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Clear search input when URL changes or page loads
  useEffect(() => {
    setSearchTerm("");
  }, [pathname, searchParams]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!disabled && searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          placeholder={
            disabled ? "Search disabled on venue page" : "Search products..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className={`w-full px-4 py-2 rounded-lg border text-gray-500 ${
            disabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          }`}
        />
        <button
          type="submit"
          disabled={disabled}
          className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded ${
            disabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
