"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState<{
    message: string;
    code?: string;
  } | null>(null);

  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !isValidEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/account-request");
          return;
        }

        if (data.code === "NO_PHONE") {
          setError({
            message:
              data.message ||
              "No phone number on file. Please contact State Restaurant.",
            code: data.code,
          });
          return;
        }

        throw new Error(data.error);
      }

      router.push(`/login/verify?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error(error);
      setError({
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 
              ${emailError ? "border-red-500" : "border-gray-300"}`}
            required
            disabled={isLoading}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            {error.code === "NO_PHONE" && (
              <>
                <p className="text-red-700">{error.message}</p>
                <p className="text-sm text-red-600 mt-1">
                  (702) 733-1515 or info@staterestaurant.com
                </p>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors
            ${isLoading || emailError ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isLoading || !!emailError}
        >
          {isLoading ? "Sending..." : "Send Login Code"}
        </button>
      </form>
    </div>
  );
}
