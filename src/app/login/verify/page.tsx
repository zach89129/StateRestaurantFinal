"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!email) {
      router.push("/login");
      return;
    }

    // If user is already authenticated, redirect them
    if (status === "authenticated" && session) {
      if (callbackUrl && callbackUrl !== "/") {
        router.push(callbackUrl);
      } else {
        router.push("/");
      }
    }

    // Countdown timer for resend button
    const timer =
      countdown > 0 && setInterval(() => setCountdown(countdown - 1), 1000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, email, router, status, session, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Proceed directly with sign in, NextAuth will handle validation

      // Get the origin for the complete callback URL
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      let fullCallbackUrl = callbackUrl;

      // Only prepend origin if it's a relative path and doesn't already have origin
      if (callbackUrl.startsWith("/")) {
        fullCallbackUrl = `${origin}${callbackUrl}`;
      } else if (!callbackUrl.startsWith("http")) {
        // If it's not an absolute URL and not a relative URL, make it absolute
        fullCallbackUrl = `${origin}/${callbackUrl}`;
      }

      const result = await signIn("credentials", {
        email,
        otp,
        redirect: false,
        callbackUrl: fullCallbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Force a page refresh to ensure session is picked up
      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      // Check if user is superuser to determine where to redirect
      try {
        const response = await fetch("/api/auth/check-role");

        if (response.ok) {
          const data = await response.json();

          if (data.isSuperuser) {
            window.location.href = "/admin";
            return;
          }
        }
      } catch (roleError) {
        console.error("Error checking role:", roleError);
        // Continue with normal flow if role check fails
      }

      // If there's a callback URL from a protected route, use it
      if (callbackUrl && callbackUrl !== "/") {
        window.location.href = callbackUrl;
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend verification code");
      }

      setOtp("");
      setCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Verify Your Identity
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the verification code sent to your phone
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <div className="mt-1">
              <input
                id="otp"
                name="otp"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0}
              className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
            >
              {countdown > 0
                ? `Resend code in ${countdown}s`
                : "Resend verification code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
