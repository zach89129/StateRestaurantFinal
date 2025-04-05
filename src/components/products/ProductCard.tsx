/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "./QuantityInput";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  sku: string;
  title: string;
  description: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  tags: string;
  images: { src: string }[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(
      {
        id: String(product.id),
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.images[0].src,
      },
      quantity
    );
  };

  const handleMoreLikeThis = (e: React.MouseEvent) => {
    e.preventDefault();
    const encodedCategory = encodeURIComponent(
      encodeURIComponent(product.category)
    );
    router.push(`/products?category=${encodedCategory}&page=1`);
  };

  const handleMoreOfPattern = (e: React.MouseEvent) => {
    e.preventDefault();
    // Extract everything after "PATTERN_" until the end of the string or next tag separator
    const patternMatch = product.tags.match(
      /PATTERN_([^,]*(?:,[^,]*)*?)(?:,\s*\w+_|$)/
    );
    if (patternMatch) {
      const pattern = `PATTERN_${patternMatch[1]}`;
      const encodedPattern = encodeURIComponent(pattern);
      router.push(`/products?tags=${encodedPattern}&page=1`);
    }
  };

  const hasPattern = product.tags.includes("PATTERN_");

  const hasCollection = product.tags.includes("AQCAT_");

  const handleMoreFromCollection = (e: React.MouseEvent) => {
    e.preventDefault();
    // Extract everything after "AQCAT_" until the end of the string or next tag separator
    const collectionMatch = product.tags.match(
      /AQCAT_([^,]*(?:,[^,]*)*?)(?:,\s*\w+_|$)/
    );
    if (collectionMatch) {
      // Use the full AQCAT_ tag for exact matching, ensuring we capture any commas in the name
      const fullTagRaw = `AQCAT_${collectionMatch[1]}`;

      // Get the actual tag format from the database and log it for debugging
      console.log("Raw tag from database:", fullTagRaw);

      // Normalize by ensuring consistent space after comma
      const fullTagText = fullTagRaw.replace(/,\s*/g, ", ");
      console.log("Normalized tag:", fullTagText);

      // Now encode the tag for URL
      const encodedTag = encodeURIComponent(fullTagText);
      console.log("Encoded tag for URL:", encodedTag);

      // Force a direct database match by adding a special parameter
      router.push(`/products?page=1&tags=${encodedTag}&exact=true`);
    }
  };

  return (
    <Link href={`/product/${product.sku}`} key={`product-link-${product.id}`}>
      <div
        className="group relative border rounded-lg p-2 sm:p-4 hover:shadow-lg transition-shadow bg-white h-full flex flex-col justify-between"
        style={{ maxWidth: "100%", width: "100%", overflow: "hidden" }}
      >
        {/* Top content section */}
        <div className="flex flex-col">
          {/* Image container with fixed dimensions */}
          <div
            className="h-44 w-full max-w-[250px] mx-auto bg-white mb-2 sm:mb-4 flex items-center justify-center overflow-hidden rounded border border-gray-100"
            style={{ maxHeight: "176px" }}
          >
            <div
              className="flex items-center justify-center w-full h-full p-3"
              style={{ maxWidth: "100%" }}
            >
              <img
                src={product.images[0]?.src || "/noImageState.jpg"}
                alt={product.title}
                className="max-h-36 max-w-[200px] w-auto h-auto object-contain group-hover:scale-105 transition-transform duration-200"
                style={{
                  maxWidth: "100%",
                  maxHeight: "144px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                  margin: "0 auto",
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-1 sm:space-y-2">
            {/* Product details with fixed heights */}
            <div className="min-h-[40px] sm:min-h-[48px]">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2">
                {product.title}
              </h3>
            </div>

            <div className="min-h-[20px] sm:min-h-[24px]">
              <p className="text-xs sm:text-sm text-gray-900">
                SKU: {product.sku}
              </p>
            </div>

            <div className="min-h-[20px] sm:min-h-[24px]">
              <p className="text-xs sm:text-sm text-gray-900">
                {product.manufacturer}
              </p>
            </div>

            {/* Description - Fixed height with line clamp */}
            <div className="min-h-[40px] sm:min-h-[48px]">
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            </div>

            {/* Availability - Fixed height regardless of whether it's shown */}
            <div className="min-h-[20px] sm:min-h-[24px]">
              {product.qtyAvailable > 0 && (
                <p className="text-xs sm:text-sm text-green-600">In Stock</p>
              )}
            </div>

            {/* Filter Links - Fixed height section */}
            <div className="space-y-1 mt-2 min-h-[60px] sm:min-h-[72px]">
              {/* <button
                onClick={handleMoreLikeThis}
                className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left"
              >
                More Like This : {product.category}
              </button> */}
              {hasCollection && (
                <button
                  onClick={handleMoreFromCollection}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 block w-full text-left"
                >
                  More Like This:{" "}
                  {(() => {
                    // Extract the collection name after AQCAT_ prefix, preserving any commas
                    const match = product.tags.match(
                      /AQCAT_([^,]*(?:,[^,]*)*?)(?:,\s*\w+_|$)/
                    );
                    return match ? match[1].toLowerCase() : "";
                  })()}
                </button>
              )}
              {hasPattern && (
                <button
                  onClick={handleMoreOfPattern}
                  className="text-xs text-blue-600 hover:text-blue-800 block w-full text-left capitalize"
                >
                  More of This Pattern :{" "}
                  {(() => {
                    // Extract the pattern name after PATTERN_ prefix, preserving any commas
                    const match = product.tags.match(
                      /PATTERN_([^,]*(?:,[^,]*)*?)(?:,\s*\w+_|$)/
                    );
                    return match ? match[1].toLowerCase() : "";
                  })()}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cart Controls - Always at the bottom */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          {session?.user ? (
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex-1">
                <QuantityInput
                  onQuantityChange={setQuantity}
                  initialQuantity={1}
                  className="w-full"
                  preventPropagation={true}
                />
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                Add to Cart
              </button>
            </div>
          ) : (
            // Placeholder for consistent height when not logged in
            <div className="h-8 sm:h-10"></div>
          )}
        </div>
      </div>
    </Link>
  );
}
