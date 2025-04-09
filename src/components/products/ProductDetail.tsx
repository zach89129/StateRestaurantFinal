"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import QuantityInput from "./QuantityInput";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
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
  aqcat: string | null;
  pattern: string | null;
  quickship: boolean;
  images: { src: string }[];
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleAddToCart = () => {
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

  const handleMoreOfPattern = () => {
    if (product.pattern) {
      const encodedPattern = encodeURIComponent(product.pattern);
      router.push(`/products?pattern=${encodedPattern}&page=1`);
    }
  };

  const handleMoreFromCollection = () => {
    if (product.aqcat) {
      const encodedCollection = encodeURIComponent(product.aqcat);
      router.push(`/products?collection=${encodedCollection}&page=1`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex py-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <Link href="/products" className="text-gray-600 hover:text-gray-900">
            Products
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-gray-900 font-medium">{product.title}</span>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm mt-6">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Left Column - Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-white rounded-lg overflow-hidden p-2">
                <div className="aspect-square bg-gray-50 flex items-center justify-center p-4 relative">
                  {product.images.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[currentImageIndex].src}
                        alt={`${product.title} - Image ${
                          currentImageIndex + 1
                        }`}
                        className="object-contain w-full h-full transition-opacity duration-300 max-h-[500px]"
                      />
                      {/* Navigation Arrows */}
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={previousImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                            aria-label="Previous image"
                          >
                            <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                            aria-label="Next image"
                          >
                            <ChevronRightIcon className="h-6 w-6 text-gray-800" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">No image available</div>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-4 pt-5 px-2 snap-x">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden snap-start p-1 bg-white ${
                        currentImageIndex === index
                          ? "ring-2 ring-blue-500 ring-offset-2"
                          : "ring-1 ring-gray-200 hover:ring-gray-300"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.src}
                        alt={`${product.title} thumbnail ${index + 1}`}
                        className="w-full h-full object-contain rounded-md"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <p className="text-gray-600">{product.manufacturer}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600">UOM: {product.uom}</p>
                {product.qtyAvailable > 0 && (
                  <p className="text-sm text-green-600">In Stock</p>
                )}
              </div>

              {product.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h2>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Additional Product Info */}
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Items Sold As
                </h3>
                <p className="text-sm text-gray-600">CS(2DZ) of 2 DZ</p>
              </div>

              <div className="mt-6">
                <div className="text-base text-gray-700">
                  <p>Manufacturer: {product.manufacturer}</p>
                  <p>Category: {product.category}</p>
                  <p>Unit of Measure: {product.uom}</p>
                  <p>Available Quantity: {product.qtyAvailable}</p>
                </div>
              </div>

              {product.quickship && (
                <div className="mt-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Quick Ship Available
                  </span>
                </div>
              )}

              <div className="mt-6">
                <div className="flex flex-col space-y-4">
                  {product.aqcat && (
                    <button
                      onClick={handleMoreFromCollection}
                      className="text-blue-600 hover:text-blue-800 text-left"
                    >
                      More Like This: {product.aqcat}
                    </button>
                  )}
                  {product.pattern && (
                    <button
                      onClick={handleMoreOfPattern}
                      className="text-blue-600 hover:text-blue-800 text-left capitalize"
                    >
                      More of This Pattern: {product.pattern.toLowerCase()}
                    </button>
                  )}
                </div>
              </div>

              {/* Add to Cart Section - Only show if logged in */}
              {session?.user ? (
                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-32">
                      <QuantityInput
                        onQuantityChange={setQuantity}
                        initialQuantity={1}
                        className="w-32"
                        preventPropagation={true}
                      />
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={product.qtyAvailable <= 0}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-6 border-t">
                  <p className="text-gray-600">
                    Please{" "}
                    <Link
                      href="/login"
                      className="text-blue-600 hover:underline"
                    >
                      log in
                    </Link>{" "}
                    to add items to your cart.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
