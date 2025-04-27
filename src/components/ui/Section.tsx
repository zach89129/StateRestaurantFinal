import React, { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = "" }: SectionProps) {
  return (
    <section className={className}>
      <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
        <span className="inline-block w-2 h-8 bg-blue-600 mr-3"></span>
        {title}
      </h3>
      <div className="text-gray-800 leading-relaxed pl-5 border-l-2 border-gray-200">
        {children}
      </div>
    </section>
  );
}
