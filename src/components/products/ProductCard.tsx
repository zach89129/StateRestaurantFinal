/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "./QuantityInput";

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
  imageSrc: string | null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addItem(
      {
        id: String(product.id),
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.imageSrc,
      },
      quantity
    );
  };

  return (
    <div className="group relative border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
      {/* Image */}
      <div className="aspect-square bg-gray-100 mb-4 flex items-center justify-center overflow-hidden">
        {product.imageSrc ? (
          <img
            src={product.imageSrc}
            alt={product.title}
            className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="text-gray-400">No image</div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
          {product.title}
        </h3>
        <p className="text-sm text-gray-900">SKU: {product.sku}</p>
        <p className="text-sm text-gray-900">{product.manufacturer}</p>

        {/* Availability */}
        {product.qtyAvailable > 0 && (
          <p className="text-sm text-green-600">In Stock</p>
        )}

        {/* Cart Controls - Only show if logged in */}
        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <QuantityInput
                onQuantityChange={setQuantity}
                initialQuantity={1}
                max={product.qtyAvailable}
              />
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        )}

        {/* Future links - commented out for now */}
        {/* <div className="space-y-1 mt-2">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800 block">
            More Like This
          </a>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800 block">
            More of This Pattern
          </a>
        </div> */}
      </div>
    </div>
  );
}
