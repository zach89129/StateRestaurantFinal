"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import QuantityInput from "./QuantityInput";

interface ProductDetailProps {
  product: {
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
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
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
            {/* Left Column - Image */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-8">
                {product.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageSrc}
                    alt={product.title}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <div className="text-gray-400">No image available</div>
                )}
              </div>
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

              {/* Add to Cart Section - Only show if logged in */}
              {session?.user ? (
                <div className="pt-6 border-t">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-32">
                      <QuantityInput
                        onQuantityChange={setQuantity}
                        initialQuantity={1}
                      />
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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

              {/* Additional Product Info */}
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Items Sold As
                </h3>
                <p className="text-sm text-gray-600">CS(2DZ) of 2 DZ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
