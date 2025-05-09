/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "./QuantityInput";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  trx_product_id: number;
  sku: string;
  title: string;
  description: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  aqcat: string | null;
  pattern: string | null;
  quickship: boolean;
  images: { url: string }[];
}

interface ProductCardProps {
  product: Product;
}

// Image carousel component for product cards
function ProductImageCarousel({
  images,
  title,
}: {
  images: { url: string }[];
  title: string;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // If there are no images, show the placeholder
  if (!images || images.length === 0) {
    return (
      <img
        src="/noImageState.jpg"
        alt="No image available"
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
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src={images[currentImageIndex]?.url || "/noImageState.jpg"}
        alt={title}
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

      {/* Only show navigation controls if there are multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevImage}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-r p-1 hover:bg-white"
          >
            <svg
              className="w-4 h-4 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-l p-1 hover:bg-white"
          >
            <svg
              className="w-4 h-4 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Image counter */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <div className="bg-white/70 rounded-full px-2 py-0.5 text-xs">
              {currentImageIndex + 1}/{images.length}
            </div>
          </div>
        </>
      )}
    </div>
  );
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
        id: String(product.trx_product_id),
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.images[0]?.url || "/noImageState.jpg",
      },
      quantity
    );
  };

  const handleMoreLikeThis = (e: React.MouseEvent) => {
    e.preventDefault();
    const base64Category = btoa(product.category);
    router.push(`/products?category_b64=${base64Category}&page=1`);
  };

  const handleMoreOfPattern = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.pattern) {
      const base64Pattern = btoa(product.pattern);
      router.push(`/products?pattern_b64=${base64Pattern}&page=1`);
    }
  };

  const handleMoreFromCollection = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.aqcat) {
      const base64Collection = btoa(product.aqcat);
      router.push(`/products?collection_b64=${base64Collection}&page=1`);
    }
  };

  // Convert the product SKU to a base64 string for url params, products with special characters in the SKU will break the url
  const base64Product = btoa(product.sku);

  return (
    <Link
      href={`/product/${base64Product}`}
      key={`product-link-${product.trx_product_id}`}
      onClick={(e) => {
        // If the click originated from the quantity input or its children, prevent navigation
        if ((e.target as HTMLElement).closest(".quantity-input-container")) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="group relative border rounded-lg p-1 sm:p-4 hover:shadow-lg transition-shadow bg-white h-full flex flex-col sm:flex-col justify-between"
        style={{ maxWidth: "100%", width: "100%", overflow: "hidden" }}
      >
        {/* Top content section */}
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-0">
          {/* Image on the left for mobile, top for desktop */}
          <div className="flex-shrink-0 w-20 h-20 sm:w-full sm:h-44 bg-white flex items-center justify-center overflow-hidden rounded border border-gray-100">
            <ProductImageCarousel
              images={product.images}
              title={product.title}
            />
          </div>
          {/* Info and actions on the right for mobile, below for desktop */}
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div className="space-y-0.5 sm:space-y-2">
              <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2">
                SKU: {product.sku}
              </h3>
              <p className="text-xs sm:text-sm text-gray-900 truncate">
                {product.manufacturer}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
              {product.qtyAvailable > 0 && (
                <p className="text-xs sm:text-sm text-green-600">
                  In Stock: {product.qtyAvailable}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                {product.aqcat && (
                  <button
                    onClick={handleMoreFromCollection}
                    className="text-xs text-blue-600 hover:text-blue-800 text-left"
                  >
                    More Like This: {product.aqcat}
                  </button>
                )}
                {product.pattern && (
                  <button
                    onClick={handleMoreOfPattern}
                    className="text-xs text-blue-600 hover:text-blue-800 text-left capitalize"
                  >
                    More of This Pattern: {product.pattern.toLowerCase()}
                  </button>
                )}
              </div>
            </div>
            {/* Cart Controls - right side for mobile, bottom for desktop */}
            <div className="mt-2 sm:mt-4 flex items-center gap-1 sm:gap-2">
              {session?.user ? (
                <>
                  <div
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <QuantityInput
                      onQuantityChange={setQuantity}
                      initialQuantity={1}
                      className="w-full"
                      preventPropagation={true}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToCart(e);
                    }}
                    className="flex-shrink-0 bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Add to Cart
                  </button>
                </>
              ) : (
                <div className="text-center w-full">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push("/login");
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                  >
                    Login to purchase
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
