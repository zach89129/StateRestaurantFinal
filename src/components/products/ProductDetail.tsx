"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import QuantityInput from "./QuantityInput";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpTrayIcon,
  EnvelopeIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useSalesTeamVenue } from "@/contexts/SalesTeamVenueContext";

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
  );
}

function DetailSection({ title, content }: { title: string; content: string }) {
  const isNotAvailable =
    content === "Information not available" ||
    content === "Not available from manufacturer" ||
    !content ||
    content.trim() === "";

  const cleanContent = (text: string) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/^###\s+\d+\.\s*/gm, "")
      .replace(/^###\s+/gm, "")
      .trim();
  };

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title}
      </h3>
      <div
        className={`text-sm leading-relaxed ${
          isNotAvailable ? "text-gray-500 italic" : "text-gray-700"
        }`}
        style={{ whiteSpace: "pre-line" }}
      >
        {isNotAvailable ? "Information not available" : cleanContent(content)}
      </div>
    </div>
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
  const [manufacturerDetails, setManufacturerDetails] = useState<{
    specifications: string;
    care: string;
    warranty: string;
    certifications: string;
    materials: string;
    sources: string[];
  } | null>(null);
  const [isLoadingManufacturerDetails, setIsLoadingManufacturerDetails] =
    useState(false);
  const [manufacturerDetailsError, setManufacturerDetailsError] = useState<
    string | null
  >(null);
  const [showManufacturerDetails, setShowManufacturerDetails] = useState(false);
  const [manufacturerDetailsCached, setManufacturerDetailsCached] =
    useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Reset price when venue changes
  useEffect(() => {
    setPrice(null);
    setPriceError(null);
  }, [salesVenue]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target as Node)
      ) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  const fetchManufacturerDetails = async () => {
    if (!product.manufacturer || !product.sku) return;

    setIsLoadingManufacturerDetails(true);
    setManufacturerDetailsError(null);

    try {
      const body = {
        stateSku: encodeURIComponent(product.sku),
        manufacturer: encodeURIComponent(product.manufacturer),
        details: product.longDescription || "",
      };
      const response = await fetch(`/api/manufacturer-details?`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch manufacturer details");
      }

      setManufacturerDetails(data.details);
      setManufacturerDetailsCached(data.cached || false);
      setShowManufacturerDetails(true);
    } catch (err) {
      setManufacturerDetailsError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setIsLoadingManufacturerDetails(false);
    }
  };

  const handleGetManufacturerDetails = () => {
    if (manufacturerDetails) {
      setShowManufacturerDetails(!showManufacturerDetails);
    } else {
      fetchManufacturerDetails();
    }
  };

  const handleRefreshManufacturerDetails = () => {
    setManufacturerDetails(null);
    fetchManufacturerDetails();
  };

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

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    const encodedSku = btoa(product.sku);
    return `${window.location.origin}/product/${encodedSku}`;
  };

  const handleCopyLink = async () => {
    try {
      const url = getShareUrl();
      await navigator.clipboard.writeText(url);
      setShowShareMenu(false);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleEmailShare = () => {
    const url = getShareUrl();
    const subject = encodeURIComponent(
      `Check out this product: ${product.title}`
    );
    const body = encodeURIComponent(
      `I wanted to share this product with you:\n\n${product.title}\n${product.manufacturer}\nSKU: ${product.sku}\n\nView it here: ${url}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const handleTextShare = () => {
    const url = getShareUrl();
    const message = encodeURIComponent(
      `Check out this product: ${product.title} - ${url}`
    );
    window.location.href = `sms:?body=${message}`;
    setShowShareMenu(false);
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
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 flex-1">
                    {product.title}
                  </h1>
                  <div className="relative" ref={shareMenuRef}>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
                      aria-label="Share product"
                      aria-expanded={showShareMenu}
                    >
                      <ArrowUpTrayIcon className="h-5 w-5" />
                    </button>
                    {showShareMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-w-[calc(100vw-2rem)]">
                        <div className="p-2">
                          <button
                            onClick={handleEmailShare}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors touch-manipulation min-h-[44px]"
                          >
                            <EnvelopeIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <span>Email</span>
                          </button>
                          <button
                            onClick={handleTextShare}
                            className="sm:hidden w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors touch-manipulation min-h-[44px]"
                          >
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <span>Text</span>
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors touch-manipulation min-h-[44px]"
                          >
                            <LinkIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <span>Copy Link</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600">{product.manufacturer}</p>
                {product.manufacturer && (
                  <button
                    onClick={handleGetManufacturerDetails}
                    disabled={isLoadingManufacturerDetails}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingManufacturerDetails
                      ? "Loading Manufacturer Details..."
                      : showManufacturerDetails
                      ? "Hide Manufacturer Details"
                      : "Get Manufacturer Details"}
                  </button>
                )}
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

              {/* Manufacturer Details Section - Inline */}
              {product.manufacturer && (
                <div className="mt-6 pt-6 border-t">
                  {showManufacturerDetails && (
                    <div className="space-y-2">
                      {isLoadingManufacturerDetails && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                          <p className="mt-4 text-gray-600">
                            Gathering manufacturer information...
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            This may take a moment
                          </p>
                        </div>
                      )}

                      {manufacturerDetailsError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 font-medium">
                            Information Not Available
                          </p>
                          <p className="text-yellow-700 text-sm mt-1">
                            {manufacturerDetailsError}
                          </p>
                          <p className="text-yellow-600 text-xs mt-2">
                            This could mean the manufacturer doesn&apos;t have
                            detailed product information online, or it&apos;s
                            not easily accessible. For specific details, please
                            contact your sales representative.
                          </p>
                          <button
                            onClick={handleRefreshManufacturerDetails}
                            className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {manufacturerDetails && !isLoadingManufacturerDetails && (
                        <div className="space-y-2">
                          <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Manufacturer Details
                          </h2>
                          {manufacturerDetailsCached && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between mb-4">
                              <p className="text-sm text-blue-800">
                                Showing cached information
                              </p>
                              <button
                                onClick={handleRefreshManufacturerDetails}
                                className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                              >
                                Refresh
                              </button>
                            </div>
                          )}

                          <DetailSection
                            title="Technical Specifications"
                            content={manufacturerDetails.specifications}
                          />

                          <DetailSection
                            title="Warranty Information"
                            content={manufacturerDetails.warranty}
                          />

                          <DetailSection
                            title="Certifications & Compliance"
                            content={manufacturerDetails.certifications}
                          />

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                            <p className="text-xs text-blue-800">
                              <strong>Disclaimer:</strong> This information was
                              gathered using OpenAI technology. Please verify
                              any information with the manufacturer or reach out
                              to the State Restaurant sales team for more
                              information.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
