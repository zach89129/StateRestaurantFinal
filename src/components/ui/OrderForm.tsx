import React from "react";
import Link from "next/link";

interface OrderFormProps {
  comment: string;
  purchaseOrder: string;
  onCommentChange: (comment: string) => void;
  onPurchaseOrderChange: (po: string) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  submitting: boolean;
  continueShoppingUrl: string;
}

export function OrderForm({
  comment,
  purchaseOrder,
  onCommentChange,
  onPurchaseOrderChange,
  onClearCart,
  onSubmitOrder,
  submitting,
  continueShoppingUrl,
}: OrderFormProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <button
        onClick={onClearCart}
        className="text-red-600 hover:text-red-900 text-sm"
      >
        Clear Cart
      </button>

      <div className="w-full sm:w-auto space-y-4">
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
            onChange={(e) => onPurchaseOrderChange(e.target.value)}
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
            onChange={(e) => onCommentChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full justify-between">
          <Link
            href={continueShoppingUrl}
            className="w-full sm:w-[180px] bg-gray-100 text-gray-800 px-6 py-2 rounded hover:bg-gray-200 text-sm text-center"
          >
            Continue Shopping
          </Link>
          <button
            onClick={onSubmitOrder}
            disabled={submitting}
            className="w-full sm:w-[180px] bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm text-center"
          >
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
