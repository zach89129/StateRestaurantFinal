/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";

export default function VideoTutorialPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 text-center">
            State Restaurant Video Tutorials
          </h1>

          {/* Main Tutorial Video */}
          <div className="bg-zinc-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg mb-8 sm:mb-12 text-center">
            <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-900">
              How to use the search, filter and more like this functionality
            </h2>
            <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-8">
              Learn how to effectively use our website's features to find
              exactly what you're looking for.
            </p>
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-lg sm:shadow-2xl">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.youtube.com/embed/M0HMtk82mN4"
                  title="State Restaurant Equipment Website Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Key Features Section */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900">
              Key Features Covered
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-blue-600 mb-2">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                  Advanced Search
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Learn how to use filters and search to find products quickly
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-blue-600 mb-2">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                  Similar Products
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Discover related items using our "More Like This" feature
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="text-blue-600 mb-2">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">
                  Product Categories
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Navigate through our organized product categories
                </p>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="bg-zinc-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
              Additional Resources
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/products"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm sm:text-base"
              >
                <span>Browse Products</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/showroom"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm sm:text-base"
              >
                <span>Visit Our Showroom</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Need more help? Don't hesitate to{" "}
              <a href="/contact" className="text-blue-600 hover:text-blue-800">
                contact us
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
