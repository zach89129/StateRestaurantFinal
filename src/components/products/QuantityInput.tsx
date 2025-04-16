"use client";

import { useState } from "react";

interface QuantityInputProps {
  onQuantityChange: (quantity: number) => void;
  initialQuantity?: number;
  max?: number;
  min?: number;
  className?: string;
  preventPropagation?: boolean;
}

export default function QuantityInput({
  onQuantityChange,
  initialQuantity = 1,
  max,
  min = 1,
  className = "",
  preventPropagation = false,
}: QuantityInputProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (max && newQuantity > max) return;
    if (min && newQuantity < min) return;
    setQuantity(newQuantity);
    onQuantityChange(newQuantity);
  };

  const handleButtonClick = (e: React.MouseEvent, newQuantity: number) => {
    if (preventPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleQuantityChange(newQuantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preventPropagation) {
      e.stopPropagation();
    }
    const value = e.target.value;
    // Allow empty input
    if (value === "") {
      setQuantity(0);
      onQuantityChange(0);
      return;
    }
    const numValue = parseInt(value);
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      handleQuantityChange(numValue);
    }
  };

  return (
    <div className={`flex items-stretch h-8 ${className}`}>
      <button
        onClick={(e) => handleButtonClick(e, quantity - 1)}
        className="w-8 border border-gray-300 rounded-l bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-medium"
      >
        −
      </button>
      <input
        type="number"
        value={quantity || ""}
        min={min}
        max={max}
        onChange={handleInputChange}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onFocus={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        className="w-full border-t border-b border-gray-300 px-2 text-center text-sm text-gray-900 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={(e) => handleButtonClick(e, quantity + 1)}
        className="w-8 border border-gray-300 rounded-r bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-medium"
      >
        ＋
      </button>
    </div>
  );
}
