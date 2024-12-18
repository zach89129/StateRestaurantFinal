import Image from "next/image";

export default function AboutPage() {
  const clients = [
    { name: "MGM Resorts", image: "/StateMGM.webp" },
    { name: "City Center", image: "/StateCityCenter.webp" },
    { name: "Wynn", image: "/StateWynn.webp" },
    { name: "Encore", image: "/StateEncore.webp" },
    { name: "The Venetian", image: "/StateVenetian.webp" },
    { name: "Station Casino", image: "/StateStationCasinos.webp" },
    { name: "M Resort", image: "/StateMResort.webp" },
    { name: "Caesars Entertainment", image: "/StateCaesars.avif" },
    { name: "Hard Rock", image: "/StateHardRock.avif" },
    { name: "Boyd Gaming", image: "/StateBoyd.webp" },
  ];

  const duplicatedClients = [...clients, ...clients];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-16 text-gray-900">
          <span className="relative inline-block">About Us</span>
        </h1>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="space-y-16">
            <section>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                <span className="inline-block w-2 h-8 bg-blue-600 mr-3"></span>
                Reputation
              </h3>
              <p className="text-gray-800 leading-relaxed pl-5 border-l-2 border-gray-200">
                Our Company is known for, and has been built upon, our
                outstanding reputation for quality, service and strong business
                ethics. No matter what your needs, we assure you they will be
                done with your best interest in mind.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                <span className="inline-block w-2 h-8 bg-blue-600 mr-3"></span>
                National Partnership
              </h3>
              <p className="text-gray-800 leading-relaxed pl-5 border-l-2 border-gray-200">
                State Restaurant Equipment Company is a proud member of SEFA,
                Inc., a nationwide network of premier foodservice equipment and
                supply specialists. SEFA links manufacturers and dealers
                together to provide you with knowledgeable salespeople, quality
                products and competitive pricing.
              </p>
            </section>

            <section className="relative h-[400px] w-full my-20 group">
              <div className="relative h-full w-full overflow-hidden rounded-lg shadow-lg bg-gray-100">
                <Image
                  src="/StateBuildingAbout.webp"
                  alt="State Restaurant Equipment Store Front"
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                    <h4 className="text-white text-xl font-semibold mb-2">
                      Our Las Vegas Showroom
                    </h4>
                    <p className="text-gray-200">
                      Visit our 30,000 sq ft showroom and warehouse facility in
                      Las Vegas, featuring the latest in restaurant equipment
                      and supplies.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
                <span className="inline-block w-2 h-8 bg-blue-600 mr-3"></span>
                Our Organization
              </h3>
              <p className="text-gray-800 leading-relaxed pl-5 border-l-2 border-gray-200">
                We are built on the concept that our personnel are the best in
                the industry. Our sales staff can assist you when placing your
                order by phone and in person. If you should decide to visit our
                showroom and warehouse facility, we welcome you.
              </p>
            </section>

            {/* Gradient Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

            <section className="text-center space-y-6 bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                Let us put our proven reputation for quality, service and value
                to work for you. Whether you're remodeling or opening a new
                facility, State Restaurant Equipment Company is your link to
                success.
              </p>
              <div className="font-bold text-xl sm:text-2xl text-gray-900 whitespace-nowrap">
                CALL NOW (702) 733-1515
              </div>
              <p className="text-gray-800">
                We serve every major resort in Las Vegas, Laughlin, Primm, and
                Mesquite, including the following and more:
              </p>
            </section>

            {/* Client Logos Carousel */}
            <section className="relative w-full overflow-hidden py-8 before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-white after:to-transparent">
              <div className="animate-scroll flex items-center gap-12 whitespace-nowrap">
                {duplicatedClients.map((client, index) => (
                  <div
                    key={`${client.name}-${index}`}
                    className="relative h-20 w-40 flex-shrink-0 hover:scale-110 transition-transform duration-300"
                  >
                    <Image
                      src={client.image}
                      alt={client.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
