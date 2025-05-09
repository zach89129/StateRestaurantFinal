"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function InitialLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First check if email exists
      const checkEmailResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const emailData = await checkEmailResponse.json();

      if (!checkEmailResponse.ok) {
        if (checkEmailResponse.status === 404) {
          // Email not found, redirect to account request
          router.push(
            `/login/request-account?email=${encodeURIComponent(email)}`
          );
          return;
        }
        if (emailData.code === "NO_PHONE") {
          setError({
            message: emailData.message || "No phone number on file",
            code: emailData.code,
          });
          return;
        }
        throw new Error(emailData.error || "An error occurred");
      }

      // If email exists, proceed with OTP
      const otpResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        if (otpData.code === "NO_PHONE") {
          setError({
            message:
              otpData.message ||
              "No phone number on file. Please contact State Restaurant.",
            code: otpData.code,
          });
          return;
        }
        throw new Error(otpData.error || "An error occurred");
      }

      // If OTP sent successfully, redirect to verification page
      router.push(
        `/login/verify?email=${encodeURIComponent(
          email
        )}&callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Welcome
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to login or request an account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700">{error.message}</p>
              {error.code === "NO_PHONE" && (
                <>
                  <p className="text-sm text-red-600 mt-1">
                    (702) 733-1515 or info@staterestaurant.com
                  </p>
                </>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
