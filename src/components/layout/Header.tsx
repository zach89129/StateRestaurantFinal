"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVenuesOpen, setIsVenuesOpen] = useState(false);
  const router = useRouter();
  const { itemCount } = useCart();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleNavigate = (collectionName: string) => {
    router.push(`/products/${collectionName}?collection=${collectionName}`);
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-zinc-800">
      {/* Top bar with contact info */}
      <div className="bg-zinc-800 py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <a
              href="tel:+18002517900"
              className="text-gray-100 hover:text-white"
            >
              1-702-733-1515
            </a>
          </div>
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
                <Link
                  href="/login"
                  className="text-gray-100 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-gray-100 hover:text-gray-900"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-0 bg-zinc-800">
        <div className="flex bg-zinc-800 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/StateLogoHeader.webp"
              alt="State Restaurant Equipment & Supply"
              width={150}
              height={60}
              priority
            />
          </Link>

          {/* Search */}
          <div className="flex-grow mx-12">
            <SearchBar />
          </div>

          {/* Cart */}
          <div className="flex-shrink-0">
            {session?.user ? (
              <Link
                href="/cart"
                className="flex items-center gap-2 text-gray-100 hover:text-white"
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                    {itemCount}
                  </span>
                )}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-zinc-800 text-white">
        <div className="container mx-auto px-4">
          <ul className="flex gap-8 py-4">
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
                <div className="absolute top-full left-0 bg-zinc-700 rounded shadow-lg py-2 min-w-[200px] z-50">
                  <Link
                    href="/products"
                    className="block px-4 py-2 hover:bg-zinc-600"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    All Products
                  </Link>
                  <button
                    onClick={() => handleNavigate("glassware")}
                    className="block px-4 py-2 hover:bg-zinc-600 w-full text-left"
                  >
                    Glassware
                  </button>
                </div>
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
            {session?.user?.venues && session.user.venues.length > 0 && (
              <li className="relative">
                <button
                  onClick={() => setIsVenuesOpen(!isVenuesOpen)}
                  className="hover:text-blue-200 flex items-center gap-1"
                >
                  Your Venues
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isVenuesOpen ? "rotate-180" : ""
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

                {/* Dropdown Menu */}
                {isVenuesOpen && (
                  <div className="absolute top-full left-0 bg-zinc-700 rounded shadow-lg py-2 min-w-[200px] z-50">
                    {session.user.venues.map((venue) => (
                      <Link
                        key={venue.venueName}
                        href={`/venues/${venue.trxVenueId}`}
                        className="block px-4 py-2 hover:bg-zinc-600 text-white"
                        onClick={() => setIsVenuesOpen(false)}
                      >
                        {venue.venueName}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}
