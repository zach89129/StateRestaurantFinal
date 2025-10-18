import { PageContainer } from "@/components/ui/PageContainer";
import { TeamMemberCard } from "@/components/ui/TeamMemberCard";
import { ContactCard } from "@/components/ui/ContactCard";

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
      name: "Ashley McClure",
      title: "Account Executive",
      phone: "(702) 733-1515",
      image: "/team/StateAshley.jpg",
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
    <PageContainer title="Contact">
      {/* Team Members Grid */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-20">
        {teamMembers.map((member) => (
          <TeamMemberCard
            key={member.name}
            name={member.name}
            title={member.title}
            image={member.image}
          />
        ))}
      </div>

      {/* General Inquiries Card */}
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <ContactCard title="General Inquiries">
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
        </ContactCard>
      </div>
    </PageContainer>
  );
}
