import Image from "next/image";

interface TeamMember {
  name: string;
  title: string;
  phone: string;
  image: string;
}

export default function ContactPage() {
  const teamMembers: TeamMember[] = [
    {
      name: "Scott Miller",
      title: "President",
      phone: "(702) 733-1515",
      image: "/team/StateScott.avif",
    },
    {
      name: "Joe Stafford",
      title: "Vice President Sales",
      phone: "(702) 733-1515",
      image: "/team/StateJoe.webp",
    },
    {
      name: "Candice DeLanis",
      title: "Account Executive",
      phone: "(702) 733-1515",
      image: "/team/StateCandice.avif",
    },
    {
      name: "Matthew O'Neill",
      title: "Account Executive",
      phone: "(702) 733-1515",
      image: "/team/StateMatthew.avif",
    },
    {
      name: "Sean Stafford",
      title: "Account Executive",
      phone: "(702) 733-1515",
      image: "/team/StateSean.avif",
    },
    {
      name: "John Holley",
      title: "Account Executive",
      phone: "(702) 733-1515",
      image: "/team/StateJohn.webp",
    },
    {
      name: "Kim Garnett-Livengood",
      title: "Purchasing Manager",
      phone: "(702) 733-1515",
      image: "/team/StateKim.webp",
    },
    {
      name: "Larry Doroff",
      title: "Equipment Specialist",
      phone: "(702) 733-1515",
      image: "/team/StateLarry.webp",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Main Title - Simplified for mobile */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-16 text-gray-900">
          <span className="relative inline-block">Contact</span>
        </h1>

        {/* Team Members Grid - Always 2 columns, 4 on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-20">
          {teamMembers.map((member) => (
            <div key={member.name} className="text-center group">
              {/* Image container - Smaller on mobile */}
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-48 lg:h-48 mx-auto mb-2 sm:mb-3 lg:mb-4 rounded-lg overflow-hidden shadow-md transition-transform duration-300 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-contain"
                />
              </div>
              {/* Text content - Smaller on mobile */}
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                {member.name}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 italic mb-1 sm:mb-2">
                {member.title}
              </p>
              {/* Phone link - Touch-friendly
              <a
                href={`tel:${member.phone.replace(/[^0-9]/g, "")}`}
                className="text-gray-800 hover:text-blue-600 transition-colors duration-300 inline-flex items-center gap-1 text-xs sm:text-sm lg:text-base py-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="whitespace-nowrap">{member.phone}</span>
              </a> */}
            </div>
          ))}
        </div>

        {/* General Inquiries Card - Mobile optimized */}
        <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-6 flex items-center justify-center gap-2">
              General Inquiries
            </h2>
            <p className="text-sm sm:text-base text-gray-900 mb-4 sm:mb-6">
              Call and ask for any of our team members!
            </p>
            <div className="space-y-3">
              <p className="text-gray-800 flex items-center justify-center gap-2 text-sm sm:text-base">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                3163 South Highland Drive
              </p>
              <p className="text-gray-800 text-sm sm:text-base">
                Las Vegas, Nevada 89109
              </p>
              <a
                href="tel:7027331515"
                className="text-gray-800 hover:text-blue-600 transition-colors duration-300 inline-flex items-center gap-2 py-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="font-semibold whitespace-nowrap text-sm sm:text-base">
                  (702) 733-1515
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
