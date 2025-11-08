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
  searchedItem?: string; // Added for store grouping
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
  products: ProductInfo[]; // Only cheapest products
  allProducts?: ProductInfo[]; // All products for reference
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
  stores?: StoreResult[]; // Added store-based results
  totalItems: number;
  timestamp: string;
}

interface ProductInfoPageProps {
  searchParams: Promise<{
    data?: string;
  }>;
}

export default function ProductInfoPage({
  searchParams,
}: ProductInfoPageProps) {
  const toolOutput = useWidgetProps<{
    city?: string;
    coordinates?: { lat: number; long: number };
    productResults?: ProductResult[];
    widgetResults?: ProductInfoResults;
    summary?: {
      totalItems: number;
      totalProducts: number;
      searchedItems: string[];
    };
    timestamp?: string;
  }>();
  const [results, setResults] = useState<ProductInfoResults | null>(null);

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
    if (toolOutput?.widgetResults) {
      console.log("Using MCP product widget data:", toolOutput.widgetResults);
      setResults(toolOutput.widgetResults);
    } else if (params?.data) {
      try {
        const decodedData = decodeURIComponent(params.data);
        const parsedData = JSON.parse(decodedData);
        if (parsedData) {
          setResults(parsedData);
        }
      } catch (error) {
        console.error("Error parsing product data:", error);
      }
    } else if (
      typeof window !== "undefined" &&
      (window as any).productResults
    ) {
      const windowResults = (window as any).productResults;
      console.log("Product results found in window:", windowResults);
      if (windowResults) {
        setResults(windowResults);
      }
    }
  }, [params, toolOutput]);

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
          {/* <h2 className="header-secondary error-bg rounded-lg p-3 mb-2">
            No product information found
          </h2>
          <p className="text-small text-subtle">Unable to load product data</p> */}
          <h2 className="header-primary error-bg rounded-lg p-3 mb-2">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">
            Product Information Search Results
          </h1>
          {/* Debug info */}
          {toolOutput && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                Live data from MCP tool - Updated:{" "}
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Location:</span> {results.city}
            </div>
            <div>
              <span className="font-medium">Items Searched:</span>{" "}
              {results.totalItems}
            </div>
            <div>
              <span className="font-medium">Stores Found:</span>{" "}
              {results.stores?.length || 0}
            </div>
            <div>
              <span className="font-medium">Cheapest Complete Cart:</span>{" "}
              {results.stores?.find((s) => s.hasAllItems)
                ? `₹${
                    results.stores.find((s) => s.hasAllItems)?.totalCartPrice
                  }`
                : "N/A"}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{" "}
              {new Date(results.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Store-based Results */}
        {results.stores && results.stores.length > 0 ? (
          <div className="space-y-6">
            {/* Complete Stores First */}
            {results.stores
              .filter((store) => store.hasAllItems)
              .map((store, storeIndex) => (
                <div
                  key={`complete-${store.store}-${storeIndex}`}
                  className="bg-green-50 border border-green-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-green-100 px-6 py-4 border-b border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-green-800 flex items-center">
                        {store.store}
                        <span className="ml-3 bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Complete Store ({store.itemsAvailable}/
                          {store.totalItemsSearched} items)
                        </span>
                      </h2>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-700">
                          ₹{store.totalCartPrice}
                        </div>
                        <div className="text-sm text-green-600">
                          Cheapest Cart
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-600">
                        This store has all {store.totalItemsSearched} items
                        you're looking for: {store.availableItems.join(", ")}
                        <span className="ml-2 text-green-700 font-medium">
                          • Avg: ₹{store.averageItemPrice}/item
                        </span>
                      </p>
                      <a
                        href={store.storeHomepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                      >
                        Shop at {store.store}
                      </a>
                    </div>
                  </div>

                  {/* Group products by searched item */}
                  <div className="p-6">
                    {store.availableItems.map((searchedItem) => {
                      const itemProducts = store.products.filter(
                        (p) => p.searchedItem === searchedItem
                      );
                      return (
                        <div
                          key={`${store.store}-${searchedItem}`}
                          className="mb-8 last:mb-0"
                        >
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize border-b border-green-200 pb-2 flex items-center justify-between">
                            <span>{searchedItem} - Cheapest Option</span>
                            <span className="text-sm text-green-600 font-normal">
                              ₹{itemProducts[0]?.price}
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {itemProducts.map((product, productIndex) => (
                              <div
                                key={`${store.store}-${searchedItem}-${productIndex}`}
                                className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                {/* Product Image */}
                                <div className="mb-3">
                                  <img
                                    src={
                                      product.image ||
                                      "https://via.placeholder.com/200x200/E5E7EB/9CA3AF?text=No+Image"
                                    }
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded-md bg-gray-100"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=No+Image";
                                    }}
                                  />
                                </div>

                                {/* Product Details */}
                                <div className="mb-3">
                                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                    {product.name}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    by {product.brand}
                                  </p>
                                </div>

                                {/* Price Information */}
                                <div className="mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-green-600">
                                      ₹{product.price}
                                    </span>
                                    {product.originalPrice > product.price && (
                                      <>
                                        <span className="text-xs text-gray-500 line-through">
                                          ₹{product.originalPrice}
                                        </span>
                                        <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                                          {product.discount}% OFF
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className="space-y-1 mb-3 text-xs text-gray-600">
                                  {product.size && (
                                    <div>Size: {product.size}</div>
                                  )}
                                  {product.rating && (
                                    <div className="flex items-center gap-1">
                                      <span>★ {product.rating}</span>
                                      {product.reviews && (
                                        <span>({product.reviews} reviews)</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Stock Status */}
                                <div className="mb-3">
                                  <span
                                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                                      product.inStock
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {product.availability}
                                  </span>
                                </div>

                                {/* Action Button */}
                                <div>
                                  <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-green-600 text-white text-xs py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-center block"
                                  >
                                    View on {store.store}
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Partial Stores */}
            {results.stores
              .filter((store) => !store.hasAllItems)
              .map((store, storeIndex) => (
                <div
                  key={`partial-${store.store}-${storeIndex}`}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-yellow-800 flex items-center">
                        {store.store}
                        <span className="ml-3 bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          Partial Store ({store.itemsAvailable}/
                          {store.totalItemsSearched} items)
                        </span>
                      </h2>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-700">
                          ₹{store.totalCartPrice}
                        </div>
                        <div className="text-sm text-yellow-600">
                          Partial Cart
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-yellow-600">
                        This store has {store.itemsAvailable} out of{" "}
                        {store.totalItemsSearched} items:{" "}
                        {store.availableItems.join(", ")}
                        <span className="ml-2 text-yellow-700 font-medium">
                          • Avg: ₹{store.averageItemPrice}/item
                        </span>
                      </p>
                      <a
                        href={store.storeHomepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center"
                      >
                        Shop at {store.store}
                      </a>
                    </div>
                  </div>

                  {/* Group products by searched item */}
                  <div className="p-6">
                    {store.availableItems.map((searchedItem) => {
                      const itemProducts = store.products.filter(
                        (p) => p.searchedItem === searchedItem
                      );
                      return (
                        <div
                          key={`${store.store}-${searchedItem}`}
                          className="mb-8 last:mb-0"
                        >
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize border-b border-yellow-200 pb-2 flex items-center justify-between">
                            <span>{searchedItem} - Cheapest Option</span>
                            <span className="text-sm text-yellow-600 font-normal">
                              ₹{itemProducts[0]?.price}
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {itemProducts.map((product, productIndex) => (
                              <div
                                key={`${store.store}-${searchedItem}-${productIndex}`}
                                className="bg-white border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                {/* Product Image */}
                                <div className="mb-3">
                                  <img
                                    src={
                                      product.image ||
                                      "https://via.placeholder.com/200x200/E5E7EB/9CA3AF?text=No+Image"
                                    }
                                    alt={product.name}
                                    className="w-full h-32 object-cover rounded-md bg-gray-100"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=No+Image";
                                    }}
                                  />
                                </div>

                                {/* Product Details */}
                                <div className="mb-3">
                                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
                                    {product.name}
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    by {product.brand}
                                  </p>
                                </div>

                                {/* Price Information */}
                                <div className="mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-yellow-600">
                                      ₹{product.price}
                                    </span>
                                    {product.originalPrice > product.price && (
                                      <>
                                        <span className="text-xs text-gray-500 line-through">
                                          ₹{product.originalPrice}
                                        </span>
                                        <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                                          {product.discount}% OFF
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className="space-y-1 mb-3 text-xs text-gray-600">
                                  {product.size && (
                                    <div>Size: {product.size}</div>
                                  )}
                                  {product.rating && (
                                    <div className="flex items-center gap-1">
                                      <span>★ {product.rating}</span>
                                      {product.reviews && (
                                        <span>({product.reviews} reviews)</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Stock Status */}
                                <div className="mb-3">
                                  <span
                                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                                      product.inStock
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {product.availability}
                                  </span>
                                </div>

                                {/* Action Button */}
                                <div>
                                  <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-yellow-600 text-white text-xs py-2 px-3 rounded-md hover:bg-yellow-700 transition-colors text-center block"
                                  >
                                    View on {store.store}
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* Fallback to Item-based Results */
          <div className="space-y-8">
            {results.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="bg-blue-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">
                    {item.item}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Found: {item.totalFound} products</span>
                    {item.error && (
                      <span className="text-red-600">Error: {item.error}</span>
                    )}
                  </div>
                </div>

                {item.products.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {item.products.map((product, productIndex) => (
                        <div
                          key={productIndex}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Product Image */}
                          <div className="mb-4">
                            <img
                              src={
                                product.image ||
                                "https://via.placeholder.com/200x200/E5E7EB/9CA3AF?text=No+Image"
                              }
                              alt={product.name}
                              className="w-full h-48 object-cover rounded-md bg-gray-100"
                              onError={(e) => {
                                console.log(
                                  "Product image failed to load:",
                                  product.image
                                );
                                e.currentTarget.src =
                                  "https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=No+Image";
                              }}
                              onLoad={() => {
                                console.log(
                                  "Product image loaded successfully:",
                                  product.image
                                );
                              }}
                            />
                            {/* Debug info */}
                            <div className="text-xs text-gray-400 mt-1">
                              Image:{" "}
                              {product.image
                                ? product.image.substring(0, 30) + "..."
                                : "No image URL"}
                            </div>
                          </div>

                          {/* Product Header */}
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              by {product.brand}
                            </p>
                          </div>

                          {/* Platform Badge */}
                          <div className="mb-3">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                              {product.platform}
                            </span>
                          </div>

                          {/* Price Information */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-green-600">
                                ₹{product.price}
                              </span>
                              {product.originalPrice > product.price && (
                                <>
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{product.originalPrice}
                                  </span>
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    {product.discount}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="space-y-2 mb-4">
                            {product.size && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Size:</span>{" "}
                                {product.size}
                              </p>
                            )}
                            {product.category && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Category:</span>{" "}
                                {product.category}
                              </p>
                            )}
                            {product.rating && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">
                                  ★ {product.rating}
                                </span>
                                {product.reviews && (
                                  <span className="text-xs text-gray-500">
                                    ({product.reviews} reviews)
                                  </span>
                                )}
                              </div>
                            )}
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Stock Status */}
                          <div className="mb-4">
                            <span
                              className={`inline-block px-3 py-1 text-xs rounded-full ${
                                product.inStock
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.availability}
                            </span>
                          </div>

                          {/* Action Button */}
                          <div>
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-blue-600 text-white text-sm py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center block"
                            >
                              View on {product.platform}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No products found for "{item.item}"</p>
                    {item.error && (
                      <p className="text-red-500 text-sm mt-2">
                        Error: {item.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by Tolmol ShelfRadar API • Real-time product information
          </p>
        </div>
      </div>

      {/* Script for MCP widget data injection */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Function to accept data from MCP widget
            window.updateProductResults = function(data) {
              window.productResults = data;
              console.log('Product data injected:', window.productResults);
              // Trigger a re-render if React is available
              if (window.React && window.ReactDOM) {
                window.location.reload();
              }
            };

            // Check for data in URL hash (alternative method)
            if (window.location.hash.startsWith('#data=')) {
              try {
                const encodedData = window.location.hash.substring(6);
                const decodedData = decodeURIComponent(encodedData);
                const parsedData = JSON.parse(decodedData);
                window.productResults = parsedData;
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
