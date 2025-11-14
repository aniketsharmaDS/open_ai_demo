import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { fetchWeatherApi } from "openmeteo";

// Auth token for Tolmol API
const AuthToken =
  "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4MDI5MzRmZTBlZWM0NmE1ZWQwMDA2ZDE0YTFiYWIwMWUzNDUwODMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQW5pa2V0IFNoYXJtYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaTVsc3gzSGprczlOdV93TmZ0Q2EzblotTzR3OGp4UW1CajBrcmZzRllhbkZDanc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdG9sbW9sLWY3ZTQwIiwiYXVkIjoidG9sbW9sLWY3ZTQwIiwiYXV0aF90aW1lIjoxNzYyNzAyNDc2LCJ1c2VyX2lkIjoiZ0ltSHdYeGlOb1Mza2JNODZETnVmeHd1UGdHMyIsInN1YiI6ImdJbUh3WHhpTm9TM2tiTTg2RE51Znh3dVBnRzMiLCJpYXQiOjE3NjMxMTQzOTcsImV4cCI6MTc2MzExNzk5NywiZW1haWwiOiJhbmlrZXQuc2hhcm1hQGRpZ2l0YWxzYWx0LmluIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDAxODMyODA2MjkzOTUyNzU5NjkiXSwiZW1haWwiOlsiYW5pa2V0LnNoYXJtYUBkaWdpdGFsc2FsdC5pbiJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.YNxR6n38243lM198uNpKxCKr2KSGFA7yq9EwnmTT7CVBGOqTwwpbdHJTP-WRLwA55DnRMY97ZbyXrw7b8Q4_AuyMisBljp40z7JV6NFbtVm-jdZJXbA65DFS0b1u3riwA2be0JJu7YEPnos5aNdRvjVTkTfeWn5It18au4QxmpXCTDmJ9Ipi2xXhe86EPHiSgY6CdQsfcc1qG4tGxw5KGnTK7vDG7sOLUiSaV49HYKlnNb0M_c11XWaA9WkjFGwHnl-cuaNJ7SMMBx1EccjtPCCau06i7oUmXkFJ_id8xAAHuINDqO2ljzg4k4wGjLiD8iNSBizdoinkzEzJDu5Q2g";

// Default stores that should always be included in results
const DEFAULT_STORES = [
  "swiggy instamart",
  "blinkit",
  "zepto",
  "bbnow",
  "dmart",
];

// TypeScript interfaces for geocoding
interface GeocodeResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

// Structured item interface
interface StructuredItem {
  size?: string;
  brand_name?: string;
  product_name: string;
  query?: string;
}

// Helper function to normalize strings for comparison
const normalize = (s: any): string => {
  return s ? String(s).toLowerCase().trim() : "";
};

// Helper function to normalize store names
const normalizeStoreName = (storeName: string): string => {
  return storeName.toLowerCase().replace(/\s+/g, "").trim();
};

// Main filtering function - uses strict brand -> size -> product_name filtering
// Optimized for speed with parallel processing and caching
const filterProducts = async (
  items: StructuredItem[],
  location: string = "Mumbai"
) => {
  try {
    // Step 1: Geocode the location (cached for subsequent calls)
    const apiKey = "6900978dc9f28933450103qhj0eb6f7";
    const encodedLocation = encodeURIComponent(location);
    const geocodeUrl = `https://geocode.maps.co/search?q=${encodedLocation}&api_key=${apiKey}`;

    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok)
      throw new Error(`Geocoding API error: ${geocodeResponse.status}`);

    const geocodeData: GeocodeResult[] = await geocodeResponse.json();
    if (!geocodeData || geocodeData.length === 0)
      throw new Error(`No location found for "${location}"`);

    const { lat, lon } = geocodeData[0];
    const coordinates = { lat: parseFloat(lat), long: parseFloat(lon) };

    // Step 2: Fetch raw data for ALL items in parallel with timeout
    const rawApiResults = await Promise.all(
      items.map(async (item) => {
        try {
          // Construct search query from structured item
          const searchParts = [];
          if (item.size) searchParts.push(item.size);
          if (item.brand_name) searchParts.push(item.brand_name);
          searchParts.push(item.product_name);
          if (item.query) searchParts.push(item.query);

          const searchQuery = searchParts.join(" ").trim();

          const apiUrl = `https://tolmol-api.prod.shelfradar.ai/api/v4/aggregate?q=${encodeURIComponent(
            searchQuery
          )}&lat=${lat}&long=${lon}`;

          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "Product-Price-Info-Tool/1.0",
              Authorization: AuthToken,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            return {
              searchItem: item,
              rawData: null,
              error: `API request failed: ${response.status}`,
            };
          }

          const data = await response.json();
          return { searchItem: item, rawData: data, error: null };
        } catch (err) {
          return {
            searchItem: item,
            rawData: null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      })
    );

    // Step 3: Filter products using optimized strict filtering logic
    const processedResults = rawApiResults.map((r) => {
      const { searchItem, rawData, error } = r;

      const searchQuery = `${searchItem.size || ""} ${
        searchItem.brand_name || ""
      } ${searchItem.product_name}`.trim();

      if (error || !rawData)
        return { searchItem: searchQuery, matches: [], error, notFound: true };

      // Pre-normalize filters once
      const brandFilter = normalize(searchItem.brand_name || "");
      const sizeFilter = normalize(searchItem.size || "").replace(/\s+/g, "");
      const productFilter = normalize(searchItem.product_name);

      let matchedGroups: any[] = [];

      if (Array.isArray(rawData.products)) {
        // Optimized: Single-pass filtering instead of multiple passes
        matchedGroups = rawData.products.filter((group: any[]) => {
          if (!Array.isArray(group)) return false;

          return group.some((product) => {
            // Brand check (if specified)
            if (brandFilter) {
              const prodBrand = normalize(
                product.brand || product.manufacturer || ""
              );
              const brandMatch =
                prodBrand.includes(brandFilter) ||
                brandFilter.includes(prodBrand);
              if (!brandMatch) return false;
            }

            // Size check (if specified)
            if (sizeFilter) {
              const prodSize = normalize(
                product.size || product.package || product.pack || ""
              ).replace(/\s+/g, "");
              const sizeMatch =
                prodSize.includes(sizeFilter) || sizeFilter.includes(prodSize);
              if (!sizeMatch) return false;
            }

            // Product name check (required)
            const prodName = normalize(
              product.name || product.title || product.product_name || ""
            );
            const prodBrand = normalize(
              product.brand || product.manufacturer || ""
            );
            const combined = `${prodBrand} ${prodName}`.trim();

            return (
              combined.includes(productFilter) ||
              prodName.includes(productFilter)
            );
          });
        });

        // Early return if no matches found
        if (matchedGroups.length === 0) {
          let errorMsg = `No products found matching "${searchQuery}"`;
          if (brandFilter)
            errorMsg = `No products found with brand "${searchItem.brand_name}"`;
          else if (sizeFilter)
            errorMsg = `No products found with size "${searchItem.size}"`;

          return {
            searchItem: searchQuery,
            matches: [],
            error: errorMsg,
            notFound: true,
          };
        }
      }

      return {
        searchItem: searchQuery,
        matches: matchedGroups,
        error: null,
        notFound: false,
      };
    });

    // Step 4: Ensure all default stores are present
    const ensureAllStores = (processedResults: any[]): any[] => {
      return processedResults.map((result) => {
        if (result.notFound || !result.matches || result.matches.length === 0) {
          // For not found items, create placeholder for all 5 stores
          const placeholderMatches = [
            DEFAULT_STORES.map((storeName) => ({
              store: storeName,
              platform: storeName,
              name: result.searchItem,
              price: 0,
              in_stock: false,
              url: "#",
              availability: "Not Found",
              notFound: true,
            })),
          ];

          return {
            ...result,
            matches: placeholderMatches,
          };
        }

        // For found items, ensure all 5 stores are present
        const storeMap = new Map<string, any>();

        // Collect products by store
        result.matches.forEach((group: any[]) => {
          if (Array.isArray(group)) {
            group.forEach((product) => {
              const storeName = normalize(
                product.platform || product.store || ""
              );
              // Map to default store names
              for (const defaultStore of DEFAULT_STORES) {
                const normalizedDefault = normalizeStoreName(defaultStore);
                if (
                  storeName.includes(normalizedDefault) ||
                  normalizedDefault.includes(storeName)
                ) {
                  if (!storeMap.has(defaultStore)) {
                    storeMap.set(defaultStore, []);
                  }
                  storeMap.get(defaultStore)!.push(product);
                  break;
                }
              }
            });
          }
        });

        // Create a complete group with all 5 stores
        const completeGroup: any[] = [];
        DEFAULT_STORES.forEach((storeName) => {
          if (storeMap.has(storeName)) {
            // Add the first product from this store
            completeGroup.push(storeMap.get(storeName)![0]);
          } else {
            // Add placeholder for missing store
            completeGroup.push({
              store: storeName,
              platform: storeName,
              name: result.searchItem,
              price: 0,
              in_stock: false,
              url: "#",
              availability: "Out of Stock",
              notFound: false,
            });
          }
        });

        return {
          ...result,
          matches: [completeGroup], // Return single group with all 5 stores
        };
      });
    };

    const finalResults = ensureAllStores(processedResults);

    return {
      location,
      coordinates,
      processedResults: finalResults,
      totalItems: items.length,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw err;
  }
};

// Enhanced getAppsSdkCompatibleHtml function that can inject data
const getAppsSdkCompatibleHtmlWithData = async (
  baseUrl: string,
  path: string,
  data?: any
) => {
  const result = await fetch(`${baseUrl}${path}`);
  let html = await result.text();

  // If we have data to inject, modify the HTML to include it
  if (data) {
    const dataScript = `
      <script>
        window.productResults = ${JSON.stringify(data)};
        console.log('Product price data injected:', window.productResults);
        // Trigger event to notify React component
        window.dispatchEvent(new Event('productDataUpdated'));
      </script>
    `;

    // Insert the script before the closing head tag or body tag
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${dataScript}</head>`);
    } else if (html.includes("</body>")) {
      html = html.replace("</body>", `${dataScript}</body>`);
    } else {
      // If neither head nor body found, append to the end
      html += dataScript;
    }
  }

  return html;
};

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

// TypeScript interfaces for price comparison
interface StorePrice {
  store: string;
  price: number;
  inStock: boolean;
  url: string;
  image?: string;
}

interface ItemComparison {
  item: string;
  stores: StorePrice[];
  lowestPrice: number;
  bestStore: string;
  image?: string[];
}

interface PriceComparisonSummary {
  totalItems: number;
  bestTotalPrice: number;
  potentialSavings: number;
  storeTotals: Array<{
    store: string;
    total: number;
    availability: number;
  }>;
}

// TypeScript interfaces for weather data
interface WeatherHourlyData {
  time: Date[];
  temperature_2m: Float32Array;
  humidity_2m?: Float32Array;
  precipitation?: Float32Array;
  windspeed_10m?: Float32Array;
}

interface GeocodeResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface WeatherForecast {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
    utcOffsetSeconds: number;
  };
  hourly: WeatherHourlyData;
  summary: {
    currentTemp: number;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
    description: string;
  };
}

// Combined function to get weather forecast by city name
const getWeatherForecastByCity = async (
  cityName: string,
  days: number = 1,
  includeHumidity: boolean = false,
  includePrecipitation: boolean = false,
  includeWindSpeed: boolean = false
): Promise<WeatherForecast & { displayName: string }> => {
  try {
    // Step 1: Geocode the city name to get coordinates
    const apiKey = "6900978dc9f28933450103qhj0eb6f7";
    const encodedCity = encodeURIComponent(cityName);
    const geocodeUrl = `https://geocode.maps.co/search?q=${encodedCity}&api_key=${apiKey}`;

    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodeResponse.status}`);
    }

    const geocodeData: GeocodeResult[] = await geocodeResponse.json();

    if (!geocodeData || geocodeData.length === 0) {
      throw new Error(`No location found for "${cityName}"`);
    }
    console.log("geocodeData:", geocodeData);
    // Take the first (most relevant) result
    const geocodeResult = geocodeData[0];
    const latitude = parseFloat(geocodeResult.lat);
    const longitude = parseFloat(geocodeResult.lon);
    const displayName = geocodeResult.display_name;

    // Step 2: Get weather forecast using the coordinates
    // Build weather variables array based on options
    const weatherVars = ["temperature_2m"];
    if (includeHumidity) weatherVars.push("relativehumidity_2m");
    if (includePrecipitation) weatherVars.push("precipitation");
    if (includeWindSpeed) weatherVars.push("windspeed_10m");

    const params = {
      latitude,
      longitude,
      hourly: weatherVars,
      forecast_days: days,
      timezone: "auto",
    };

    const weatherUrl = "https://api.open-meteo.com/v1/forecast";
    const weatherResponses = await fetchWeatherApi(weatherUrl, params);

    console.log("weatherResponses:", weatherResponses);
    // Process first location
    const weatherResponse = weatherResponses[0];

    // Extract location attributes
    const responseLatitude = weatherResponse.latitude();
    const responseLongitude = weatherResponse.longitude();
    const elevation = weatherResponse.elevation();
    const utcOffsetSeconds = weatherResponse.utcOffsetSeconds();

    const hourly = weatherResponse.hourly()!;

    // Create time array
    const timeArray = Array.from(
      {
        length:
          (Number(hourly.timeEnd()) - Number(hourly.time())) /
          hourly.interval(),
      },
      (_, i) =>
        new Date(
          (Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) *
            1000
        )
    );

    // Extract weather data
    const temperatureData = hourly.variables(0)?.valuesArray();
    if (!temperatureData) {
      throw new Error("Temperature data not available");
    }

    const weatherData: WeatherHourlyData = {
      time: timeArray,
      temperature_2m: temperatureData,
    };

    // Add optional weather variables
    let varIndex = 1;
    if (includeHumidity) {
      const humidityData = hourly.variables(varIndex++)?.valuesArray();
      if (humidityData) {
        weatherData.humidity_2m = humidityData;
      }
    }
    if (includePrecipitation) {
      const precipitationData = hourly.variables(varIndex++)?.valuesArray();
      if (precipitationData) {
        weatherData.precipitation = precipitationData;
      }
    }
    if (includeWindSpeed) {
      const windSpeedData = hourly.variables(varIndex++)?.valuesArray();
      if (windSpeedData) {
        weatherData.windspeed_10m = windSpeedData;
      }
    }

    // Calculate temperature statistics
    const temps = Array.from(weatherData.temperature_2m);
    const currentTemp = temps[0] || 0;
    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    // Generate weather description
    let description = "Clear";
    if (avgTemp < 0) description = "Very Cold";
    else if (avgTemp < 10) description = "Cold";
    else if (avgTemp < 20) description = "Cool";
    else if (avgTemp < 30) description = "Warm";
    else description = "Hot";

    if (includePrecipitation && weatherData.precipitation) {
      const totalPrecipitation = Array.from(weatherData.precipitation).reduce(
        (sum, precip) => sum + precip,
        0
      );
      if (totalPrecipitation > 5) description += " with Heavy Rain";
      else if (totalPrecipitation > 0.5) description += " with Light Rain";
    }

    return {
      location: {
        latitude: responseLatitude,
        longitude: responseLongitude,
        elevation,
        timezone: "auto",
        utcOffsetSeconds,
      },
      hourly: weatherData,
      summary: {
        currentTemp: Math.round(currentTemp * 10) / 10,
        avgTemp: Math.round(avgTemp * 10) / 10,
        minTemp: Math.round(minTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        description,
      },
      displayName,
    };
  } catch (error) {
    throw new Error(
      `Failed to get weather forecast for "${cityName}": ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");
  const shoppinghtml = await getAppsSdkCompatibleHtml(
    baseURL,
    "/shopping-results"
  );

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };

  const shoppingWidget: ContentWidget = {
    id: "show_shopping_results",
    title: "Shopping Results",
    templateUri: "ui://widget/shopping-template.html",
    invoking: "Loading shopping results...",
    invoked: "Shopping results loaded",
    html: shoppinghtml,
    description: "Displays shopping price comparison results",
    widgetDomain: "https://shopping-comparison.app",
  };

  const productInfohtml = await getAppsSdkCompatibleHtml(
    baseURL,
    "/product-price-info"
  );

  const productInfoWidget: ContentWidget = {
    id: "show_price_comparison",
    title: "Product Price Comparison",
    templateUri: "ui://widget/product-price-info-template.html",
    invoking: "Loading product price comparison...",
    invoked: "Product price comparison loaded",
    html: productInfohtml,
    description: "Displays detailed product price comparisons",
    widgetDomain: "https://product-price-info.app",
  };

  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "shopping-widget",
    shoppingWidget.templateUri,
    {
      title: shoppingWidget.title,
      description: shoppingWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": shoppingWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${shoppingWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": shoppingWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": shoppingWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "product-price-comparison-widget",
    productInfoWidget.templateUri,
    {
      title: productInfoWidget.title,
      description: productInfoWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": productInfoWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${productInfoWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": productInfoWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": productInfoWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z
          .string()
          .describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  // Product Price Information Tool using Pattern-Based API
  server.registerTool(
    "fetch_price_comparison",
    {
      title: "Fetch Price Comparison",
      description:
        "**IMPORTANT: Use this tool when user provides a shopping list or asks for price comparison.**\n\n" +
        "Fetches detailed price comparison across multiple grocery delivery platforms (Blinkit, Swiggy Instamart, Zepto, BigBasket, DMart, etc.) for a shopping list.\n\n" +
        "**When to use:**\n" +
        "- User provides a shopping list (e.g., '500ml Amul Cow Milk, 200gm Chilli Powder')\n" +
        "- User asks 'compare prices', 'price comparison', 'best price', 'cheapest store'\n" +
        "- User wants to know where to buy groceries\n\n" +
        "**How to parse items:**\n" +
        "For each item in the shopping list, extract:\n" +
        "- size: quantity/weight (e.g., '500ml', '5kg', '200gm')\n" +
        "- brand_name: brand if mentioned (e.g., 'Amul', 'Tata', 'Aashirvaad')\n" +
        "- product_name: the actual product (e.g., 'Cow Milk', 'Chilli Powder', 'Aata')\n" +
        "- query: original text for reference\n\n" +
        "**Example:** '500ml Amul Cow Milk' → {size: '500ml', brand_name: 'Amul', product_name: 'Cow Milk', query: '500ml Amul Cow Milk'}",
      inputSchema: {
        items: z
          .array(
            z.object({
              size: z
                .string()
                .optional()
                .describe(
                  "Product size like '500ml', '5kg', '1l', '200gm'. Extract from the item text."
                ),
              brand_name: z
                .string()
                .optional()
                .describe(
                  "Brand name like 'Amul', 'Tata', 'Aashirvaad'. Extract from the item text if present."
                ),
              product_name: z
                .string()
                .describe(
                  "Product name like 'Cow Milk', 'Basmati Rice', 'Wheat Flour', 'Chilli Powder'. This is required - extract the main product from the item."
                ),
              query: z
                .string()
                .optional()
                .describe(
                  "Original user query/item text like '500ml Amul Cow Milk' for reference"
                ),
            })
          )
          .min(1, "At least one item is required")
          .describe(
            "Shopping list items parsed with size, brand_name, product_name. Parse each line/item from user's shopping list."
          ),
        location: z
          .string()
          .optional()
          .default("Mumbai")
          .describe(
            "User's location - can be city name, area, or full address. Extract from user message if mentioned, otherwise default to Mumbai."
          ),
      },
      _meta: widgetMeta(productInfoWidget),
    },
    async ({ items, location = "Mumbai" }) => {
      try {
        // Use the new filtering function directly (no API call)
        const { coordinates, processedResults, totalItems } =
          await filterProducts(items, location);

        // Transform the data into the store-based structure that the UI expects
        const storeGroups: { [storeName: string]: any[] } = {};

        // Extract the entire best-scoring product group for each item to show cross-store comparison
        processedResults.forEach((result: any) => {
          const bestMatch =
            result.matches && result.matches.length > 0
              ? result.matches[0] // This is the best-scoring group
              : null;

          if (bestMatch && Array.isArray(bestMatch) && bestMatch.length > 0) {
            // Process ALL products from the filtered group (across all stores)
            bestMatch.forEach((product: any) => {
              const storeName = product.platform || "Unknown Store";

              if (!storeGroups[storeName]) {
                storeGroups[storeName] = [];
              }

              storeGroups[storeName].push({
                name: product.name || "Unknown Product",
                brand: product.brand || "",
                price: product.price || 0,
                originalPrice: product.original_price || product.price || 0,
                discount: product.discount || 0,
                platform: storeName,
                inStock: product.in_stock === true && product.price > 0,
                url: product.url || "#",
                image:
                  product.image || (product.images && product.images[0]) || "",
                description: product.description || "",
                category: product.category || "",
                size: product.size || "",
                unit: product.unit || "",
                rating: product.rating || null,
                reviews: product.reviews || null,
                availability: product.notFound
                  ? "Not Found"
                  : product.in_stock
                  ? "In Stock"
                  : "Out of Stock",
                productId: product.id || product.product_id || "",
                searchedItem: result.searchItem,
                notFound: product.notFound || false,
              });
            });
          }
        });

        // Convert store groups to the format expected by the UI
        const storeResults = Object.entries(storeGroups).map(
          ([storeName, products]) => {
            const availableProducts = products.filter(
              (p) => !p.notFound && p.inStock && p.price > 0
            );
            const uniqueItemsInStore = new Set(
              availableProducts.map((p) => p.searchedItem)
            );
            const totalCartPrice = availableProducts.reduce(
              (sum, p) => sum + (p.price || 0),
              0
            );

            // Generate store homepage URL
            let storeHomepage = "#";
            const lowerStoreName = storeName.toLowerCase();
            if (lowerStoreName.includes("swiggy")) {
              storeHomepage = "https://www.swiggy.com/instamart";
            } else if (lowerStoreName.includes("blinkit")) {
              storeHomepage = "https://blinkit.com";
            } else if (
              lowerStoreName.includes("bigbasket") ||
              lowerStoreName.includes("bb") ||
              lowerStoreName.includes("bbnow")
            ) {
              storeHomepage = "https://www.bigbasket.com";
            } else if (lowerStoreName.includes("zepto")) {
              storeHomepage = "https://www.zepto.com";
            } else if (lowerStoreName.includes("dmart")) {
              storeHomepage = "https://www.dmart.in";
            }

            return {
              store: storeName,
              products,
              itemsAvailable: uniqueItemsInStore.size,
              totalItemsSearched: items.length,
              completenessScore: Math.round(
                (uniqueItemsInStore.size / items.length) * 100
              ),
              hasAllItems: uniqueItemsInStore.size === items.length,
              availableItems: Array.from(uniqueItemsInStore),
              totalCartPrice: Math.round(totalCartPrice * 100) / 100,
              cartUrls: products
                .map((p) => p.url)
                .filter((url) => url && url !== "#"),
              storeHomepage,
              averageItemPrice:
                uniqueItemsInStore.size > 0
                  ? Math.round(
                      (totalCartPrice / uniqueItemsInStore.size) * 100
                    ) / 100
                  : 0,
            };
          }
        );

        // Sort stores: complete stores first, then by total cart price
        storeResults.sort((a, b) => {
          if (a.hasAllItems && !b.hasAllItems) return -1;
          if (!a.hasAllItems && b.hasAllItems) return 1;
          if (a.hasAllItems && b.hasAllItems) {
            return a.totalCartPrice - b.totalCartPrice;
          }
          return b.completenessScore - a.completenessScore;
        });

        // Create the widget results in the format the UI expects
        const widgetResults = {
          location,
          coordinates,
          items: processedResults.map((result: any) => ({
            item: result.searchItem,
            products:
              result.matches && result.matches.length > 0
                ? result.matches[0]
                : [],
            totalFound: result.notFound
              ? 0
              : result.matches
              ? result.matches.length
              : 0,
            searchQuery: result.searchItem,
            error: result.error,
            notFound: result.notFound,
          })),
          stores: storeResults,
          totalItems: items.length,
          timestamp: new Date().toISOString(),
        };

        console.log("🎯 Widget Results Created:", {
          location: widgetResults.location,
          storesCount: widgetResults.stores.length,
          storeNames: widgetResults.stores.map((s: any) => s.store),
          itemsCount: widgetResults.items.length,
        });

        // Generate HTML for product price info display
        let productInfohtml;
        try {
          productInfohtml = await getAppsSdkCompatibleHtmlWithData(
            baseURL,
            "/product-price-info",
            widgetResults
          );
        } catch (htmlError) {
          console.error(
            "Error fetching product price info HTML with data:",
            htmlError
          );
          try {
            const encodedData = encodeURIComponent(
              JSON.stringify(widgetResults)
            );
            productInfohtml = await getAppsSdkCompatibleHtml(
              baseURL,
              `/product-price-info?data=${encodedData}`
            );
          } catch (fallbackError) {
            console.error(
              "Error with product price info fallback method:",
              fallbackError
            );
            productInfohtml = `<div><h1>Product Price Information for ${location}</h1><p>Data loaded: ${JSON.stringify(
              widgetResults
            )}</p></div>`;
          }
        }

        // Update the product price info widget HTML
        productInfoWidget.html = productInfohtml;

        // Generate summary text
        let summaryText = `**Pattern-Based Product Price Search Results for ${location}**\n\n`;
        summaryText += `**Search Location:** ${location} (${coordinates.lat.toFixed(
          2
        )}, ${coordinates.long.toFixed(2)})\n`;

        // Format items display - convert structured items to readable strings
        const itemsDisplay = items
          .map((item: any) => {
            const parts = [];
            if (item.size) parts.push(item.size);
            if (item.brand_name) parts.push(item.brand_name);
            parts.push(item.product_name);
            return parts.join(" ");
          })
          .join(", ");

        summaryText += `**Items Searched:** ${items.length} (${itemsDisplay})\n`;
        summaryText += `**Pattern Format:** Use "{size} {brand+product name}" format like "500ml amul cow milk"\n`;
        summaryText += `**Matched Items:** ${
          widgetResults.items.filter(
            (item: any) => item.products && item.products.length > 0
          ).length
        }/${items.length}\n\n`;

        summaryText += `**� Search Results (First Match for Each Item):**\n`;
        widgetResults.items.forEach((item: any, index: number) => {
          summaryText += `${index + 1}. **${item.item}**:\n`;
          if (item.error) {
            summaryText += `   ❌ Error: ${item.error}\n`;
          } else if (!item.products || item.products.length === 0) {
            summaryText += `   ⚠️ No matches found\n`;
          } else {
            // Show cross-store comparison for the best product group
            summaryText += `   ✅ Found in ${item.products.length} store(s):\n`;
            item.products.forEach((product: any, pIndex: number) => {
              summaryText += `      ${pIndex + 1}. ${product.platform}: ${
                product.name
              } - ₹${product.price}\n`;
            });
            if (item.totalFound > 1) {
              summaryText += `   🔍 Total product groups available: ${item.totalFound}\n`;
            }
          }
          summaryText += "\n";
        });

        summaryText += `⏱️ **Data fetched:** ${new Date().toLocaleString()}\n`;
        summaryText += `🎯 **Detailed results displayed in widget above**\n`;
        summaryText += `🌐 **Source:** Pattern-based matching via Tolmol ShelfRadar API\n`;

        return {
          content: [
            {
              type: "text",
              text: summaryText,
            },
          ],
          structuredContent: {
            location,
            coordinates,
            widgetResults,
            summary: {
              totalItems: items.length,
              totalStores: storeResults.length,
              completeStores: storeResults.filter((s: any) => s.hasAllItems)
                .length,
              searchedItems: items,
            },
            timestamp: new Date().toISOString(),
          },
          _meta: widgetMeta(productInfoWidget),
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error fetching product price information for ${location}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );

  // Weather Forecast Tool
  server.registerTool(
    "get_weather_forecast",
    {
      title: "Get Weather Forecast",
      description:
        "Get detailed weather forecast for any city in the world with temperature, humidity, precipitation, and wind data",
      inputSchema: {
        city: z
          .string()
          .describe(
            "City name (e.g., 'Mumbai', 'New York', 'London', 'Tokyo')"
          ),
        days: z
          .number()
          .optional()
          .default(1)
          .describe("Number of forecast days (1-16, default: 1)"),
        includeHumidity: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include humidity data"),
        includePrecipitation: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include precipitation data"),
        includeWindSpeed: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include wind speed data"),
      },
    },
    async ({
      city,
      days = 1,
      includeHumidity = false,
      includePrecipitation = false,
      includeWindSpeed = false,
    }) => {
      try {
        // Get weather forecast for the city (includes geocoding)
        const result = await getWeatherForecastByCity(
          city,
          days,
          includeHumidity,
          includePrecipitation,
          includeWindSpeed
        );
        const { displayName, ...forecast } = result;

        // Generate detailed weather report
        let weatherReport = `🌤️ **Weather Forecast for ${displayName}**\n\n`;

        weatherReport += `📍 **Location:** ${forecast.location.latitude.toFixed(
          2
        )}°N, ${forecast.location.longitude.toFixed(2)}°E\n`;
        weatherReport += `🏔️ **Elevation:** ${forecast.location.elevation}m above sea level\n`;
        weatherReport += `⏰ **Timezone Offset:** ${
          forecast.location.utcOffsetSeconds / 3600
        }h from UTC\n\n`;

        weatherReport += `🌡️ **Temperature Summary:**\n`;
        weatherReport += `   Current: ${forecast.summary.currentTemp}°C\n`;
        weatherReport += `   Today's Range: ${forecast.summary.minTemp}°C - ${forecast.summary.maxTemp}°C\n`;
        weatherReport += `   Average: ${forecast.summary.avgTemp}°C\n`;
        weatherReport += `   Conditions: ${forecast.summary.description}\n\n`;

        // Show next 24 hours in 3-hour intervals
        const hoursToShow = Math.min(24, forecast.hourly.time.length);
        weatherReport += `📊 **Next ${hoursToShow} Hours (3-hour intervals):**\n`;

        for (let i = 0; i < hoursToShow; i += 3) {
          const time = forecast.hourly.time[i];
          const temp = Math.round(forecast.hourly.temperature_2m[i] * 10) / 10;
          const timeStr = time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          let hourlyInfo = `   ${timeStr}: ${temp}°C`;

          if (includeHumidity && forecast.hourly.humidity_2m) {
            const humidity = Math.round(forecast.hourly.humidity_2m[i]);
            hourlyInfo += ` | 💧${humidity}%`;
          }

          if (includePrecipitation && forecast.hourly.precipitation) {
            const precip =
              Math.round(forecast.hourly.precipitation[i] * 10) / 10;
            if (precip > 0) {
              hourlyInfo += ` | 🌧️${precip}mm`;
            }
          }

          if (includeWindSpeed && forecast.hourly.windspeed_10m) {
            const wind = Math.round(forecast.hourly.windspeed_10m[i] * 10) / 10;
            hourlyInfo += ` | 💨${wind}km/h`;
          }

          weatherReport += hourlyInfo + "\n";
        }

        // Add daily summary if more than 1 day
        if (days > 1) {
          weatherReport += `\n📅 **${days}-Day Outlook:**\n`;
          const hoursPerDay = 24;

          for (
            let day = 0;
            day < days && day * hoursPerDay < forecast.hourly.time.length;
            day++
          ) {
            const dayStart = day * hoursPerDay;
            const dayEnd = Math.min(
              (day + 1) * hoursPerDay,
              forecast.hourly.time.length
            );

            const dayTemps = Array.from(
              forecast.hourly.temperature_2m.slice(dayStart, dayEnd)
            ) as number[];
            const dayMin = Math.min(...dayTemps);
            const dayMax = Math.max(...dayTemps);
            const dayAvg =
              dayTemps.reduce((sum: number, temp: number) => sum + temp, 0) /
              dayTemps.length;

            const date = forecast.hourly.time[dayStart];
            const dateStr = date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            weatherReport += `   ${dateStr}: ${Math.round(
              dayMin
            )}°C - ${Math.round(dayMax)}°C (avg: ${Math.round(dayAvg)}°C)\n`;
          }
        }

        weatherReport += `\n⏱️ **Forecast generated:** ${new Date().toLocaleString()}\n`;
        weatherReport += `🌐 **Data source:** Open-Meteo API`;

        return {
          content: [
            {
              type: "text",
              text: weatherReport,
            },
          ],
          structuredContent: {
            forecast,
            metadata: {
              requestedDays: days,
              includeHumidity,
              includePrecipitation,
              includeWindSpeed,
              requestedCity: city,
              resolvedLocation: displayName,
              generatedAt: new Date().toISOString(),
            },
          },
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Weather forecast error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
        };
      }
    }
  );
});

// The MCP server expects POST for JSON-RPC + event stream interactions.
// The underlying handler intentionally returns 405 for GET requests, which
// causes external probes or simple browser GETs to fail. Provide a lightweight
// GET endpoint that returns a 200 OK status so health checks and simple
// browser probes succeed while POST remains routed to the full MCP handler.
export const GET = async () => {
  return new Response(
    JSON.stringify({ status: "ok", message: "MCP endpoint ready" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};

export const POST = handler;
