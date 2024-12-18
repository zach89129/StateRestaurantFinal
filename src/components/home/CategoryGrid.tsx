"use client";

import Image from "next/image";
import Link from "next/link";
// import { useRouter } from "next/navigation";

const featuredCollections = [
  {
    title: "China and Flatware",
    body: "Our vast selection of China and Flatware is not displayed in our search, but catalogs can be viewed here.",
    href: "/china-and-flatware",
    buttonText: "View Catalogs",
    image: "/StatePlateCard.webp",
  },
  {
    title: "Navigating Our Site",
    body: "Watch this short informative video on how to best navigate our site to find the products you are looking for.",
    href: "/video-tutorial",
    buttonText: "View Tutorial",
    image: "/StateVideoThumbnail.webp",
  },
  {
    title: "Catalogs",
    body: "Try our online catalogs from our favorite vendors.",
    href: "/vendor-catalogs",
    buttonText: "View Brand List",
    image: "/StateCatalogImg.webp",
  },
  {
    title: "Food Displays and Risers",
    body: "State Restaurant offer a wide variety of food displays and risers.",
    href: "/collections/food-displays-and-risers",
    buttonText: "View Products",
    image: "/StateFoodDisplay.webp",
  },
  {
    title: "We only sell quality products",
    body: "Products we stock and recommend are designed to withstand the rigorous demands of our customers and hold up longer than others.",
    href: null,
    image: "/StateQualityCard.webp",
  },
  {
    title: "Service, Integrity, Reputation",
    body: "We are considered to be among the top ten suppliers to the gaming industry and our organization is based on integrity, service, and reputation.",
    href: null,
    image: "/StateIntegrityCard.webp",
  },
];

export default function CategoryGrid() {
  // const router = useRouter();
  // const handleNavigate = (collectionName: string) => {
  //   router.push(`/products/${collectionName}?collection=${collectionName}`);
  // };
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* <button
          onClick={() => handleNavigate("glassware")}
          className="zinc-500 text-sm"
        >
          testnav
        </button> */}
        <div className="grid grid-cols-8 gap-8">
          {featuredCollections.map((collection, index) => (
            <div
              key={collection.title}
              className={`relative h-[300px] overflow-hidden rounded-lg ${
                index === 0 || index === 3
                  ? "col-span-5"
                  : index === 4 || index === 5
                  ? "col-span-4"
                  : "col-span-3"
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-center">
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {collection.title}
                  </h3>
                  <p className="text-white mb-4">{collection.body}</p>
                  {collection.href && (
                    <div className="mt-auto">
                      <Link
                        href={collection.href}
                        className="inline-block bg-[#B87B5C] text-white px-6 py-2 rounded hover:bg-[#A66D4F] transition-colors"
                      >
                        {collection.buttonText}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
