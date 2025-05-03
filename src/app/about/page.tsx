"use client";
import { PageContainer } from "@/components/ui/PageContainer";
import { Section } from "@/components/ui/Section";
import { ImageCard } from "@/components/ui/ImageCard";
import { CallToAction } from "@/components/ui/CallToAction";
import { LogoCarousel } from "@/components/ui/LogoCarousel";

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

  return (
    <PageContainer title="About Us">
      <div className="space-y-16">
        <Section title="Reputation">
          Our Company is known for, and has been built upon, our outstanding
          reputation for quality, service and strong business ethics. No matter
          what your needs, we assure you they will be done with your best
          interest in mind.
        </Section>

        <Section title="National Partnership">
          State Restaurant Equipment Company is a proud member of SEFA, Inc., a
          nationwide network of premier foodservice equipment and supply
          specialists. SEFA links manufacturers and dealers together to provide
          you with knowledgeable salespeople, quality products and competitive
          pricing.
        </Section>

        <ImageCard
          src="/StateBuildingAbout.webp"
          alt="State Restaurant Equipment Store Front"
          title="Our Las Vegas Showroom"
          description="Visit our 80,000 sq ft showroom and warehouse facility in Las Vegas, featuring the latest in restaurant equipment and supplies."
          className="my-20"
        />

        <Section title="Our Organization">
          We are built on the concept that our personnel are the best in the
          industry. Our sales staff can assist you when placing your order by
          phone and in person. If you should decide to visit our showroom and
          warehouse facility, we welcome you.
        </Section>

        {/* Gradient Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

        <CallToAction phoneNumber="(702) 733-1515">
          <p>
            Let us put our proven reputation for quality, service and value to
            work for you. Whether you're remodeling or opening a new facility,
            State Restaurant Equipment Company is your link to success.
          </p>
          <p className="mt-6">
            We serve every major resort in Las Vegas, Laughlin, Primm, and
            Mesquite, including the following and more:
          </p>
        </CallToAction>

        <LogoCarousel logos={clients} />
      </div>
    </PageContainer>
  );
}
