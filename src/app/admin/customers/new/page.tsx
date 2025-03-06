"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Venue {
  trxVenueId: number;
  venueName: string;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    trxCustomerId: "",
    seePrices: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchVenue, setSearchVenue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedVenues, setSelectedVenues] = useState<Venue[]>([]);
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone || null,
          trxCustomerId: parseInt(formData.trxCustomerId),
          seePrices: formData.seePrices,
          venueIds: selectedVenues.map((v) => v.trxVenueId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      router.push("/admin/customers");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const searchVenues = async () => {
    if (!searchVenue.trim()) {
      setAvailableVenues([]);
      return;
    }

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
            !selectedVenues.some((v) => v.trxVenueId === venue.trxVenueId)
        )
      );
    } catch (error) {
      console.error("Error searching venues:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddVenue = (venue: Venue) => {
    setSelectedVenues((prev) => [...prev, venue]);
    setAvailableVenues((prev) =>
      prev.filter((v) => v.trxVenueId !== venue.trxVenueId)
    );
    setSearchVenue("");
  };

  const handleRemoveVenue = (trxVenueId: number) => {
    setSelectedVenues((prev) =>
      prev.filter((v) => v.trxVenueId !== trxVenueId)
    );
  };

  useEffect(() => {
    if (searchVenue) {
      const timeoutId = setTimeout(searchVenues, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailableVenues([]);
    }
  }, [searchVenue]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Add New Customer
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
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
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="trxCustomerId"
            className="block text-sm font-medium text-gray-700"
          >
            TRX Customer ID *
          </label>
          <input
            type="number"
            id="trxCustomerId"
            name="trxCustomerId"
            required
            value={formData.trxCustomerId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="seePrices"
            name="seePrices"
            checked={formData.seePrices}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label
            htmlFor="seePrices"
            className="ml-2 block text-sm text-gray-700"
          >
            Can see prices
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Venues</h3>
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
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
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

            {selectedVenues.length > 0 ? (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {selectedVenues.map((venue) => (
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
              <p className="text-sm text-gray-500">No venues selected</p>
            )}
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Customer"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/customers")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
