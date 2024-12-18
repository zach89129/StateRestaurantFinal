import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [totalCustomers, totalProducts, totalVenues] = await Promise.all([
    prisma.customer.count(),
    prisma.product.count(),
    prisma.venue.count(),
  ]);

  return {
    totalCustomers,
    totalProducts,
    totalVenues,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-blue-900">Total Customers</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats.totalCustomers}
          </p>
          <Link
            href="/admin/customers"
            className="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
          >
            View all customers →
          </Link>
        </div>

        <div className="bg-green-50 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-green-900">Total Products</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.totalProducts}
          </p>
          <Link
            href="/admin/products"
            className="text-green-600 hover:text-green-700 text-sm mt-4 inline-block"
          >
            View all products →
          </Link>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-purple-900">Total Venues</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {stats.totalVenues}
          </p>
          <Link
            href="/admin/venues"
            className="text-purple-600 hover:text-purple-700 text-sm mt-4 inline-block"
          >
            View all venues →
          </Link>
        </div>
      </div>

      {/* Management Links */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">
              Customer Management
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/customers"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Manage Customers
                </Link>
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">
              Product Management
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/products"
                  className="text-green-600 hover:text-green-700"
                >
                  Manage Products
                </Link>
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">
              Venue Management
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/venues"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Manage Venues
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
