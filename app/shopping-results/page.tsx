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
  store: string;
  name?: string;
  brand?: string;
  price: string;
  mrp?: string;
  discount?: number;
  size?: string;
  availability: string;
  image?: string;
  url: string;
  description?: string;
}

interface ItemResult {
  item: string;
  stores: ProductInfo[];
  message?: string;
  error?: string;
}

interface ShoppingResults {
  city: string;
  coordinates: { lat: number; long: number };
  items: ItemResult[];
  totalItems: number;
  timestamp: string;
}

interface ShoppingResultsPageProps {
  searchParams: Promise<{
    data?: string;
  }>;
}

export default function ShoppingResultsPage({
  searchParams,
}: ShoppingResultsPageProps) {
  const toolOutput = useWidgetProps<{
    city?: string;
    coordinates?: { lat: number; long: number };
    priceComparison?: any[];
    widgetResults?: ShoppingResults;
    summary?: {
      totalItems: number;
      bestTotalPrice: number;
      potentialSavings: number;
    };
    timestamp?: string;
  }>();
  const [results, setResults] = useState<ShoppingResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    "initializing" | "fetching" | "processing" | "organizing"
  >("initializing");

  // OpenAI SDK hooks
  const displayMode = useDisplayMode();
  const maxHeight = useMaxHeight();
  const theme = useTheme();
  const safeArea = useSafeArea();
  const userAgent = useUserAgent();

  // Adaptive design calculations
  const isDark = theme === "dark";
  const isFullscreen = displayMode === "fullscreen";
  const isPip = displayMode === "pip";
  const supportsHover = userAgent?.capabilities?.hover ?? true;
  const supportsTouch = userAgent?.capabilities?.touch ?? false;
  const deviceType = userAgent?.device?.type ?? "desktop";

  // Container styling based on display mode
  const containerStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      minHeight: isPip ? "200px" : isFullscreen ? "100vh" : "480px",
      maxHeight: isFullscreen ? maxHeight || "100vh" : "31rem",
      maxWidth: isFullscreen ? "100%" : "28rem",
    };

    // Apply safe area insets
    if (safeArea?.insets) {
      baseStyle.paddingTop = safeArea.insets.top;
      baseStyle.paddingBottom = safeArea.insets.bottom;
      baseStyle.paddingLeft = safeArea.insets.left;
      baseStyle.paddingRight = safeArea.insets.right;
    }

    return baseStyle;
  }, [isFullscreen, maxHeight, isPip, safeArea]);

  // Unwrap searchParams using React.use()
  const params = use(searchParams);

  useEffect(() => {
    // Set initial loading state
    setLoading(true);
    setLoadingStage("initializing");

    // Simulate loading progression for better UX
    const progressTimer1 = setTimeout(() => setLoadingStage("fetching"), 300);
    const progressTimer2 = setTimeout(() => setLoadingStage("processing"), 800);
    const progressTimer3 = setTimeout(
      () => setLoadingStage("organizing"),
      1400
    );

    // First priority: Check if we have data from MCP widget props
    if (toolOutput?.widgetResults) {
      console.log("Using MCP widget data:", toolOutput.widgetResults);
      // Only set loading to false when we have actual data
      if (
        toolOutput.widgetResults.items &&
        toolOutput.widgetResults.items.length > 0
      ) {
        // Wait for loading stages to show for better UX
        const dataTimer = setTimeout(() => {
          setResults(toolOutput.widgetResults!);
          setLoading(false);
        }, 1800);

        return () => {
          clearTimeout(progressTimer1);
          clearTimeout(progressTimer2);
          clearTimeout(progressTimer3);
          clearTimeout(dataTimer);
        };
      }
      return () => {
        clearTimeout(progressTimer1);
        clearTimeout(progressTimer2);
        clearTimeout(progressTimer3);
      };
    }

    // Second priority: Check if we have data from URL parameters
    if (params?.data) {
      try {
        const decodedData = decodeURIComponent(params.data);
        const parsedData = JSON.parse(decodedData);
        // Validate that we have proper data before hiding loader
        if (parsedData && parsedData.items && parsedData.items.length > 0) {
          const dataTimer = setTimeout(() => {
            setResults(parsedData);
            setLoading(false);
          }, 1600);

          return () => {
            clearTimeout(progressTimer1);
            clearTimeout(progressTimer2);
            clearTimeout(progressTimer3);
            clearTimeout(dataTimer);
          };
        }
        return () => {
          clearTimeout(progressTimer1);
          clearTimeout(progressTimer2);
          clearTimeout(progressTimer3);
        };
      } catch (error) {
        console.error("Error parsing shopping data:", error);
        // Keep loading true on error - don't show empty state immediately
        setTimeout(() => setLoading(false), 2000); // Show error after delay
        return () => {
          clearTimeout(progressTimer1);
          clearTimeout(progressTimer2);
          clearTimeout(progressTimer3);
        };
      }
    }

    // Third priority: Check if we have data from global window object
    if (typeof window !== "undefined" && (window as any).shoppingResults) {
      const windowResults = (window as any).shoppingResults;
      if (
        windowResults &&
        windowResults.items &&
        windowResults.items.length > 0
      ) {
        const dataTimer = setTimeout(() => {
          setResults(windowResults);
          setLoading(false);
        }, 1200);

        return () => {
          clearTimeout(progressTimer1);
          clearTimeout(progressTimer2);
          clearTimeout(progressTimer3);
          clearTimeout(dataTimer);
        };
      }
    }

    // Only show mock data after a reasonable delay for API calls
    // This ensures the loader is shown for at least 2 seconds for real API responses
    const mockDataTimer = setTimeout(() => {
      // Check one more time if real data has arrived
      if (
        !toolOutput?.widgetResults &&
        !params?.data &&
        !(window as any).shoppingResults
      ) {
        // Only then show mock data for demo purposes
        const mockResults: ShoppingResults = {
          city: "Mumbai",
          coordinates: { lat: 19.093187052571302, long: 72.91670881441901 },
          items: [
            {
              item: "bread",
              stores: [
                {
                  store: "BigBasket",
                  name: "White Bread Loaf",
                  brand: "Modern",
                  price: "₹45",
                  mrp: "₹50",
                  discount: 10,
                  size: "400g",
                  availability: "In Stock",
                  image:
                    "https://via.placeholder.com/150x150/CCCCCC/666666?text=Bread",
                  url: "https://bigbasket.com",
                  description: "Fresh white bread loaf",
                },
                {
                  store: "Blinkit",
                  name: "Whole Wheat Bread",
                  brand: "Harvest Gold",
                  price: "₹42",
                  availability: "In Stock",
                  size: "400g",
                  image:
                    "https://via.placeholder.com/150x150/DDDDDD/777777?text=Bread",
                  url: "https://blinkit.com",
                },
              ],
            },
            {
              item: "milk",
              stores: [
                {
                  store: "Swiggy",
                  name: "Amul Toned Milk",
                  brand: "Amul",
                  price: "₹30",
                  availability: "In Stock",
                  size: "500ml",
                  image:
                    "https://via.placeholder.com/150x150/E0E0E0/888888?text=Milk",
                  url: "https://swiggy.com",
                },
              ],
            },
          ],
          totalItems: 2,
          timestamp: new Date().toISOString(),
        };

        setResults(mockResults);
        setLoading(false);
      }
    }, 2000); // Minimum 2 seconds of loading for better UX

    // Cleanup function
    return () => {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(mockDataTimer);
    };
  }, [params, toolOutput]);

  if (loading) {
    return (
      <div
        className={`
          w-full antialiased transition-standard widget-container
          ${
            isFullscreen
              ? "rounded-none border-0"
              : "border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl"
          }
          ${isDark ? "theme-dark" : "theme-light"}
          flex items-center justify-center
        `}
        style={containerStyle}
      >
        <div className="text-center space-y-4 p-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 animate-ping">
              <div className="w-12 h-12 bg-blue-400 rounded-full opacity-30"></div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="header-secondary">Loading Shopping Results</h2>
            <p className="text-small">
              {loadingStage === "initializing" &&
                "Initializing price comparison..."}
              {loadingStage === "fetching" &&
                (toolOutput
                  ? "Processing MCP data..."
                  : "Fetching data from grocery platforms...")}
              {loadingStage === "processing" &&
                "Analyzing pricing information..."}
              {loadingStage === "organizing" && "Organizing best deals..."}
            </p>

            {/* Progress steps */}
            <div className="space-y-2">
              {[
                { stage: "initializing", text: "Connecting to APIs" },
                {
                  stage: "fetching",
                  text: toolOutput ? "Processing tool data" : "Fetching prices",
                },
                { stage: "processing", text: "Analyzing results" },
                { stage: "organizing", text: "Finding best deals" },
              ].map((step, index) => (
                <div
                  key={step.stage}
                  className={`
                    flex items-center text-xs
                    ${
                      loadingStage === step.stage
                        ? "text-blue-600 dark:text-blue-400"
                        : index <
                          [
                            "initializing",
                            "fetching",
                            "processing",
                            "organizing",
                          ].indexOf(loadingStage)
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  <div
                    className={`
                      w-2 h-2 rounded-full mr-2
                      ${
                        loadingStage === step.stage
                          ? "bg-blue-500 animate-pulse"
                          : index <
                            [
                              "initializing",
                              "fetching",
                              "processing",
                              "organizing",
                            ].indexOf(loadingStage)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }
                    `}
                  ></div>
                  {step.text}
                  {index <
                    [
                      "initializing",
                      "fetching",
                      "processing",
                      "organizing",
                    ].indexOf(loadingStage) && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width:
                    loadingStage === "initializing"
                      ? "25%"
                      : loadingStage === "fetching"
                      ? "50%"
                      : loadingStage === "processing"
                      ? "75%"
                      : "95%",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div
        className={`
          w-full antialiased transition-standard widget-container
          ${
            isFullscreen
              ? "rounded-none border-0"
              : "border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl"
          }
          ${isDark ? "theme-dark" : "theme-light"}
          flex items-center justify-center
        `}
        style={containerStyle}
      >
        <div className="text-center p-6">
          <h2 className="header-secondary text-red-600 dark:text-red-400">
            No results found
          </h2>
          <p className="text-small">Unable to load shopping data</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full antialiased transition-standard widget-container
        ${
          isFullscreen
            ? "rounded-none border-0"
            : "border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl"
        }
        ${isDark ? "theme-dark" : "theme-light"}
        ${isPip ? "overflow-hidden" : ""}
      `}
      style={containerStyle}
    >
      <div
        className={`h-full ${isPip ? "p-3" : "p-5"} ${
          isPip ? "" : "overflow-y-auto"
        }`}
      >
        {/* Header - Adaptive for display mode */}
        <div
          className={`
            card-shadow rounded-xl p-4 mb-5 transition-standard
            ${isDark ? "bg-gray-800/50" : "bg-gray-50/50"}
            ${isPip ? "space-y-2" : "space-y-4"}
          `}
        >
          <div className="flex items-center justify-between">
            <h1
              className={`
                font-bold flex items-center gap-2
                ${isPip ? "text-lg" : "text-2xl lg:text-3xl"}
                ${isDark ? "text-white" : "text-gray-900"}
              `}
            >
              🛒 Shopping Comparison
              {!isPip && (
                <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                  {results.city}
                </span>
              )}
            </h1>
            {isPip && (
              <div className="text-xs text-subtle">
                {results.totalItems} items
              </div>
            )}
          </div>

          {/* Debug info - Only show if from MCP */}
          {toolOutput && !isPip && (
            <div className="success-bg p-3 rounded-md">
              <p className="text-sm">
                ✅ Live data from MCP tool - Updated:{" "}
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Stats grid - Hidden in PiP */}
          {!isPip && (
            <div
              className={`
                grid gap-3 text-small
                ${
                  isFullscreen
                    ? "grid-cols-2 lg:grid-cols-4"
                    : deviceType === "mobile"
                    ? "grid-cols-1"
                    : "grid-cols-2"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">📍</span>
                <span>{results.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">📦</span>
                <span>{results.totalItems} items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">🌍</span>
                <span>
                  {results.coordinates.lat.toFixed(2)},{" "}
                  {results.coordinates.long.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">⏰</span>
                <span>{new Date(results.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className={`space-y-5 ${isPip ? "max-h-40 overflow-y-auto" : ""}`}>
          {results.items.map((item, itemIndex) => (
            <div
              key={itemIndex}
              className={`
                card-shadow rounded-xl overflow-hidden transition-standard
                ${isDark ? "bg-gray-800/30" : "bg-white"}
                ${
                  supportsHover
                    ? "hover:shadow-lg hover:scale-[1.02]"
                    : "active:scale-[0.98]"
                }
              `}
            >
              {/* Item header */}
              <div
                className={`
                  px-4 py-3 border-b
                  ${
                    isDark
                      ? "bg-blue-900/30 border-white/10"
                      : "bg-blue-50 border-gray-200"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <h2
                    className={`
                      font-semibold capitalize
                      ${isPip ? "text-sm" : "text-lg"}
                      ${isDark ? "text-white" : "text-gray-900"}
                    `}
                  >
                    {item.item}
                  </h2>
                  {item.stores.length > 0 && (
                    <span
                      className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${
                          isDark
                            ? "bg-green-900/50 text-green-300"
                            : "bg-green-100 text-green-800"
                        }
                      `}
                    >
                      {item.stores.length} stores
                    </span>
                  )}
                </div>
                {item.message && !isPip && (
                  <p className="text-small text-orange-600 dark:text-orange-400 mt-1">
                    {item.message}
                  </p>
                )}
                {item.error && !isPip && (
                  <p className="text-small text-red-600 dark:text-red-400 mt-1">
                    Error: {item.error}
                  </p>
                )}
              </div>

              {/* Store cards */}
              {item.stores.length > 0 ? (
                <div className="p-4">
                  <div
                    className={`
                      grid gap-4
                      ${
                        isPip
                          ? "grid-cols-1"
                          : isFullscreen
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                          : deviceType === "mobile"
                          ? "grid-cols-1"
                          : "grid-cols-1 sm:grid-cols-2"
                      }
                    `}
                  >
                    {item.stores
                      .slice(0, isPip ? 2 : item.stores.length)
                      .map((store, storeIndex) => (
                        <div
                          key={storeIndex}
                          className={`
                            border rounded-lg p-3 transition-quick
                            ${
                              isDark
                                ? "border-white/10 bg-gray-700/30"
                                : "border-gray-200 bg-gray-50"
                            }
                            ${
                              supportsHover
                                ? "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                                : ""
                            }
                          `}
                        >
                          {/* Store header */}
                          <div className="flex items-center justify-between mb-3">
                            <h3
                              className={`
                                font-medium
                                ${isPip ? "text-sm" : "text-base"}
                                ${isDark ? "text-white" : "text-gray-900"}
                              `}
                            >
                              {store.store}
                            </h3>
                            <span
                              className={`
                                px-2 py-1 text-xs rounded-full
                                ${
                                  store.availability === "In Stock"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                }
                              `}
                            >
                              {store.availability}
                            </span>
                          </div>

                          {/* Product image - Hidden in PiP */}
                          {!isPip && store.image && (
                            <div className="mb-3">
                              <img
                                src={store.image}
                                alt={store.name || item.item}
                                className={`
                                  w-full object-cover rounded-md bg-gray-100 dark:bg-gray-700
                                  ${isPip ? "h-16" : "h-24 sm:h-32"}
                                `}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/150x150/F3F4F6/9CA3AF?text=No+Image";
                                }}
                              />
                            </div>
                          )}

                          {/* Product details */}
                          <div className="space-y-2">
                            {store.name && !isPip && (
                              <p className="text-small font-medium">
                                {store.name}
                              </p>
                            )}
                            {store.brand && !isPip && (
                              <p className="text-xs text-subtle">
                                Brand: {store.brand}
                              </p>
                            )}
                            {store.size && !isPip && (
                              <p className="text-xs text-subtle">
                                Size: {store.size}
                              </p>
                            )}

                            {/* Price section */}
                            <div className="pt-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`
                                    font-bold text-blue-600 dark:text-blue-400
                                    ${isPip ? "text-base" : "text-lg"}
                                  `}
                                >
                                  {store.price}
                                </span>
                                {store.mrp &&
                                  store.mrp !== store.price &&
                                  !isPip && (
                                    <>
                                      <span className="text-xs text-subtle line-through">
                                        {store.mrp}
                                      </span>
                                      {store.discount && store.discount > 0 && (
                                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-1 py-0.5 rounded">
                                          {store.discount}% OFF
                                        </span>
                                      )}
                                    </>
                                  )}
                              </div>
                            </div>

                            {/* Action button */}
                            <div className="pt-3">
                              <a
                                href={store.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                  w-full bg-blue-600 text-white font-medium text-center block rounded-md transition-quick touch-target
                                  ${
                                    isPip
                                      ? "text-xs py-1 px-2"
                                      : "text-sm py-2 px-4"
                                  }
                                  ${
                                    supportsHover
                                      ? "hover:bg-blue-700 hover:scale-105"
                                      : "active:bg-blue-700 active:scale-95"
                                  }
                                  focus-visible
                                `}
                                {...(supportsTouch && {
                                  onTouchStart: () => {},
                                })}
                              >
                                View on {store.store}
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {isPip && item.stores.length > 2 && (
                    <div className="mt-3 text-center">
                      <span className="text-xs text-subtle">
                        +{item.stores.length - 2} more stores
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-subtle">
                  <p>No stores found for this item</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer - Hidden in PiP */}
        {!isPip && (
          <div className="mt-6 text-center">
            <p className="text-xs text-subtle">
              🌐 Powered by Tolmol ShelfRadar API • Real-time price comparison
            </p>
            {isFullscreen && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-subtle">
                  Display Mode: {displayMode} • Theme: {theme} • Device:{" "}
                  {deviceType}
                </p>
                <p className="text-xs text-subtle">
                  Touch: {supportsTouch ? "Yes" : "No"} • Hover:{" "}
                  {supportsHover ? "Yes" : "No"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Script for MCP widget data injection */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Function to accept data from MCP widget
            window.updateShoppingResults = function(data) {
              window.shoppingResults = data;
              if (window.React && window.ReactDOM) {
                window.location.reload();
              }
            };

            // Check for data in URL hash
            if (window.location.hash.startsWith('#data=')) {
              try {
                const encodedData = window.location.hash.substring(6);
                const decodedData = decodeURIComponent(encodedData);
                const parsedData = JSON.parse(decodedData);
                window.shoppingResults = parsedData;
                window.location.reload();
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
