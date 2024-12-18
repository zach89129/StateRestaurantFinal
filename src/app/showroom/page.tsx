/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
export default function ShowroomPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-zinc-900 text-white py-20">
        <div className="absolute inset-0 z-0 opacity-50">
          <img
            src="/StateHeroImage.webp"
            alt="Showroom Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            State Restaurant Las Vegas Showroom
          </h1>
          <p className="text-xl text-center max-w-3xl mx-auto text-gray-200">
            Experience the finest selection of restaurant equipment and supplies
            in our state-of-the-art showroom
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Description Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Industry-Leading Showroom
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our showrooms have been hailed as the "best in the industry" and
              are regularly visited by Chefs, VP's of Food and Beverage, and
              executives from major casinos and restaurants. With four distinct
              areas, each one captures trendsetting tabletop items from leading
              manufacturers where you are sure to find just the right product to
              fit your needs.
            </p>
          </div>

          {/* Video Section */}
          <div className="bg-zinc-50 rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              Take a Virtual Tour
            </h2>
            <div className="relative rounded-xl overflow-hidden shadow-2xl">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.youtube.com/embed/wJIx3SyNe7w"
                  title="State Restaurant Equipment Showroom"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Visit Our Showroom
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Experience our showroom in person and let our experts help you
              find the perfect solutions for your business.
            </p>
            <div className="inline-flex items-center gap-4">
              <a
                href="tel:+17027331515"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                (702) 733-1515
              </a>
              <a
                href="https://www.google.com/maps/place/State+Restaurant+Equipment+Co/@36.1327486,-115.1790044,17z/data=!3m1!4b1!4m6!3m5!1s0x80c8c4101d7d23a7:0xc05df23572882a06!8m2!3d36.1327486!4d-115.1764295!16s%2Fg%2F1tf3p5bb?entry=ttu&g_ep=EgoyMDI0MTIxMS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-800 text-white px-8 py-3 rounded-lg hover:bg-zinc-700 transition-colors font-semibold flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
