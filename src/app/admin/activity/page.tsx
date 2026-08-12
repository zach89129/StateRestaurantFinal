"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  formatActivityVenueLabel,
  type VenueFilter,
} from "@/lib/activityLogs";

interface ActivityLog {
  id: number;
  email: string;
  TIMESTAMP: string;
  hasVenue: boolean;
  venueNames: string[];
}

const VENUE_FILTERS: { value: VenueFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "has", label: "Has venue" },
  { value: "none", label: "No venue" },
];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && !session?.user?.isSuperuser) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.isSuperuser) {
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/admin/activity?venue=${encodeURIComponent(venueFilter)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch activity logs");
        }
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [status, session, venueFilter]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          User Login Activity
        </h2>
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-1 shadow-sm">
          {VENUE_FILTERS.map((filter) => {
            const isActive = venueFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setVenueFilter(filter.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No login activity found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.hasVenue
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formatActivityVenueLabel(log.venueNames ?? [])}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.TIMESTAMP
                        ? new Date(log.TIMESTAMP).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
