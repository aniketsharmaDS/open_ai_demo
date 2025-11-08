"use client";

import { useEffect, useState } from "react";
import { useWidgetProps } from "../hooks";

export default function DebugWidgetPage() {
  const toolOutput = useWidgetProps();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = {
        hasWindow: true,
        hasOpenAI: !!(window as any).openai,
        openAIKeys: (window as any).openai
          ? Object.keys((window as any).openai)
          : [],
        toolOutput: (window as any).openai?.toolOutput,
        toolOutputType: typeof (window as any).openai?.toolOutput,
        toolOutputKeys: (window as any).openai?.toolOutput
          ? Object.keys((window as any).openai.toolOutput)
          : [],
      };

      console.log("🐛 Debug Info:", info);
      setDebugInfo(info);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Widget Debug Page</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">
              Raw toolOutput (from hook)
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(toolOutput, null, 2)}
            </pre>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Debug Info</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Data Extraction Attempts
            </h2>
            <div className="space-y-2 text-sm">
              {toolOutput && (
                <>
                  <div>
                    <strong>Direct stores:</strong>{" "}
                    {(toolOutput as any).stores ? "✅ Found" : "❌ Not found"}
                  </div>
                  <div>
                    <strong>structuredContent.widgetResults.stores:</strong>{" "}
                    {(toolOutput as any).structuredContent?.widgetResults
                      ?.stores
                      ? "✅ Found"
                      : "❌ Not found"}
                  </div>
                  <div>
                    <strong>widgetResults.stores:</strong>{" "}
                    {(toolOutput as any).widgetResults?.stores
                      ? "✅ Found"
                      : "❌ Not found"}
                  </div>
                  <div>
                    <strong>structuredContent.stores:</strong>{" "}
                    {(toolOutput as any).structuredContent?.stores
                      ? "✅ Found"
                      : "❌ Not found"}
                  </div>
                </>
              )}
            </div>
          </section>

          {toolOutput && (
            <section>
              <h2 className="text-xl font-semibold mb-3">
                Actual Data Structure
              </h2>
              <div className="text-sm space-y-1">
                <strong>Keys at root level:</strong>
                <ul className="list-disc pl-5">
                  {Object.keys(toolOutput).map((key) => (
                    <li key={key}>
                      {key}:{" "}
                      {typeof (toolOutput as any)[key] === "object"
                        ? `{${Object.keys((toolOutput as any)[key]).join(
                            ", "
                          )}}`
                        : typeof (toolOutput as any)[key]}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
