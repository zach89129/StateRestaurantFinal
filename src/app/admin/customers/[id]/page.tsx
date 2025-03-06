"use client";

import { use } from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Venue {
  trxVenueId: number;
  venueName: string;
}

interface Customer {
  trxCustomerId: number;
  email: string;
  phone: string | null;
  seePrices: boolean;
  updatedAt: Date;
  venues: Venue[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCustomerPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchVenue, setSearchVenue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);

  useEffect(() => {
    fetchCustomer(resolvedParams.id);
  }, [resolvedParams.id]);

  const searchVenues = useCallback(async () => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/admin/venues/search?query=${encodeURIComponent(searchVenue)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to search venues");
      }
      setAvailableVenues(
        data.venues.filter(
          (venue: Venue) =>
            !customer?.venues.some((v) => v.trxVenueId === venue.trxVenueId)
        )
      );
    } catch (error) {
      console.error("Error searching venues:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchVenue, customer?.venues]);

  useEffect(() => {
    if (searchVenue) {
      searchVenues();
    } else {
      setAvailableVenues([]);
    }
  }, [searchVenue, searchVenues]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/admin/customers?id=${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch customer");
      }

      setCustomer(data.customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch customer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenue = async (venue: Venue) => {
    if (!customer) return;
    try {
      const response = await fetch(
        `/api/admin/customers/${customer.trxCustomerId}/venues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId: venue.trxVenueId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add venue");
      }

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              venues: [...prev.venues, venue],
            }
          : null
      );
      setAvailableVenues((prev) =>
        prev.filter((v) => v.trxVenueId !== venue.trxVenueId)
      );
    } catch (error) {
      console.error("Error adding venue:", error);
      setError(error instanceof Error ? error.message : "Failed to add venue");
    }
  };

  const handleRemoveVenue = async (venueId: number) => {
    if (!customer) return;
    try {
      const response = await fetch(
        `/api/admin/customers/${customer.trxCustomerId}/venues/${venueId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove venue");
      }

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              venues: prev.venues.filter((v) => v.trxVenueId !== venueId),
            }
          : null
      );
    } catch (error) {
      console.error("Error removing venue:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove venue"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update customer");
      }

      router.push("/admin/customers");
    } catch (error) {
      console.error("Error updating customer:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update customer"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === "trxCustomerId") {
      const numValue = value === "" ? 0 : parseInt(value);
      setCustomer((prev) => (prev ? { ...prev, [name]: numValue } : null));
      return;
    }

    setCustomer((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCustomer((prev) => (prev ? { ...prev, [name]: checked } : null));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Customer not found</h2>
        <button
          onClick={() => router.push("/admin/customers")}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Return to customers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
        <button
          onClick={() => router.push("/admin/customers")}
          className="text-gray-600 hover:text-gray-900"
        >
          Back to Customers
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={customer.email}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={customer.phone || ""}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label
            htmlFor="trxCustomerId"
            className="block text-sm font-medium text-gray-700"
          >
            TRX Customer ID
          </label>
          <input
            type="number"
            id="trxCustomerId"
            name="trxCustomerId"
            value={customer.trxCustomerId}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="seePrices"
            name="seePrices"
            checked={customer.seePrices}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="seePrices"
            className="ml-2 block text-sm text-gray-900"
          >
            Can see prices
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Associated Venues
            </h3>
            <div className="mb-4">
              <label htmlFor="venueSearch" className="sr-only">
                Search Venues
              </label>
              <input
                type="text"
                id="venueSearch"
                placeholder="Search venues to add..."
                value={searchVenue}
                onChange={(e) => setSearchVenue(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              {searchLoading && (
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              )}
              {availableVenues.length > 0 && (
                <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                  {availableVenues.map((venue) => (
                    <li
                      key={venue.trxVenueId}
                      className="p-3 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {venue.venueName}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {venue.trxVenueId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddVenue(venue)}
                        className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {customer.venues.length > 0 ? (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {customer.venues.map((venue) => (
                  <li
                    key={venue.trxVenueId}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {venue.venueName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {venue.trxVenueId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVenue(venue.trxVenueId)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No venues associated</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/customers")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
