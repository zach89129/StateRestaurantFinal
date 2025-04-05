"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CategoryNavProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function CategoryNav({
  onClose,
  isMobile = false,
}: CategoryNavProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/products/options");
        const data = await response.json();
        if (data.success) {
          setCategories(data.options.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category: string) => {
    // First replace spaces with hyphens in the category name
    const formattedCategory = category.toLowerCase().replace(/\s+/g, "-");

    // Use encodeURIComponent to properly handle special characters like commas
    // For Speigelau category, use a special case to ensure correct formatting
    if (
      category.includes("Speigelau") ||
      category.includes("Masters Reserve")
    ) {
      console.log("Special category detected:", category);
      // For this specific category, we know the exact format in the database
      const specialCategoryUrl = "glassware-speigelau-masters-reserve";
      router.push(`/products/${specialCategoryUrl}`);
    } else {
      router.push(`/products/${encodeURIComponent(formattedCategory)}`);
    }

    if (onClose) {
      onClose();
    }
  };

  if (isMobile) {
    return (
      <div className="py-2 px-4">
        <div className="font-semibold mb-2 text-gray-200">Categories</div>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-6 bg-gray-700 rounded w-3/4"></div>
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            <li>
              <Link
                href="/products"
                className="block text-gray-300 hover:text-white"
                onClick={onClose}
              >
                All Products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category}>
                <button
                  onClick={() => handleCategoryClick(category)}
                  className="text-left w-full text-gray-300 hover:text-white"
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 w-64 bg-zinc-800 shadow-lg rounded-b-lg py-2 z-50">
      {isLoading ? (
        <div className="animate-pulse space-y-2 p-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-6 bg-gray-700 rounded w-3/4"></div>
          ))}
        </div>
      ) : (
        <ul className="py-1">
          <li>
            <Link
              href="/products"
              className="block px-4 py-2 text-gray-300 hover:bg-zinc-700 hover:text-white"
              onClick={onClose}
            >
              All Products
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category}>
              <button
                onClick={() => handleCategoryClick(category)}
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-zinc-700 hover:text-white"
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
