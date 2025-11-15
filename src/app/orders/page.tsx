"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { MessageBox } from "@/components/ui/MessageBox";

interface OrderItem {
  product_id: string;
  description: string;
  title: string;
  sku: string;
  qty: number;
}

interface Order {
  id: number;
  venue_id: number;
  venue_name: string;
  date: string;
  status: string | null;
  customer_po: string | null;
  items: OrderItem[];
  trx_order_number: string | null;
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const response = await fetch("/api/orders/history");

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.error || "Failed to load orders");
        }
      } catch (err) {
        setError("An error occurred while fetching your order history");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <PageContainer title="Order History">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
      </PageContainer>
    );
  }

  if (status === "unauthenticated") {
    return (
      <PageContainer title="Order History">
        <MessageBox type="warning">
          Please{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            log in
          </Link>{" "}
          to view your order history.
        </MessageBox>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Order History">
        <MessageBox type="error">{error}</MessageBox>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Order History">
      {orders.length === 0 ? (
        <div className="text-gray-500">You don't have any orders yet.</div>
      ) : (
        <div className="space-y-8 overflow-x-hidden">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="bg-gray-50 p-4 flex flex-col sm:flex-row border-b">
                <div className="sm:w-1/3">
                  <h3 className="font-medium text-gray-900">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Placed on {format(new Date(order.date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 sm:w-2/3 flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Venue:</span>{" "}
                      {order.venue_name}
                    </p>
                    {order.trx_order_number && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">TRX #:</span>{" "}
                        {order.trx_order_number}
                      </p>
                    )}
                    {order.customer_po && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">PO:</span>{" "}
                        {order.customer_po}
                      </p>
                    )}
                  </div>
                  <div>
                    {/* <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === "new"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "imported"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status === "new"
                        ? "Processing"
                        : order.status === "imported"
                        ? "Imported"
                        : order.status || "Unknown"}
                    </span> */}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white">
                {/* Mobile view - stacked cards */}
                <div className="md:hidden space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="border-b pb-3">
                      <div className="mb-2">
                        <Link
                          href={`/product/${btoa(item.sku)}`}
                          className="text-blue-600 hover:underline font-medium break-words"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-900 flex flex-wrap justify-between">
                        <span className="mr-4 break-all">
                          Description: {item.description}
                        </span>
                        <span className="font-medium">Qty: {item.qty}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view - table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/product/${btoa(item.sku)}`}
                              className="text-blue-600 hover:underline"
                            >
                              {item.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {item.qty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
