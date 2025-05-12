"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useSearch } from "@/contexts/SearchContext";
import CategoryNav from "./CategoryNav";
import { useSalesTeamVenue } from "@/contexts/SalesTeamVenueContext";

const DEFAULT_VENUES = [
  { name: "R", id: 94670 },
  { name: "M", id: 94669 },
  { name: "H", id: 94668 },
];

export default function Header() {
  const { data: session, status, update } = useSession();
  const [salesVenueInput, setSalesVenueInput] = useState<string>("");
  const { salesVenue, setSalesVenue } = useSalesTeamVenue();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const [isMobileVenueDropdownOpen, setIsMobileVenueDropdownOpen] =
    useState(false);
  const { isSearchVisible, setIsSearchVisible } = useSearch();
  const router = useRouter();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const isVenuePage = pathname?.includes("/venues/");
  const dropdownRef = useRef<HTMLLIElement>(null);
  const venueDropdownRef = useRef<HTMLLIElement>(null);

  // Force refresh session when component mounts and periodically
  useEffect(() => {
    const updateSession = async () => {
      if (status === "loading") {
        await update();
      }
    };

    // Initial update
    updateSession();

    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(updateSession, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [status, update]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Add click outside handler for both dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        venueDropdownRef.current &&
        !venueDropdownRef.current.contains(event.target as Node)
      ) {
        setIsVenueDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile dropdowns when search becomes visible
  useEffect(() => {
    if (isSearchVisible) {
      setIsMobileDropdownOpen(false);
      setIsMobileVenueDropdownOpen(false);
    }
  }, [isSearchVisible]);

  const handleSetSalesVenue = () => {
    const venueNumber = Number(salesVenueInput);
    if (!isNaN(venueNumber) && salesVenueInput.length === 5) {
      setSalesVenue(venueNumber);
      setSalesVenueInput("");
    }
  };

  const handleDefaultVenueSelect = (venueId: number) => {
    setSalesVenue(venueId);
    setSalesVenueInput("");
  };

  const handleClearVenue = () => {
    setSalesVenue(0);
    setSalesVenueInput("");
  };

  return (
    <header className="bg-zinc-800 sticky top-0 z-50 shadow-md w-full">
      {/* Top bar */}
      <div className="bg-zinc-800 py-2 text-sm w-full">
        <div className="container mx-auto px-4 flex justify-end items-center">
          <div className="flex gap-4">
            {session ? (
              <>
                {session.user?.isSuperuser && (
                  <Link
                    href="/admin"
                    className="text-gray-100 hover:text-white"
                  >
                    Admin
                  </Link>
                )}
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsSearchVisible(!isSearchVisible);
                    if (!isSearchVisible) {
                      // Close mobile dropdowns when opening search
                      setIsMobileDropdownOpen(false);
                      setIsMobileVenueDropdownOpen(false);
                    }
                  }}
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
              <div className="py-2 px-4 space-y-2">
                <Link
                  href="/"
                  className="block text-gray-300 hover:text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsMobileDropdownOpen(false);
                  }}
                >
                  Home
                </Link>
                <div>
                  <button
                    onClick={() =>
                      setIsMobileDropdownOpen(!isMobileDropdownOpen)
                    }
                    className="flex items-center justify-between w-full text-gray-300 hover:text-white"
                  >
                    Products
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        isMobileDropdownOpen ? "rotate-180" : ""
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
                  {isMobileDropdownOpen && (
                    <div className="pl-4 mt-2">
                      <CategoryNav
                        isMobile
                        onClose={() => {
                          setIsMobileDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      />
                    </div>
                  )}
                </div>
                <Link
                  href="/about"
                  className="block text-gray-300 hover:text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsMobileDropdownOpen(false);
                  }}
                >
                  About Us
                </Link>
                <Link
                  href="/showroom"
                  className="block text-gray-300 hover:text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsMobileDropdownOpen(false);
                  }}
                >
                  Showroom
                </Link>
                <Link
                  href="/contact"
                  className="block text-gray-300 hover:text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsMobileDropdownOpen(false);
                  }}
                >
                  Contact
                </Link>
                {session?.user?.venues && session.user.venues.length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setIsMobileVenueDropdownOpen(!isMobileVenueDropdownOpen)
                      }
                      className="flex items-center justify-between w-full text-gray-300 hover:text-white"
                    >
                      Venue Products
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isMobileVenueDropdownOpen ? "rotate-180" : ""
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
                    {isMobileVenueDropdownOpen && (
                      <div className="pl-4 mt-2 space-y-2">
                        {session.user.venues.map((venue) => (
                          <Link
                            key={venue.trxVenueId}
                            href={`/venues/${venue.trxVenueId}`}
                            className="block text-gray-300 hover:text-white"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setIsMobileDropdownOpen(false);
                              setIsMobileVenueDropdownOpen(false);
                            }}
                          >
                            {venue.venueName}
                          </Link>
                        ))}
                      </div>
                    )}
                    {session?.user?.isSalesTeam && (
                      <div className="pl-4 mt-4 space-y-2">
                        <div className="text-gray-300">
                          Sales Team Venue Control
                        </div>
                        <div className="flex justify-between items-center">
                          {salesVenue > 0 && (
                            <>
                              <div className="text-sm text-gray-400">
                                Current Venue: {salesVenue}
                              </div>
                              <button
                                onClick={handleClearVenue}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                              >
                                Clear Venue
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <select
                            className="border border-gray-300 rounded-md p-2 text-black"
                            onChange={(e) =>
                              handleDefaultVenueSelect(Number(e.target.value))
                            }
                            value={salesVenue || ""}
                          >
                            <option value="">Select Venue</option>
                            {DEFAULT_VENUES.map((venue) => (
                              <option key={venue.id} value={venue.id}>
                                {venue.name} - {venue.id}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-row gap-2">
                            <input
                              type="text"
                              maxLength={5}
                              placeholder="Custom Venue ID"
                              value={salesVenueInput}
                              className="border border-gray-300 rounded-md p-2 w-32 text-black"
                              onChange={(e) =>
                                setSalesVenueInput(
                                  e.target.value.replace(/\D/g, "").slice(0, 5)
                                )
                              }
                            />
                            <button
                              onClick={handleSetSalesVenue}
                              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                              disabled={salesVenueInput.length !== 5}
                            >
                              Set Venue
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TODO: Add order history back in once joe finishes api */}
                {/* {session?.user && (
                  <Link
                    href="/orders"
                    className="block text-gray-300 hover:text-white"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsMobileDropdownOpen(false);
                    }}
                  >
                    Order History
                  </Link>
                )} */}
              </div>
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
            <li className="relative" ref={dropdownRef}>
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
            {session?.user?.venues && session.user.venues.length > 0 && (
              <li className="relative" ref={venueDropdownRef}>
                <button
                  onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                  className="hover:text-blue-200 flex items-center gap-1"
                >
                  Venue Products
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isVenueDropdownOpen ? "rotate-180" : ""
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
                {isVenueDropdownOpen && (
                  <div className="absolute top-full right-0 w-64 bg-zinc-800 shadow-lg rounded-b-lg py-2 z-50">
                    <ul className="py-1">
                      {session.user.venues.map((venue) => (
                        <li key={venue.trxVenueId}>
                          <Link
                            href={`/venues/${venue.trxVenueId}`}
                            className="block px-4 py-2 text-gray-300 hover:bg-zinc-700 hover:text-white"
                            onClick={() => setIsVenueDropdownOpen(false)}
                          >
                            {venue.venueName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )}
            {session?.user && (
              <li>
                <Link href="/orders" className="hover:text-blue-200">
                  Order History
                </Link>
              </li>
            )}
            {session?.user?.isSalesTeam && (
              <li className="ml-auto">
                <div className="flex items-center gap-2">
                  {salesVenue > 0 ? (
                    <>
                      <div className="text-sm text-gray-400">
                        Venue: {salesVenue}
                      </div>
                      <button
                        onClick={handleClearVenue}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Clear
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">
                      No Venue Selected
                    </div>
                  )}
                  <select
                    className="border border-gray-300 rounded-md p-1 text-black text-sm"
                    onChange={(e) =>
                      handleDefaultVenueSelect(Number(e.target.value))
                    }
                    value={salesVenue || ""}
                  >
                    <option value="">Select Venue</option>
                    {DEFAULT_VENUES.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.id}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="Custom Venue ID"
                    value={salesVenueInput}
                    className="border border-gray-300 rounded-md p-1 w-32 text-black text-sm"
                    onChange={(e) =>
                      setSalesVenueInput(
                        e.target.value.replace(/\D/g, "").slice(0, 5)
                      )
                    }
                  />
                  <button
                    onClick={handleSetSalesVenue}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                    disabled={salesVenueInput.length !== 5}
                  >
                    Set Venue
                  </button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}
