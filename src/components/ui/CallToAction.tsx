import React, { ReactNode } from "react";

interface CallToActionProps {
  children?: ReactNode;
  phoneNumber?: string;
  className?: string;
}

export function CallToAction({
  children,
  phoneNumber,
  className = "",
}: CallToActionProps) {
  return (
    <section
      className={`text-center space-y-6 bg-gray-50 p-8 rounded-lg ${className}`}
    >
      {children && (
        <div className="text-gray-800 leading-relaxed">{children}</div>
      )}

      {phoneNumber && (
        <div className="font-bold text-xl sm:text-2xl text-gray-900 whitespace-nowrap">
          CALL NOW {phoneNumber}
        </div>
      )}
    </section>
  );
}
