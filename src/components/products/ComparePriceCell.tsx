"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSalesTeamVenue } from "@/contexts/SalesTeamVenueContext";
import {
  canGetComparePrice,
  fetchCompareProductPrice,
  formatComparePriceDisplay,
  isCompareEquipmentProduct,
  resolveComparePricingVenueId,
} from "@/lib/comparePricing";
import { ComparableProduct } from "@/types/compare";

function LoadingSpinner() {
  return (
    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
  );
}

interface ComparePriceCellProps {
  product: ComparableProduct;
  onPriceChange?: (productId: number, displayValue: string) => void;
}

export default function ComparePriceCell({
  product,
  onPriceChange,
}: ComparePriceCellProps) {
  const { data: session } = useSession();
  const { salesVenue } = useSalesTeamVenue();
  const [price, setPrice] = useState<number | null>(product.price ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDeadInventory = product.dead ?? false;
  const isEquipment = isCompareEquipmentProduct(product.category);
  const canGetPrice = canGetComparePrice(session, product);

  useEffect(() => {
    setPrice(product.price ?? null);
    setError(null);
  }, [product.id, product.price]);

  useEffect(() => {
    const displayValue = (() => {
      if (price != null) return formatComparePriceDisplay(price, product.uom);
      if (!canGetPrice) return "Quote";
      if (isEquipment) return "Call for quote";
      if (error) return error;
      return "Get Price";
    })();
    onPriceChange?.(product.id, displayValue);
  }, [price, canGetPrice, isEquipment, error, product.id, product.uom, onPriceChange]);

  const handleGetPrice = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEquipment || loading) return;

    const venueId = resolveComparePricingVenueId(
      session,
      salesVenue,
      isDeadInventory
    );

    if (!venueId) {
      setError("No venue selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCompareProductPrice({
        productId: product.id,
        venueId,
        isDeadInventory,
      });

      if (result.restricted) {
        setPrice(null);
        setError("Price unavailable");
        return;
      }

      setPrice(result.price);
    } catch {
      setError("Error fetching price");
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  if (price != null) {
    return (
      <span className="text-gray-900">
        {formatComparePriceDisplay(price, product.uom)}
      </span>
    );
  }

  if (!canGetPrice) {
    return <span className="text-gray-900">Quote</span>;
  }

  if (isEquipment) {
    return <span className="text-gray-900">Call for quote</span>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <span className="text-amber-700 text-sm">{error}</span>
        <button
          type="button"
          onClick={handleGetPrice}
          className="price-button text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-gray-900"
        >
          Get Price
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGetPrice}
      disabled={loading}
      className="price-button text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-gray-900 disabled:opacity-50"
    >
      {loading ? <LoadingSpinner /> : "Get Price"}
    </button>
  );
}
