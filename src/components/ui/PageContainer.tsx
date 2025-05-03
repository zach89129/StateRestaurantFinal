import React, { ReactNode } from "react";

interface PageContainerProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  children,
  className = "",
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {title && (
          <h1 className="text-4xl font-bold text-center mb-16 text-gray-900">
            <span className="relative inline-block">{title}</span>
          </h1>
        )}

        <div
          className={`max-w-6xl mx-auto bg-white rounded-lg p-8 ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
