"use client";

interface OrderGuideCompareCheckboxProps {
  productId: number;
  title: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (productId: number) => void;
}

export default function OrderGuideCompareCheckbox({
  productId,
  title,
  checked,
  disabled,
  onToggle,
}: OrderGuideCompareCheckboxProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled && !checked) return;
    onToggle(productId);
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={`Compare ${title}`}
      aria-disabled={disabled}
      tabIndex={disabled && !checked ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleToggle(e as unknown as React.MouseEvent);
        }
      }}
      className={`flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer ${
        checked
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-gray-300 text-transparent"
      } ${disabled && !checked ? "opacity-40 cursor-not-allowed" : "hover:border-blue-500"}`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3.5 h-3.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
