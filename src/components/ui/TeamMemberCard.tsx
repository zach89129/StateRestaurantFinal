import React from "react";
import Image from "next/image";

interface TeamMemberProps {
  name: string;
  title: string;
  phone?: string;
  image: string;
  className?: string;
}

export function TeamMemberCard({
  name,
  title,
  phone,
  image,
  className = "",
}: TeamMemberProps) {
  return (
    <div className={`text-center w-[150px] sm:w-[200px] ${className}`}>
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-48 lg:h-48 mx-auto mb-2 sm:mb-3 lg:mb-4 rounded-lg overflow-hidden shadow-md">
        <Image src={image} alt={name} fill className="object-contain" />
      </div>
      <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 mb-1 w-[70%] mx-auto">
        {name}
      </h3>
      <p className="text-xs sm:text-sm lg:text-base text-gray-600 italic mb-1 sm:mb-2">
        {title}
      </p>
      {phone && <p className="text-xs sm:text-sm text-gray-600">{phone}</p>}
    </div>
  );
}
