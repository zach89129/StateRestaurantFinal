import React, { ReactNode } from "react";

interface ContactCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ContactCard({
  title,
  children,
  className = "",
}: ContactCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center space-y-4 ${className}`}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-6 flex items-center justify-center gap-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
