import React from "react";
import Image from "next/image";

interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ImageCard({
  src,
  alt,
  title,
  description,
  className = "",
}: ImageCardProps) {
  return (
    <div className={`relative h-[400px] w-full group ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-lg shadow-lg bg-gray-100">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain transition-transform duration-700 group-hover:scale-105"
          priority
        />
        {(title || description) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
              {title && (
                <h4 className="text-white text-xl font-semibold mb-2">
                  {title}
                </h4>
              )}
              {description && <p className="text-gray-200">{description}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
