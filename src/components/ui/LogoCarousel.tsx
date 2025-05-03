import React, { useRef, useEffect } from "react";
import Image from "next/image";

interface Logo {
  name: string;
  image: string;
}

interface LogoCarouselProps {
  logos: Logo[];
  className?: string;
}

export function LogoCarousel({ logos, className = "" }: LogoCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Create a tripled array for infinite scrolling effect
  const duplicatedLogos = [...logos, ...logos, ...logos];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollWidth = container.scrollWidth / 3;
      if (container.scrollLeft >= scrollWidth) {
        container.scrollLeft = 0;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      className={`relative w-full overflow-hidden py-8 before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-white after:to-transparent ${className}`}
    >
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-12 whitespace-nowrap overflow-x-hidden animate-scroll"
        style={{
          WebkitOverflowScrolling: "touch",
          width: "fit-content",
        }}
      >
        <div className="flex items-center gap-12">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="relative h-20 w-40 flex-shrink-0 hover:scale-110 transition-transform duration-300"
            >
              <Image
                src={logo.image}
                alt={logo.name}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
