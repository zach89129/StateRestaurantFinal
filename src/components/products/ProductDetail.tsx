"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import QuantityInput from "./QuantityInput";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useSalesTeamVenue } from "@/contexts/SalesTeamVenueContext";

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
  );
}

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const router = useRouter();
  const { salesVenue } = useSalesTeamVenue();
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Reset price when venue changes
  useEffect(() => {
    setPrice(null);
    setPriceError(null);
  }, [salesVenue]);

  const handleGetPrice = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!salesVenue) {
      setPriceError("No venue selected");
      return;
    }

    setIsLoadingPrice(true);
    setPriceError(null);

    try {
      const response = await fetch(
        `/api/pricing?venueId=${salesVenue}&productId=${product.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch price");
      }

      setPrice(data.price);
    } catch (err) {
      setPriceError("Error fetching price");
      setPrice(null);
    } finally {
      setIsLoadingPrice(false);
    }
  };

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
        imageSrc: product.images[0].url,
      },
      quantity
    );
  };

  const handleMoreOfPattern = () => {
    if (product.pattern) {
      const encodedPattern = btoa(product.pattern);
      router.push(`/products?pattern_b64=${encodedPattern}&page=1`);
    }
  };

  const handleMoreFromCollection = () => {
    if (product.aqcat) {
      const encodedCollection = btoa(product.aqcat);
      router.push(`/products?collection_b64=${encodedCollection}&page=1`);
    }
  };

  const formatLongDescription = () => {
    if (!product.longDescription) return null;

    if (product.longDescription.length <= 150 || showFullDescription) {
      return product.longDescription;
    }

    return `${product.longDescription.substring(0, 150)}...`;
  };

  const getDescription = () => {
    if (product.longDescription) {
      return formatLongDescription();
    } else if (product.description) {
      return product.description;
    }
    return null;
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
              <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[currentImageIndex].url}
                    alt={product.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow-md hover:bg-white"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 shadow-md hover:bg-white"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="mt-4 flex gap-4 overflow-x-auto py-1 px-1">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-20 w-20 flex-shrink-0 rounded-lg bg-gray-50 p-2 ${
                        currentImageIndex === index
                          ? "ring-2 ring-blue-500 ring-offset-1 border-blue-500"
                          : "border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <img
                          src={image.url}
                          alt={`${product.title} - ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </div>
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
                {product.qtyAvailable > 0 && (
                  <p className="text-sm text-green-600">In Stock</p>
                )}
              </div>

              {(product.longDescription || product.description) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h2>
                  <div className="text-gray-600 whitespace-pre-line">
                    {getDescription()}
                    {product.longDescription &&
                      product.longDescription.length > 150 && (
                        <button
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {showFullDescription ? "Show less" : "Read more"}
                        </button>
                      )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="text-base text-gray-700">
                  <p>Category: {product.category}</p>
                  <p>Unit of Measure: {product.uom}</p>
                  <p>Quantity in Stock: {product.qtyAvailable}</p>
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
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
                      <div className="w-full sm:w-40">
                        <QuantityInput
                          onQuantityChange={setQuantity}
                          initialQuantity={1}
                          className="w-full"
                          preventPropagation={true}
                        />
                      </div>
                      <button
                        onClick={handleAddToCart}
                        className="bg-blue-600 text-white w-full sm:w-auto px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add to Cart
                      </button>

                      {/* Price button for desktop - only show for sales team */}
                      {session.user.isSalesTeam && (
                        <div className="hidden sm:block">
                          <button
                            onClick={handleGetPrice}
                            className="price-button bg-gray-100 hover:bg-gray-200 px-8 py-2 rounded-lg text-black"
                          >
                            {isLoadingPrice ? (
                              <LoadingSpinner />
                            ) : price ? (
                              `${price.toFixed(2)} per ${product.uom}`
                            ) : priceError ? (
                              priceError
                            ) : (
                              "Get Price"
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Price button for mobile - only show for sales team */}
                    {session.user.isSalesTeam && (
                      <div className="sm:hidden w-full">
                        <button
                          onClick={handleGetPrice}
                          className="price-button w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-black"
                        >
                          {isLoadingPrice ? (
                            <LoadingSpinner />
                          ) : price ? (
                            `${price.toFixed(2)} per ${product.uom}`
                          ) : priceError ? (
                            priceError
                          ) : (
                            "Get Price"
                          )}
                        </button>
                      </div>
                    )}
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
