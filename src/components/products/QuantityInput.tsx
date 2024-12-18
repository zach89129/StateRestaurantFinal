"use client";

import { useState } from "react";

interface QuantityInputProps {
  onQuantityChange: (quantity: number) => void;
  initialQuantity?: number;
  min?: number;
  max?: number;
}

export default function QuantityInput({
  onQuantityChange,
  initialQuantity = 1,
  min = 1,
  max = 9999,
}: QuantityInputProps) {
  const [quantity, setQuantity] = useState(initialQuantity);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    if (newValue >= min && newValue <= max) {
      setQuantity(newValue);
      onQuantityChange(newValue);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      setQuantity((q) => q + 1);
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      setQuantity((q) => q - 1);
      onQuantityChange(quantity - 1);
    }
  };

  return (
    <div className="flex items-center border rounded-md">
      <button
        type="button"
        onClick={handleDecrement}
        className="px-2 py-1 text-gray-600 hover:text-gray-900"
      >
        -
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-16 text-center border-x px-2 py-1 text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="px-2 py-1 text-gray-600 hover:text-gray-900"
      >
        +
      </button>
    </div>
  );
}
