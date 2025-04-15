/* eslint-disable @next/next/no-img-element */
"use client";

import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import QuantityInput from "@/components/products/QuantityInput";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { data: session } = useSession();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [comment, setComment] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const router = useRouter();

  const getContinueShoppingUrl = () => {
    if (session?.user?.venues && session.user.venues.length > 0) {
      return `/venues/${session.user.venues[0].trxVenueId}`;
    }
    return "/products";
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/cart/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          comment,
          purchaseOrder,
          venue: session?.user?.venues?.[0] || null,
          trxCustomerId: session?.user?.trxCustomerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit order");
      }

      setSuccess(true);
      clearCart();
      router.push("/cart/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded">
          Please log in to view your cart
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            Order Submitted
          </h1>
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded mb-4">
            Your order has been submitted successfully! Our sales team will
            contact you shortly.
          </div>
          <Link
            href="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <span>Continue Shopping</span>
            <svg
              className="w-4 h-4 ml-2"
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
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-gray-500">
            Your cart is empty.{" "}
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
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
                      {session?.user?.seePrices && (
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
                          <div className="text-xs text-gray-500">
                            SKU: {item.sku}
                          </div>
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
                        {session?.user?.seePrices && (
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

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                Clear Cart
              </button>

              <div className="w-full sm:w-auto space-y-4">
                {session?.user?.seePrices &&
                  items.some((item) => item.price) && (
                    <div className="text-right text-lg font-semibold text-gray-900">
                      Total: $
                      {items
                        .reduce(
                          (total, item) =>
                            total + (item.price || 0) * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </div>
                  )}
                <div className="w-full sm:w-[400px] mb-4">
                  <label
                    htmlFor="purchaseOrder"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Purchase Order Number
                  </label>
                  <input
                    type="text"
                    id="purchaseOrder"
                    name="purchaseOrder"
                    maxLength={25}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter PO number (optional)"
                    value={purchaseOrder}
                    onChange={(e) => setPurchaseOrder(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-[400px]">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Order Comments
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Add any special instructions or comments about your order..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full justify-between">
                  <Link
                    href={getContinueShoppingUrl()}
                    className="w-full sm:w-[180px] bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200 text-sm text-center"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full sm:w-[180px] bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm text-center"
                  >
                    {submitting ? "Submitting..." : "Submit Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
