"use client";

import { useState } from "react";

export default function TestApiPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/product-price-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: ["500ml amul cow milk", "5kg aashirvaad aata"],
          city: "Mumbai",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      setResults(data);
    } catch (err) {
      console.error("API Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>

      <button
        onClick={testApi}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Product Price Info API"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">API Response:</h2>

          <div className="mb-4">
            <strong>Success:</strong> {results.success ? "✅ Yes" : "❌ No"}
          </div>

          {results.data && (
            <div className="space-y-4">
              <div>
                <strong>City:</strong> {results.data.city}
              </div>

              <div>
                <strong>Coordinates:</strong> {results.data.coordinates.lat},{" "}
                {results.data.coordinates.long}
              </div>

              <div>
                <strong>Processed Results:</strong>{" "}
                {results.data.processedResults.length} items
                <ul className="ml-4 mt-2">
                  {results.data.processedResults.map(
                    (result: any, index: number) => (
                      <li key={index} className="mb-2">
                        <strong>{result.searchItem}:</strong>{" "}
                        {result.matches?.length || 0} matches
                        {result.matches && result.matches[0] && (
                          <div className="ml-4 text-sm text-gray-600">
                            Best group:{" "}
                            {Array.isArray(result.matches[0])
                              ? result.matches[0].length
                              : 1}{" "}
                            products
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}

          <details className="mt-6">
            <summary className="cursor-pointer font-semibold">
              Full Response (JSON)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
