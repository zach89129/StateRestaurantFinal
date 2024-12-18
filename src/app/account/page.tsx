"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Venue {
  name: string;
}

interface UserProfile {
  email: string;
  phone: string;
  name: string;
  venues: Venue[];
}

export default function AccountPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch(
          `/api/customers/info?email=${encodeURIComponent(session.user.email)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProfile(data.customer);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-lg text-gray-700">
              Please log in to view your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Account Information
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your account details
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Information
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-base text-gray-900">
                {profile?.name || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-base text-gray-900">{profile?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-base text-gray-900">
                {profile?.phone || "Not provided"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Venues
          </h2>
          {profile?.venues && profile.venues.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {profile.venues.map((venue, index) => (
                <li key={index} className="py-3 flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <span className="ml-4 text-base text-gray-900">
                    {venue.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">
              No venues associated with this account.
            </p>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                To update your account information or make changes to your
                venues, please contact State Restaurant Supply directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
