import React from "react";
import QuantityInput from "@/components/products/QuantityInput";

interface CartItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  imageSrc: string | null;
  price?: number | null;
  venueId?: string;
  venueName?: string;
}

interface CartTableProps {
  items: CartItem[];
  venueId: string;
  venueName: string;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  showPrices: boolean;
  total: number;
}

export function CartTable({
  items,
  venueName,
  updateQuantity,
  removeItem,
  showPrices,
  total,
}: CartTableProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{venueName}</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Image
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UOM
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                {showPrices && (
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                )}
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="h-12 sm:h-16 w-12 sm:w-16">
                      {item.imageSrc ? (
                        <img
                          src={item.imageSrc}
                          alt={item.title}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            No image
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.manufacturer || "-"}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.uom || "-"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <QuantityInput
                      onQuantityChange={(quantity) =>
                        updateQuantity(item.id, quantity)
                      }
                      initialQuantity={item.quantity}
                      min={1}
                    />
                  </td>
                  {showPrices && (
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price ? `$${item.price.toFixed(2)}` : "-"}
                    </td>
                  )}
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showPrices && items.some((item) => item.price) && (
        <div className="text-right text-lg font-semibold text-gray-900">
          Venue Total: ${total.toFixed(2)}
        </div>
      )}
    </div>
  );
}
