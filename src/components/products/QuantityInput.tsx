"use client";

import { useState } from "react";

interface QuantityInputProps {
  onQuantityChange: (quantity: number) => void;
  initialQuantity?: number;
  max?: number;
  min?: number;
  className?: string;
}

export default function QuantityInput({
  onQuantityChange,
  initialQuantity = 1,
  max,
  min = 1,
  className = "",
}: QuantityInputProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (max && newQuantity > max) return;
    if (min && newQuantity < min) return;
    setQuantity(newQuantity);
    onQuantityChange(newQuantity);
  };

  return (
    <div className={`flex items-stretch h-8 ${className}`}>
      <button
        onClick={() => handleQuantityChange(quantity - 1)}
        className="w-8 border border-gray-300 rounded-l bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-medium"
      >
        −
      </button>
      <input
        type="number"
        value={quantity}
        min={min}
        max={max}
        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || min)}
        className="w-full border-t border-b border-gray-300 px-2 text-center text-sm text-gray-900 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => handleQuantityChange(quantity + 1)}
        className="w-8 border border-gray-300 rounded-r bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-medium"
      >
        ＋
      </button>
    </div>
  );
}
