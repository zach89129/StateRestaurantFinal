import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";
import { Suspense } from "react";
import { SearchProvider } from "@/contexts/SearchContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "State Restaurant Equipment",
  description:
    "Premier restaurant equipment and supply specialists in Las Vegas",
  icons: {
    icon: "/StateIcon.png", // /public/StateIcon.png
    shortcut: "/StateIcon.png", // /public/StateIcon.png
    apple: "/StateIcon.png", // /public/StateIcon.png
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/StateIcon.png",
    },
  },
};

// Set environment variables for the client
export const dynamic = "force-dynamic"; // Disables static optimization for this page

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            <SearchProvider>
              <Header />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </SearchProvider>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
