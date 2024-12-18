import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";
import { Suspense } from "react";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
