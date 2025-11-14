"use client";

import { useState, useEffect, use, useMemo } from "react";
import {
  useWidgetProps,
  useDisplayMode,
  useMaxHeight,
  useTheme,
  useSafeArea,
  useUserAgent,
} from "../hooks";

interface ProductInfo {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  platform: string;
  inStock: boolean;
  url: string;
  image: string;
  description: string;
  category: string;
  size: string;
  unit: string;
  rating: number | null;
  reviews: number | null;
  availability: string;
  productId: string;
  searchedItem?: string;
}

interface ProductResult {
  item: string;
  products: ProductInfo[];
  totalFound: number;
  searchQuery: string;
  error?: string;
}

interface StoreResult {
  store: string;
  products: ProductInfo[];
  allProducts?: ProductInfo[];
  itemsAvailable: number;
  totalItemsSearched: number;
  completenessScore: number;
  hasAllItems: boolean;
  availableItems: string[];
  totalCartPrice: number;
  cartUrls: string[];
  storeHomepage: string;
  averageItemPrice: number;
}

interface ProductInfoResults {
  city: string;
  coordinates: { lat: number; long: number };
  items: ProductResult[];
  stores: StoreResult[];
  totalItems: number;
  timestamp: string;
}

export default function ProductInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const toolOutput = useWidgetProps();
  const [results, setResults] = useState<ProductInfoResults | null>(null);

  const displayMode = useDisplayMode();
  const maxHeight = useMaxHeight();
  const theme = useTheme();
  const safeArea = useSafeArea();
  const userAgent = useUserAgent();

  const params = use(searchParams);

  useEffect(() => {
    console.log("=".repeat(80));
    console.log("ProductInfoPage: Raw toolOutput received:", toolOutput);
    console.log("ProductInfoPage: Type of toolOutput:", typeof toolOutput);
    console.log(
      "ProductInfoPage: ToolOutput keys:",
      toolOutput ? Object.keys(toolOutput) : "null"
    );

    // Log detailed structure
    if (toolOutput) {
      console.log("📊 Detailed toolOutput structure:");
      console.log("  - Has 'stores':", !!(toolOutput as any).stores);
      console.log(
        "  - Has 'widgetResults':",
        !!(toolOutput as any).widgetResults
      );
      console.log(
        "  - Has 'structuredContent':",
        !!(toolOutput as any).structuredContent
      );

      if ((toolOutput as any).widgetResults) {
        console.log(
          "  - widgetResults.stores:",
          !!(toolOutput as any).widgetResults.stores
        );
        console.log(
          "  - widgetResults keys:",
          Object.keys((toolOutput as any).widgetResults)
        );
      }

      if ((toolOutput as any).structuredContent) {
        console.log(
          "  - structuredContent keys:",
          Object.keys((toolOutput as any).structuredContent)
        );
      }
    }
    console.log("=".repeat(80));

    if (toolOutput) {
      // Try multiple possible data locations in order of likelihood
      const possibleSources = [
        // Direct access if toolOutput IS the widgetResults
        (toolOutput as any).stores ? toolOutput : null,

        // Standard path: toolOutput.structuredContent.widgetResults
        (toolOutput as any).structuredContent?.widgetResults,

        // If toolOutput IS structuredContent
        (toolOutput as any).widgetResults,

        // Alternative nested structures
        (toolOutput as any).structuredContent,
        (toolOutput as any).data,

        // Deep nested
        (toolOutput as any).widgetResults?.widgetResults,
      ].filter(Boolean);

      console.log("🔍 Checking possible data sources...");

      for (let i = 0; i < possibleSources.length; i++) {
        const source = possibleSources[i];
        console.log(`Checking source ${i + 1}:`, {
          hasStores: !!(source as any)?.stores,
          storesIsArray: Array.isArray((source as any)?.stores),
          storesLength: (source as any)?.stores?.length,
          keys: source ? Object.keys(source) : "null",
        });

        if (
          source &&
          (source as any).stores &&
          Array.isArray((source as any).stores)
        ) {
          console.log(`✅ Found valid data at source ${i + 1}:`, source);
          setResults(source as ProductInfoResults);
          return;
        }
      }

      // Debug: log full structure
      console.log(
        "🔍 Full toolOutput structure:",
        JSON.stringify(toolOutput, null, 2)
      );
    } else {
      console.log("❌ No toolOutput received");
    }

    // Fallback: check URL params
    if (params?.data) {
      try {
        const decoded = decodeURIComponent(params.data);
        const parsed = JSON.parse(decoded);
        if (parsed.stores) {
          console.log("✅ Using params data:", parsed);
          setResults(parsed);
          return;
        }
      } catch (err) {
        console.error("Error parsing params:", err);
      }
    }

    console.log("❌ No valid data found in any source");
  }, [toolOutput, params]); // Additional effect to listen for delayed data
  useEffect(() => {
    const checkForDelayedData = () => {
      console.log("🕐 Checking for delayed data...");

      // Check window.openai directly
      if (typeof window !== "undefined" && (window as any).openai) {
        console.log(
          "📦 window.openai exists:",
          Object.keys((window as any).openai)
        );
        console.log(
          "📦 window.openai.toolOutput:",
          (window as any).openai.toolOutput
        );
      }

      // Sometimes the widget data comes later, so check periodically
      if (!results) {
        if (toolOutput && Object.keys(toolOutput).length > 0) {
          console.log("🔄 Retrying with updated toolOutput:", toolOutput);

          // Try to extract data again
          const anyData = toolOutput as any;
          for (const [key, value] of Object.entries(anyData)) {
            if (value && typeof value === "object" && (value as any).stores) {
              console.log(
                `✅ Delayed: Found stores in toolOutput.${key}:`,
                value
              );
              setResults(value as ProductInfoResults);
              return;
            }
          }
        }
      }
    };

    // Check after a short delay to allow for async data loading
    checkForDelayedData();
    const timeout = setTimeout(checkForDelayedData, 1000);
    const timeout2 = setTimeout(checkForDelayedData, 2500);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [toolOutput, results]);

  // Additional listener for injected data
  useEffect(() => {
    const handleDataUpdate = () => {
      if (typeof window !== "undefined" && (window as any).productResults) {
        console.log(
          "✅ Data updated via window.productResults:",
          (window as any).productResults
        );
        setResults((window as any).productResults);
      }
    };

    // Check immediately on mount
    if (typeof window !== "undefined") {
      // Check for productResults
      if ((window as any).productResults) {
        console.log(
          "✅ Found window.productResults on mount:",
          (window as any).productResults
        );
        setResults((window as any).productResults);
      }
      // Also check shoppingResults as fallback
      else if ((window as any).shoppingResults) {
        console.log(
          "✅ Found window.shoppingResults on mount (fallback):",
          (window as any).shoppingResults
        );
        setResults((window as any).shoppingResults);
      }

      window.addEventListener("productDataUpdated", handleDataUpdate);
      return () =>
        window.removeEventListener("productDataUpdated", handleDataUpdate);
    }
  }, []);

  const getStoreBrandInfo = (store: string) => {
    console.log("Getting brand info for store:", store);
    const s = store.toLowerCase();
    if (s.includes("blinkit"))
      return {
        color: "bg-yellow-400",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Blinkit-yellow-rounded.svg/2048px-Blinkit-yellow-rounded.svg.png",
        name: "Blinkit",
      };
    if (s.includes("insta") || s.includes("swiggy"))
      return {
        color: "bg-orange-500",
        logo: "https://static.vecteezy.com/system/resources/previews/050/816/833/non_2x/swiggy-transparent-icon-free-png.png",
        name: "Instamart",
      };
    if (s.includes("zepto"))
      return {
        color: "bg-purple-600",
        logo: "https://static.toiimg.com/thumb/msid-87464967,width-400,resizemode-4/87464967.jpg",
        name: "Zepto",
      };
    if (s.includes("basket") || s.includes("bb") || s.includes("bbnow"))
      return {
        color: "bg-green-500",
        logo: "https://images.storyboard18.com/storyboard18/2024/10/bigbasket-2024-10-6ae74970bec1e137601b5efd677d3c01-1019x573.jpg",
        name: "BigBasket",
      };
    if (s.includes("dmart"))
      return {
        color: "bg-blue-500",
        logo: "https://companieslogo.com/img/orig/DMART.NS-6f885d00.png?t=1746038840",
        name: "DMart",
      };
    if (s.includes("amazon"))
      return { color: "bg-amber-600", logo: "🟫", name: "Amazon" };
    return { color: "bg-blue-600", logo: "🔵", name: store };
  };

  // Show loading state until tool response comes
  if (!results || !results.stores || results.stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

            {/* Loading text */}
            <div className="text-gray-600">
              <h3 className="text-lg font-semibold mb-2">
                Fetching Product Prices
              </h3>
              <p className="text-sm text-gray-500">
                Searching across multiple stores for the best prices...
              </p>

              {/* Debug information */}
              <div className="mt-4 text-xs text-gray-400 text-left">
                <p>
                  <strong>Debug Info:</strong>
                </p>
                <p>Results: {results ? "Present" : "None"}</p>
                <p>
                  Stores:{" "}
                  {results?.stores ? `${results.stores.length} stores` : "None"}
                </p>
                <p>ToolOutput: {toolOutput ? "Present" : "None"}</p>
                {toolOutput && (
                  <p>ToolOutput keys: {Object.keys(toolOutput).join(", ")}</p>
                )}
                {results && (
                  <div>
                    <p>Results keys: {Object.keys(results).join(", ")}</p>
                    {results.stores && (
                      <p>
                        Store names:{" "}
                        {results.stores.map((s: any) => s.store).join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const searchedItems = results.items?.map((i) => i.item) || [];

  console.log("Rendering table with data:", {
    searchedItems,
    storesCount: results.stores.length,
    stores: results.stores.map((s) => ({
      name: s.store,
      items: s.itemsAvailable,
      price: s.totalCartPrice,
    })),
  });

  // Default stores that must always be shown
  const defaultStoreNames = [
    "swiggy instamart",
    "blinkit",
    "zepto",
    "bbnow",
    "dmart",
  ];

  // Ensure all 5 default stores are present
  const ensureAllStores = (stores: StoreResult[]): StoreResult[] => {
    const normalizeStoreName = (name: string) =>
      name.toLowerCase().replace(/\s+/g, "");
    const storesMap = new Map<string, StoreResult>();

    // Add existing stores to map
    stores.forEach((store) => {
      const normalized = normalizeStoreName(store.store);
      // Map store to default store name
      for (const defaultStore of defaultStoreNames) {
        const normalizedDefault = normalizeStoreName(defaultStore);
        if (
          normalized.includes(normalizedDefault) ||
          normalizedDefault.includes(normalized)
        ) {
          storesMap.set(defaultStore, store);
          break;
        }
      }
    });

    // Add missing default stores
    const result: StoreResult[] = [];
    defaultStoreNames.forEach((storeName) => {
      if (storesMap.has(storeName)) {
        result.push(storesMap.get(storeName)!);
      } else {
        // Create placeholder for missing store
        result.push({
          store: storeName,
          products: [],
          allProducts: [],
          itemsAvailable: 0,
          totalItemsSearched: searchedItems.length,
          completenessScore: 0,
          hasAllItems: false,
          availableItems: [],
          totalCartPrice: 0,
          cartUrls: [],
          storeHomepage: "#",
          averageItemPrice: 0,
        });
      }
    });

    return result;
  };

  // Calculate savings properly - find max price among stores that have items
  const storesWithAllDefaults = ensureAllStores(results.stores);
  const storesWithItems = storesWithAllDefaults.filter(
    (s) => s.itemsAvailable > 0
  );
  const maxPrice =
    storesWithItems.length > 0
      ? Math.max(...storesWithItems.map((s) => s.totalCartPrice))
      : 0;

  const stores = storesWithAllDefaults.slice(0, 5).map((s) => ({
    ...s,
    savings:
      s.itemsAvailable > 0 ? Math.max(0, maxPrice - s.totalCartPrice) : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            {/* Header */}
            <thead>
              <tr className="bg-[#EFF5FA]">
                <th className="w-40 p-3"></th>
                {stores.map((s, i) => {
                  const info = getStoreBrandInfo(s.store);
                  return (
                    <th key={i} className="p-3">
                      <div
                        className={`flex flex-col items-center justify-center rounded-t-xl ${info.color} text-white py-3 shadow`}
                      >
                        <div className="w-12 h-12 mb-2 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
                          {info.logo.startsWith("http") ? (
                            <img
                              src={info.logo}
                              alt={info.name}
                              className="w-10 h-10 object-contain rounded-full"
                              onError={(e) => {
                                // Fallback to first letter if image fails
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget
                                  .nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = "flex";
                                }
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{info.logo}</span>
                          )}
                          <span
                            className="w-10 h-10 text-lg font-bold text-gray-600 items-center justify-center hidden"
                            style={{ display: "none" }}
                          >
                            {info.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-sm">
                          {info.name}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Total Price */}
              <tr className="bg-[#C5D9F1]">
                <td className="py-3 font-semibold text-gray-800">Total</td>
                {stores.map((s, i) => {
                  const isPlaceholderStore =
                    s.itemsAvailable === 0 && s.totalCartPrice === 0;
                  return (
                    <td key={i} className="py-3 text-gray-800">
                      {isPlaceholderStore ? (
                        <div className="text-sm text-gray-500 font-medium">
                          N/A
                        </div>
                      ) : (
                        <>
                          <div className="text-lg font-bold">
                            ₹{s.totalCartPrice}
                          </div>
                          <div className="text-xs font-medium">
                            {s.itemsAvailable} ITEMS
                          </div>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Savings */}
              {/* <tr className="bg-[#DCE6F1]">
                <td className="py-3 font-semibold text-gray-800">Saving</td>
                {stores.map((s, i) => (
                  <td key={i} className="py-3 text-gray-700">
                    <div className="text-base font-semibold">
                      ₹{s.savings.toFixed(0)}
                    </div>
                    <div className="text-xs">saving</div>
                  </td>
                ))}
              </tr> */}

              {/* Product Rows */}
              {searchedItems.map((item, i) => {
                // Find the actual product name from the first available store
                const actualProduct = results.stores
                  .flatMap((s) => s.products)
                  .find((p) => p.searchedItem === item);

                // Use actual product name if available, fallback to search query
                const displayName = actualProduct?.name || item;

                return (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center space-x-2">
                        {/* Product image */}
                        <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                          {(() => {
                            // Try to find product image from any store
                            const productWithImage = results.stores
                              .flatMap((s) => s.products)
                              .find((p) => p.searchedItem === item && p.image);

                            return productWithImage?.image ? (
                              <img
                                src={productWithImage.image}
                                alt={displayName}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  // Fallback to placeholder
                                  e.currentTarget.src = `https://via.placeholder.com/40x40/E5E7EB/9CA3AF?text=${displayName
                                    .charAt(0)
                                    .toUpperCase()}`;
                                }}
                              />
                            ) : (
                              <span className="text-gray-500 text-xs font-bold">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            );
                          })()}
                        </div>
                        <span className="text-gray-800 text-sm font-medium">
                          {displayName}
                        </span>
                      </div>
                    </td>

                    {stores.map((s, j) => {
                      const product = s.products.find(
                        (p) => p.searchedItem === item
                      );

                      // Debug logging for the product
                      if (product) {
                        console.log(`Product for ${item} in ${s.store}:`, {
                          name: product.name,
                          price: product.price,
                          inStock: product.inStock,
                          notFound: (product as any).notFound,
                          url: product.url,
                        });
                      }

                      const isNotFound = product && (product as any).notFound;
                      const isAvailable =
                        product &&
                        product.inStock &&
                        product.price > 0 &&
                        !isNotFound;

                      // Check if this is a placeholder store (no items at all)
                      const isPlaceholderStore =
                        s.itemsAvailable === 0 && s.totalCartPrice === 0;

                      return (
                        <td key={j} className="py-3">
                          {isAvailable ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div>
                                <div className="text-gray-800 font-semibold">
                                  ₹{product.price}
                                </div>
                                {product.originalPrice > product.price && (
                                  <div className="text-xs text-gray-400 line-through">
                                    ₹{product.originalPrice}
                                  </div>
                                )}
                              </div>
                              {product.url && product.url !== "#" && (
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200"
                                  title={`View ${product.name} on ${product.platform}`}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-3 h-3"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 leading-tight">
                              {isNotFound ? (
                                <>
                                  Not
                                  <br />
                                  Found
                                </>
                              ) : isPlaceholderStore ? (
                                <>
                                  Not
                                  <br />
                                  Available
                                </>
                              ) : (
                                <>
                                  Out of
                                  <br />
                                  stock
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Store Links */}
              <tr className="bg-[#C5D9F1]">
                <td className="py-3 text-gray-800 font-semibold">
                  Store Links
                </td>
                {stores.map((s, i) => {
                  const isPlaceholderStore =
                    s.storeHomepage === "#" || s.itemsAvailable === 0;
                  return (
                    <td key={i} className="py-3">
                      {isPlaceholderStore ? (
                        <span className="text-xs text-gray-400">N/A</span>
                      ) : (
                        <a
                          href={s.storeHomepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-[#4A90E2] hover:bg-[#3b7fcf] text-white rounded-md w-8 h-8"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Script for MCP widget data injection */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Function to accept data from MCP widget
            window.updateProductResults = function(data) {
              console.log('MCP data injected:', data);
              window.productResults = data;
              // Trigger a re-render
              window.dispatchEvent(new Event('productDataUpdated'));
            };

            // Check for data in URL hash (alternative method)
            if (window.location.hash.startsWith('#data=')) {
              try {
                const encodedData = window.location.hash.substring(6);
                const decodedData = decodeURIComponent(encodedData);
                const parsedData = JSON.parse(decodedData);
                console.log('Data from URL hash:', parsedData);
                window.productResults = parsedData;
              } catch (e) {
                console.error('Error parsing hash data:', e);
              }
            }
          `,
        }}
      />
    </div>
  );
}
