/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

/* eslint-disable react/no-unescaped-entities */
export default function VendorCatalogsPage() {
  const vendors = [
    { name: "10 Strawberry St", url: "https://tenstrawberrystreet.com/" },
    { name: "American Metal Craft", url: "https://www.amnow.com/" },
    { name: "BauscherHepp", url: "https://bauscherhepp.com/" },
    { name: "Bon Chef, Inc.", url: "https://www.bonchef.com/" },
    { name: "Cactus Mat Mfg. Co.", url: "https://www.cactusmat.com/" },
    { name: "Cal-Mil Plastics", url: "https://www.calmil.com/" },
    { name: "Cambro Manufacturing Co.", url: "https://www.cambro.com/" },
    { name: "Cardinal Intern'l", url: "https://www.cardinalfoodservice.com/" },
    { name: "Carlisle", url: "https://www.carlislefsp.com/" },
    { name: "Cooper Instruments", url: "https://www.cooper-atkins.com/" },
    { name: "Eastern Tabletop", url: "https://www.easterntabletop.com/" },
    { name: "EMI Yoshi", url: "https://www.emiyoshi.com/" },
    { name: "Front Of The House", url: "https://www.frontofthehouse.com/" },
    { name: "G E T Enterprises, Inc.", url: "https://get-melamine.com/" },
    { name: "Geneva Carts", url: "https://www.genevadesigns.com/" },
    { name: "Lakeside Manufacturing", url: "https://www.elakeside.com/" },
    { name: "Impulse", url: "https://impulseenterprises.com/" },
    { name: "Libbey", url: "https://foodservice.libbey.com/" },
    { name: "Mudial", url: "https://mudialinc.com/" },
    { name: "Myco Tableware", url: "https://www.mycotableware.com/" },
    { name: "Narumi", url: "https://narumi.co.jp/eng/" },
    { name: "Oneida", url: "https://www.foodservice.oneida.com/" },
    {
      name: "Orion Trading Corporation",
      url: "https://www.oriontradingcorp.com/",
    },
    { name: "Packnwood", url: "https://www.packnwood.com/" },
    { name: "Paderno World Cuisine", url: "https://www.paderno.com/" },
    { name: "RCP Design", url: "https://www.rcpdesign.net/" },
    { name: "RAK Porcelain", url: "https://www.rakporcelain.com/" },
    { name: "Revol USA", url: "https://www.revol1768.com/" },
    { name: "Rosenthal", url: "https://www.rosenthal.de/en/" },
    { name: "San Jamar", url: "https://www.sanjamar.com/" },
    { name: "Service Ideas Inc.", url: "https://www.serviceideas.com/" },
    { name: "Spill-Stop", url: "https://www.spillstop.com/" },
    { name: "Spring USA", url: "https://www.springusa.com/" },
    { name: "Staub", url: "https://www.zwilling.com/us/staub/" },
    { name: "Steelite International", url: "https://www.steelite.com/" },
    { name: "Tablecraft Prod Co", url: "https://www.tablecraft.com/" },
    { name: "Thunder Group, Inc.", url: "https://www.thundergroup.com/" },
    { name: "Tuxton", url: "https://www.tuxton.com/" },
    { name: "Vertex China", url: "https://www.vertexchina.com/" },
    { name: "Victorinox Swiss Army", url: "https://www.victorinox.com/" },
    { name: "Villeroy & Boch", url: "https://www.villeroy-boch.com/" },
    { name: "Vollrath Company", url: "https://www.vollrath.com/" },
    {
      name: "Waring Products",
      url: "https://www.waringcommercialproducts.com/",
    },
    { name: "Winco Industries Co.", url: "https://www.wincous.com/" },
    { name: "Zwilling J.A. Henckels, LLC", url: "https://www.zwilling.com/" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-zinc-900 text-white py-20">
        <div className="absolute inset-0 z-0 opacity-50">
          <img
            src="/StateHeroImage.webp"
            alt="Catalog Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Product Catalogs
          </h1>
          <p className="text-xl text-center max-w-3xl mx-auto text-gray-200">
            Browse our extensive collection of catalogs and resources
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6 mb-12">
            <div className="bg-zinc-50 p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                State Catalog
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Whether looking for a specific manufacturer, or looking for
                items regularly stocked, you will find it here. Our "State
                Catalog" should be your first source for shopping products. It
                is a duplicate to our printed catalog and contains popular items
                for our industry, as well as containing the most stocked items.
                You can browse by category, or search for specific products
                using key words.
              </p>
              <Link href="/products">
                <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-md">
                  View State Catalog
                </button>
              </Link>
            </div>

            <div className="bg-zinc-50 p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Supplemental Catalog
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Our supplemental catalog contains an expanded listing of
                products representing additional categories such as
                refrigeration, sanitation, transport, light equipment, and heavy
                equipment. You will also find some additional tabletop and
                kitchen items that may not be included in our primary catalog.
                This is available upon request, reach out to us to get your
                copy.
              </p>
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
            <div className="bg-zinc-800 px-8 py-6">
              <h2 className="text-xl font-bold text-white">
                Manufacturer Websites
              </h2>
              <p className="text-gray-300 mt-2">
                Direct links to our trusted manufacturers' catalogs
              </p>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                {vendors.map((vendor) => (
                  <a
                    key={vendor.name}
                    href={vendor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 hover:bg-zinc-50 p-2 rounded-lg transition-colors"
                  >
                    <span className="text-gray-700 group-hover:text-blue-600">
                      {vendor.name}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
