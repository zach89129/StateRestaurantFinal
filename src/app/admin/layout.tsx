"use client";

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white shadow rounded-lg p-4 h-fit">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="block px-4 py-2 rounded-md text-black hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/products"
                  className="block px-4 py-2 rounded-md text-black hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/customers"
                  className="block px-4 py-2 rounded-md text-black hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Customers
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/venues"
                  className="block px-4 py-2 rounded-md text-black hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Venues
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/promotions"
                  className="block px-4 py-2 rounded-md text-black hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Promotions
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/activity"
                  className="block px-4 py-2 rounded-md text-black hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  Login Activity
                </Link>
              </li>
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1 bg-white shadow rounded-lg p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
