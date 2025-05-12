/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "@/components/products/QuantityInput";
import VenueFilterSidebar from "@/components/venues/VenueFilterSidebar";
import Link from "next/link";
import { useSearch } from "@/contexts/SearchContext";

interface VenueProduct {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number | null;
  price: number | null;
  images: { src: string }[];
  aqcat: string | null;
  pattern: string | null;
  quickship: boolean;
}

interface VenueProductsResponse {
  success: boolean;
  error?: string;
  venueName: string;
  products: {
    id: bigint | number;
    sku: string;
    title: string;
    description: string | null;
    manufacturer: string | null;
    category: string | null;
    uom: string | null;
    qtyAvailable: bigint | number | null;
    price: number | null;
    images: { src: string }[];
    aqcat: string | null;
    pattern: string | null;
    quickship: boolean;
  }[];
}

interface Venue {
  id: string;
  venueName: string;
  products: VenueProduct[];
}

interface PricingData {
  success: boolean;
  error?: string;
  price: number | null;
}

export default function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { addItem } = useCart();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>(
    []
  );
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedQuickShip, setSelectedQuickShip] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pricingData, setPricingData] = useState<{
    [key: string]: number | null;
  }>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 25;
  const { isSearchVisible } = useSearch();
  const filteredProducts = useMemo(() => {
    return (
      venue?.products.filter((product) => {
        const searchMatch =
          !searchTerm ||
          Object.values(product).some((value) =>
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(product.category || "");

        const matchesManufacturer =
          selectedManufacturers.length === 0 ||
          selectedManufacturers.includes(product.manufacturer || "");

        const matchesPattern =
          selectedPatterns.length === 0 ||
          (product.pattern && selectedPatterns.includes(product.pattern));

        const matchesCollection =
          selectedCollections.length === 0 ||
          (product.aqcat && selectedCollections.includes(product.aqcat));

        const matchesQuickShip = !selectedQuickShip || product.quickship;

        return (
          searchMatch &&
          matchesCategory &&
          matchesManufacturer &&
          matchesPattern &&
          matchesCollection &&
          matchesQuickShip
        );
      }) || []
    );
  }, [
    venue?.products,
    searchTerm,
    selectedCategories,
    selectedManufacturers,
    selectedPatterns,
    selectedCollections,
    selectedQuickShip,
  ]);

  const handleFetchPrices = async () => {
    if (!session?.user?.trxCustomerId) {
      setPricingError("Customer ID not found");
      return;
    }

    // Get the current page of products
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToFetch = filteredProducts.slice(startIndex, endIndex);

    if (productsToFetch.length === 0) {
      setPricingError("No products to fetch prices for");
      return;
    }

    setLoadingPrices(true);
    setPricingError(null);

    try {
      // Split products into smaller batches
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < productsToFetch.length; i += batchSize) {
        batches.push(productsToFetch.slice(i, i + batchSize));
      }

      const newPrices = { ...pricingData };

      // Process each batch with a delay
      for (const batch of batches) {
        const productIds = batch.map((product) => product.id).join(",");

        try {
          const response = await fetch(
            `/api/pricing?venueId=${resolvedParams.id}&productIds=${productIds}`
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error ||
                `Failed to fetch pricing data: ${response.statusText}`
            );
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "Failed to fetch pricing data");
          }

          // Process successful price fetches
          if (data.prices && Array.isArray(data.prices)) {
            data.prices.forEach(
              (item: { productId: string; price: number }) => {
                if (item && item.productId && item.price !== undefined) {
                  newPrices[item.productId] = item.price;
                }
              }
            );
          }

          // Add a small delay between batches to prevent overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.warn(`Error fetching prices for batch:`, err);
          // Continue with next batch even if this one fails
        }
      }

      setPricingData(newPrices);
    } catch (err) {
      console.error("Error in price fetching process:", err);
      setPricingError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingPrices(false);
    }
  };

  useEffect(() => {
    const fetchVenueProducts = async () => {
      try {
        // First check if user has access to this venue
        const accessResponse = await fetch(
          `/api/check-venue-access?venueId=${resolvedParams.id}`
        );
        if (!accessResponse.ok) {
          throw new Error("Failed to check venue access");
        }
        const accessData = await accessResponse.json();

        if (!accessData.hasAccess) {
          setError("You no longer have access to this venue");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/venue-products?trx_venue_id=${resolvedParams.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch venue products");
        }
        const data = (await response.json()) as VenueProductsResponse;
        if (data.success) {
          setVenue({
            id: resolvedParams.id,
            venueName: data.venueName,
            products: data.products.map((product) => ({
              ...product,
              id: String(product.id),
              qtyAvailable: product.qtyAvailable
                ? Number(product.qtyAvailable)
                : null,
            })),
          });
        } else {
          throw new Error(data.error || "Failed to fetch venue products");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchVenueProducts();
    }
  }, [resolvedParams.id, session]);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setPricingData({}); // Clear price data when changing pages
  };

  const totalPages = Math.ceil(
    (filteredProducts?.length || 0) / productsPerPage
  );

  // Get current page of products
  const currentProducts =
    filteredProducts?.slice(
      (currentPage - 1) * productsPerPage,
      currentPage * productsPerPage
    ) || [];

  // Auto-fetch prices on page load or page change
  useEffect(() => {
    if (session?.user?.seePrices && venue && currentProducts.length > 0) {
      handleFetchPrices();
    }
  }, [currentPage, venue, session?.user?.seePrices, filteredProducts]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleAddToCart = (product: VenueProduct) => {
    const quantity = quantities[product.id] || 1;
    const price = session?.user?.seePrices ? pricingData[product.id] : null;

    addItem(
      {
        id: product.id,
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.images[0]?.src,
        price: price,
        venueId: resolvedParams.id,
        venueName: venue?.venueName || "No Venue",
      },
      quantity
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleManufacturerChange = (manufacturer: string) => {
    setSelectedManufacturers((prev) =>
      prev.includes(manufacturer)
        ? prev.filter((m) => m !== manufacturer)
        : [...prev, manufacturer]
    );
  };

  const handlePatternChange = (pattern: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(pattern)
        ? prev.filter((p) => p !== pattern)
        : [...prev, pattern]
    );
  };

  const handleCollectionChange = (collection: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collection)
        ? prev.filter((c) => c !== collection)
        : [...prev, collection]
    );
  };

  const handleQuickShipChange = () => {
    setSelectedQuickShip(!selectedQuickShip);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedManufacturers([]);
    setSelectedPatterns([]);
    setSelectedCollections([]);
    setSelectedQuickShip(false);
  };

  const getSortOptions = (products: VenueProduct[]) => {
    const categories = new Set<string>();
    const manufacturers = new Set<string>();
    const patterns = new Set<string>();
    const collections = new Set<string>();

    products.forEach((product) => {
      if (product.category) categories.add(product.category);
      if (product.manufacturer) manufacturers.add(product.manufacturer);
      if (product.pattern) patterns.add(product.pattern);
      if (product.aqcat) collections.add(product.aqcat);
    });

    return {
      categories: Array.from(categories).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      patterns: Array.from(patterns).sort(),
      collections: Array.from(collections).sort(),
      hasQuickShip: products.some((p) => p.quickship),
    };
  };

  // Calculate filtered options based on current selections
  const getFilteredOptions = useMemo(() => {
    if (!venue?.products) {
      return {
        categories: [],
        manufacturers: [],
        patterns: [],
        collections: [],
      };
    }

    let filteredProducts = venue.products;

    // Filter products based on current selections
    if (selectedCategories.length > 0) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.category && selectedCategories.includes(product.category)
      );
    }

    if (selectedManufacturers.length > 0) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.manufacturer &&
          selectedManufacturers.includes(product.manufacturer)
      );
    }

    if (selectedPatterns.length > 0) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.pattern && selectedPatterns.includes(product.pattern)
      );
    }

    if (selectedCollections.length > 0) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.aqcat && selectedCollections.includes(product.aqcat)
      );
    }

    if (selectedQuickShip) {
      filteredProducts = filteredProducts.filter(
        (product) => product.quickship
      );
    }

    // Extract unique values from filtered products
    const categories = new Set<string>();
    const manufacturers = new Set<string>();
    const patterns = new Set<string>();
    const collections = new Set<string>();

    filteredProducts.forEach((product) => {
      if (product.category) categories.add(product.category);
      if (product.manufacturer) manufacturers.add(product.manufacturer);
      if (product.pattern && product.pattern !== "")
        patterns.add(product.pattern);
      if (product.aqcat && product.aqcat !== "") collections.add(product.aqcat);
    });

    return {
      categories: Array.from(categories).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      patterns: Array.from(patterns).sort(),
      collections: Array.from(collections).sort(),
    };
  }, [
    venue?.products,
    selectedCategories,
    selectedManufacturers,
    selectedPatterns,
    selectedCollections,
    selectedQuickShip,
  ]);

  // Add this function to handle image carousel
  function ImageCarousel({
    images,
    title,
  }: {
    images: { src: string }[];
    title: string;
  }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handlePrevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    };

    const handleNextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    };

    return (
      <div className="relative h-full w-full">
        {images && images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex].src}
              alt={title}
              className="h-full w-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-[-10px] top-1/2 transform -translate-y-1/2 bg-white/70 rounded-r hover:bg-white"
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
                  className="absolute right-[-10px] top-1/2 transform -translate-y-1/2 bg-white/70 rounded-l hover:bg-white"
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
                <div className="absolute bottom-[-10px] left-0 right-0 flex justify-center">
                  <div className="bg-white/70 rounded-full px-2 py-1 text-xs text-black">
                    {currentImageIndex + 1}/{images.length}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <img
            src="/noImageState.jpg"
            alt="No image available"
            className="h-full w-full object-contain"
          />
        )}
      </div>
    );
  }

  // Simplified description component
  function ProductDescription({ description }: { description: string | null }) {
    if (!description)
      return <span className="text-gray-400 italic">No description</span>;

    return (
      <div className="text-sm text-gray-700 whitespace-normal">
        {description}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded">
          No venue found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 xs:px-0">
        {/* Header with venue name */}
        <div className="flex flex-col md:flex-row md:items-center justify-start mb-6 w-[72vw]">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {venue.venueName} Products
          </h1>

          {/* Get Prices button */}
          {session?.user && session.user.seePrices && (
            <div className="flex items-center gap-2 mt-2 md:mt-0 md:ml-10">
              {loadingPrices && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-copper mr-2"></div>
                  <span className="text-copper text-sm">Loading prices...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Show pricing error if any */}
        {pricingError && (
          <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
            Error fetching prices: {pricingError}
          </div>
        )}

        {/* Filter Button (Mobile & Desktop) */}
        <button
          onClick={toggleFilter}
          className={`fixed top-[110px] md:top-[180px] right-4 flex items-center gap-2 px-4 py-3 bg-copper text-white border border-copper shadow-lg hover:bg-copper-hover transition-colors md:py-2 md:rounded-lg rounded-full ${
            isSearchVisible ? "top-[150px]" : "top-[100px]"
          } transition-all duration-300 ease-in-out`}
          style={{
            willChange: "transform, top",
            transition: "top 0.3s ease-in-out",
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-sm font-medium">Filter</span>
        </button>

        {/* Add Catalog Reference Message */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800">
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              CLICK HERE
            </Link>{" "}
            TO ADD UNPRICED ITEMS FROM OUR MAIN CATALOG TO YOUR ORDER TO RECEIVE
            A QUOTE .
          </p>
        </div>

        {/* Filter Sidebar */}
        <VenueFilterSidebar
          sortOptions={getSortOptions(venue.products)}
          filteredOptions={getFilteredOptions}
          selectedCategories={selectedCategories}
          selectedManufacturers={selectedManufacturers}
          selectedPatterns={selectedPatterns}
          selectedCollections={selectedCollections}
          selectedQuickShip={selectedQuickShip}
          onCategoryChange={handleCategoryChange}
          onManufacturerChange={handleManufacturerChange}
          onPatternChange={handlePatternChange}
          onCollectionChange={handleCollectionChange}
          onQuickShipChange={handleQuickShipChange}
          onClearAll={handleClearAll}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Products Grid */}
        <div className="flex-1">
          {/* Desktop Table / Mobile Cards */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manufacturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-20 w-20">
                          <ImageCarousel
                            images={product.images}
                            title={product.title}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                        <ProductDescription description={product.description} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.manufacturer || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.uom || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.qtyAvailable || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pricingData[product.id]
                          ? `$${pricingData[product.id]?.toFixed(2)}`
                          : product.price
                          ? `$${product.price.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {session?.user && (
                          <div className="flex items-center gap-2">
                            <QuantityInput
                              onQuantityChange={(quantity) =>
                                handleQuantityChange(product.id, quantity)
                              }
                              initialQuantity={1}
                              max={9999}
                            />
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={session.user.seePrices && loadingPrices}
                              className={`bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors ${
                                session.user.seePrices && loadingPrices
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {session.user.seePrices && loadingPrices
                                ? "Loading..."
                                : "Add"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border rounded-lg p-2 flex flex-row gap-2 items-start"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <ImageCarousel
                      images={product.images}
                      title={product.title}
                    />
                  </div>
                  {/* Info and actions */}
                  <div className="flex flex-col justify-between flex-1 min-w-0 gap-1">
                    <div>
                      <h3 className="text-xs font-medium text-gray-900 line-clamp-2">
                        {product.title}
                      </h3>
                      {product.manufacturer && (
                        <p className="text-xs text-gray-500 truncate">
                          {product.manufacturer}
                        </p>
                      )}
                      <div className="text-xs text-gray-600 line-clamp-2">
                        <ProductDescription description={product.description} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs mt-1">
                      <span className="text-gray-500">UOM:</span>
                      <span className="text-gray-900">
                        {product.uom || "-"}
                      </span>
                      <span className="text-gray-500">Available:</span>
                      <span className="text-gray-900">
                        {product.qtyAvailable || 0}
                      </span>
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900">
                        {pricingData[product.id]
                          ? `$${pricingData[product.id]?.toFixed(2)}`
                          : product.price
                          ? `$${product.price.toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                    {session?.user && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex-1">
                          <QuantityInput
                            onQuantityChange={(quantity) =>
                              handleQuantityChange(product.id, quantity)
                            }
                            initialQuantity={1}
                            max={9999}
                          />
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={session.user.seePrices && loadingPrices}
                          className={`bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors whitespace-nowrap text-xs font-medium ${
                            session.user.seePrices && loadingPrices
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {session.user.seePrices && loadingPrices
                            ? "Loading..."
                            : "Add"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-copper text-white hover:bg-copper-hover"
              }`}
            >
              Previous
            </button>
            <span className="px-3 py-1 text-black">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-copper text-white hover:bg-copper-hover"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
