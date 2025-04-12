"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ApiTestPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [envData, setEnvData] = useState(null);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const checkEnvironment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/env-test");
      const data = await response.json();
      setEnvData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check environment"
      );
    } finally {
      setLoading(false);
    }
  };

  const testPricingApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pricing/test");
      const data = await response.json();
      setApiTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test API");
    } finally {
      setLoading(false);
    }
  };

  // Display unauthorized message if not a superuser
  if (!session?.user?.isSuperuser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p>You must be a superuser to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            Environment Variables Test
          </h2>
          <button
            onClick={checkEnvironment}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-4"
          >
            {loading ? "Loading..." : "Check Environment Variables"}
          </button>

          {envData && (
            <div className="mt-4 p-4 bg-gray-50 rounded overflow-auto">
              <pre className="text-sm">{JSON.stringify(envData, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            Pricing API Connection Test
          </h2>
          <button
            onClick={testPricingApi}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-4"
          >
            {loading ? "Loading..." : "Test Pricing API Connection"}
          </button>

          {apiTestResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded overflow-auto">
              <pre className="text-sm">
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
