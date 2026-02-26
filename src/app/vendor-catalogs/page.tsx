/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import VendorCatalogsList from "@/app/vendor-catalogs/VendorCatalogsList";

/* eslint-disable react/no-unescaped-entities */
export default function VendorCatalogsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-zinc-900 text-white py-12 sm:py-20">
        <div className="absolute inset-0 z-0 opacity-50">
          <img
            src="/StateHeroImage.webp"
            alt="Catalog Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-center">
            Product Catalogs
          </h1>
          <p className="text-lg sm:text-xl text-center max-w-3xl mx-auto text-gray-200">
            Browse our extensive collection of catalogs and resources
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <div className="bg-zinc-50 p-6 sm:p-8 rounded-lg shadow-md">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                State Catalog
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Whether looking for a specific manufacturer, or looking for
                items regularly stocked, you will find it here. Our "State
                Catalog" should be your first source for shopping products. It
                is a duplicate to our printed catalog and contains popular items
                for our industry, as well as containing the most stocked items.
                You can browse by category, or search for specific products
                using key words.
              </p>
              <Link href="/products">
                <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-md text-sm sm:text-base w-full sm:w-auto">
                  View State Catalog
                </button>
              </Link>
            </div>

            <div className="bg-zinc-50 p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Important Information
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Finally, here you will also find links to specific manufacturer
                catalogs if you know exactly what you are looking for. This area
                will continue to grow as we add additional partner links. Have
                fun browsing and please email or call us with any specific
                questions. Please keep in mind, unless you are an out of state
                casino partner, we focus only on the Las Vegas and surrounding
                area and are NOT open to the public.
              </p>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="bg-zinc-800 px-6 sm:px-8 py-4 sm:py-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Manufacturer Websites
              </h2>
              <p className="text-sm sm:text-base text-gray-300 mt-2">
                Direct links to our trusted manufacturers' catalogs
              </p>
            </div>
            <div className="p-4 sm:p-8">
              <VendorCatalogsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
