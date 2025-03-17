"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useSearch } from "@/contexts/SearchContext";
import CategoryNav from "./CategoryNav";

export default function Header() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSearchVisible, setIsSearchVisible } = useSearch();
  const router = useRouter();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isVenuePage = pathname?.includes("/venues/");

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-zinc-800 sticky top-0 z-50 shadow-md w-full">
      {/* Top bar */}
      <div className="bg-zinc-800 py-2 text-sm w-full">
        <div className="container flex justify-end items-center ml-8">
          <div className="flex gap-4">
            {session ? (
              <>
                <Link
                  href="/account"
                  className="text-gray-100 hover:text-white"
                >
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-100 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-100 hover:text-white">
                  Login
                </Link>
                <Link
                  href="/login/request-account"
                  className="text-gray-100 hover:text-white"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="w-full bg-zinc-800">
        <div className="container mx-auto px-4 py-2 lg:py-2">
          <div className="flex flex-col lg:block">
            {/* Mobile Header - Flex row for logo and controls */}
            <div className="flex items-center justify-between lg:hidden">
              {/* Logo - Smaller on mobile */}
              <Link href="/" className="block -ml-2 -mt-6">
                <Image
                  src="/StateLogoHeader.webp"
                  alt="State Restaurant Equipment & Supply"
                  width={100}
                  height={40}
                  className="lg:w-[180px] lg:h-[72px]"
                  priority
                />
              </Link>

              {/* Mobile Controls */}
              <div className="flex items-center gap-3 mr-[-2rem]">
                <button
                  onClick={() => setIsSearchVisible(!isSearchVisible)}
                  className="text-white p-2 hover:text-blue-200"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
                {session?.user && (
                  <Link
                    href="/cart"
                    className="text-white p-2 hover:text-blue-200"
                  >
                    <div className="relative">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white p-2 hover:text-blue-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        isMobileMenuOpen
                          ? "M6 18L18 6M6 6l12 12"
                          : "M4 6h16M4 12h16M4 18h16"
                      }
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu - Collapsible */}
            <div
              className={`lg:hidden transition-all duration-300 overflow-hidden ${
                isMobileMenuOpen ? "max-h-screen" : "max-h-0"
              }`}
            >
              <CategoryNav
                isMobile
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </div>

            {/* Mobile Search - Collapsible */}
            <div
              className={`lg:hidden transition-all duration-300 overflow-hidden ${
                isSearchVisible
                  ? "max-h-20 opacity-100 mt-2"
                  : "max-h-0 opacity-0"
              }`}
            >
              <SearchBar disabled={isVenuePage} />
            </div>

            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden lg:block">
              {/* Desktop Layout Container */}
              <div className="flex items-center gap-8">
                {/* Logo Section */}
                <div className="-ml-4">
                  <Link href="/" className="block">
                    <Image
                      src="/StateLogoHeader.webp"
                      alt="State Restaurant Equipment & Supply"
                      width={120}
                      height={48}
                      className="lg:w-[180px] lg:h-[72px]"
                      priority
                    />
                  </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="flex items-center gap-8 flex-grow">
                  <div className="flex-grow">
                    <SearchBar disabled={isVenuePage} />
                  </div>
                  {session?.user && (
                    <Link
                      href="/cart"
                      className="flex items-center text-white hover:text-blue-200"
                    >
                      <div className="relative">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        {itemCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {itemCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-zinc-800 text-white w-full">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <ul className="hidden lg:flex gap-8 py-2">
            <li>
              <Link href="/" className="hover:text-blue-200">
                Home
              </Link>
            </li>
            <li className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="hover:text-blue-200 flex items-center gap-1"
              >
                Products
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <CategoryNav onClose={() => setIsDropdownOpen(false)} />
              )}
            </li>
            <li>
              <Link href="/about" className="hover:text-blue-200">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/showroom" className="hover:text-blue-200">
                Showroom
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-blue-200">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
