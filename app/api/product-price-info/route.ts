import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AuthToken =
  "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjU0NTEzMjA5OWFkNmJmNjEzODJiNmI0Y2RlOWEyZGZlZDhjYjMwZjAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQW5pa2V0IFNoYXJtYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaTVsc3gzSGprczlOdV93TmZ0Q2EzblotTzR3OGp4UW1CajBrcmZzRllhbkZDanc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdG9sbW9sLWY3ZTQwIiwiYXVkIjoidG9sbW9sLWY3ZTQwIiwiYXV0aF90aW1lIjoxNzYyNzAyNDc2LCJ1c2VyX2lkIjoiZ0ltSHdYeGlOb1Mza2JNODZETnVmeHd1UGdHMyIsInN1YiI6ImdJbUh3WHhpTm9TM2tiTTg2RE51Znh3dVBnRzMiLCJpYXQiOjE3NjI4NDg4NTgsImV4cCI6MTc2Mjg1MjQ1OCwiZW1haWwiOiJhbmlrZXQuc2hhcm1hQGRpZ2l0YWxzYWx0LmluIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDAxODMyODA2MjkzOTUyNzU5NjkiXSwiZW1haWwiOlsiYW5pa2V0LnNoYXJtYUBkaWdpdGFsc2FsdC5pbiJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.pTCUsOUAzmhRYmT0WKGfWfArTXMhxl2gU_XDvLdG9IB78vMu2lbSLfVxxRspMTNqHTofnVua2ekGiC-PD61vChcvWBmdHCSGYVoPtbxtRMW2DydGQGWEVrSXUjTYQoq-_X4RXQngYnTNqzV3CXubeZgxU1A_7MnMSlxZ4yFdnxWz1t40eZktTHZTlLtY2QG7ieu7T9Wur1fAnMd9YMIpQSB2549D1OTij78nowhB8Y1-kuTOvJTWuyRctYs3PokN3f2MLOBnwvc_xh877CD9a0MlhCAzkC2ACJx4X8aZ1OjEccRoMf0zXiAZDca8u1koaKkv9zwbPcq_g-kI1p7AmA";
// TypeScript interfaces for better type safety
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

interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    location: string;
    coordinates: { lat: number; long: number };
    // raw responses from the upstream API per search item
    rawApiResults: Array<{
      searchItem: StructuredItem;
      rawData: any | null;
      error: string | null;
    }>;
    // processed results using the pattern matching requested
    processedResults: Array<{
      searchItem: string; // converted to string for display
      matches: any[]; // array of matched product objects (from rawData)
      error?: string | null;
    }>;
    totalItems: number;
    timestamp: string;
  };
  error?: string;
}

// Define the structured item type
interface StructuredItem {
  size?: string;
  brand_name?: string;
  product_name: string;
  query?: string;
}

// Main function to fetch raw product price information from API and
// perform enhanced pattern matching for structured input.
const fetchProductPriceInfo = async (
  items: StructuredItem[],
  location: string = "Mumbai"
) => {
  // Parse structured item into scoring components
  const parseStructuredItem = (item: StructuredItem) => {
    return {
      size: item.size ? item.size.toLowerCase().replace(/\s+/g, "") : null,
      brand: item.brand_name ? item.brand_name.toLowerCase() : null,
      productTokens: item.product_name.toLowerCase().split(/\s+/),
      searchQuery: `${item.size || ""} ${item.brand_name || ""} ${
        item.product_name
      }`.trim(),
    };
  };

  // Legacy function for backward compatibility (if needed)
  const parseItemPattern = (item: string) => {
    const parts = item.trim().split(/\s+/);
    let size: string | null = null;
    let tokens: string[] = [];

    const sizeRegex = /^\d+[\d\.\s]*(ml|l|litre|liter|g|kg|pcs|pc|pack|oz)$/i;

    if (parts.length > 0) {
      const first = parts[0].replace(/\s+/g, "");
      if (sizeRegex.test(first)) {
        size = first.toLowerCase();
        tokens = parts.slice(1).map((t) => t.toLowerCase());
      } else if (
        parts.length > 1 &&
        sizeRegex.test((parts[0] + parts[1]).replace(/\s+/g, ""))
      ) {
        size = (parts[0] + parts[1]).replace(/\s+/g, "").toLowerCase();
        tokens = parts.slice(2).map((t) => t.toLowerCase());
      } else {
        tokens = parts.map((t) => t.toLowerCase());
      }
    }

    return { size, tokens };
  };

  const normalize = (s: any) => (s ? String(s).toLowerCase() : "");

  try {
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
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "Product-Price-Info-Tool/1.0",
              Authorization: AuthToken,
            },
          });

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

    // now perform pattern matching against rawData.products
    const processedResults = rawApiResults.map((r) => {
      const { searchItem, rawData, error } = r as {
        searchItem: StructuredItem;
        rawData: any;
        error: string | null;
      };

      const searchQuery = `${searchItem.size || ""} ${
        searchItem.brand_name || ""
      } ${searchItem.product_name}`.trim();

      if (error || !rawData)
        return { searchItem: searchQuery, matches: [], error };

      const { size, brand, productTokens } = parseStructuredItem(searchItem);
      const matches: any[] = [];

      if (Array.isArray(rawData.products)) {
        // simple Levenshtein for fuzzy token matching
        const levenshtein = (a: string, b: string) => {
          if (a === b) return 0;
          const al = a.length;
          const bl = b.length;
          if (al === 0) return bl;
          if (bl === 0) return al;
          const matrix: number[][] = Array.from({ length: al + 1 }, () =>
            Array(bl + 1).fill(0)
          );
          for (let i = 0; i <= al; i++) matrix[i][0] = i;
          for (let j = 0; j <= bl; j++) matrix[0][j] = j;
          for (let i = 1; i <= al; i++) {
            for (let j = 1; j <= bl; j++) {
              const cost = a[i - 1] === b[j - 1] ? 0 : 1;
              matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
              );
            }
          }
          return matrix[al][bl];
        };

        const matchedGroups: Array<{ group: any; score: number }> = [];
        const otherGroups: any[] = [];

        rawData.products.forEach((group: any[]) => {
          if (!Array.isArray(group)) return;

          let bestScore = 0;

          for (const product of group) {
            const prodSize = normalize(
              product.size || product.package || product.pack || ""
            ).replace(/\s+/g, "");
            const prodBrand = normalize(
              product.brand || product.manufacturer || ""
            );
            const prodName = normalize(
              product.name || product.title || product.product_name || ""
            );
            const combined = `${prodBrand} ${prodName}`.trim();

            const sizeNormalized = size
              ? size.toLowerCase().replace(/\s+/g, "")
              : null;

            // Enhanced scoring based on structured input
            let productNameScore = 0;
            let sizeScore = 0;
            let brandScore = 0;

            // Score product name match
            for (const token of productTokens) {
              if (!token) continue;
              if (combined.includes(token)) {
                productNameScore += 2; // Exact match
                continue;
              }
              // fuzzy: compare against words in combined
              const words = combined.split(/\W+/).filter(Boolean);
              const fuzzy = words.some((w) => levenshtein(w, token) <= 1);
              if (fuzzy) productNameScore += 1; // Fuzzy match
            }

            // Score brand match (higher priority than size)
            const brandMatch =
              brand && prodBrand
                ? prodBrand.toLowerCase().includes(brand) ||
                  brand.includes(prodBrand.toLowerCase())
                : !brand; // No brand requirement = match

            if (brandMatch) brandScore = 5;

            // Score size match (lower priority than brand)
            const sizeMatch =
              sizeNormalized && prodSize
                ? prodSize.includes(sizeNormalized)
                : !sizeNormalized; // No size requirement = match

            if (sizeMatch) sizeScore = 3;

            // Priority scoring: product_name > brand_name > size
            const score = productNameScore * 10 + brandScore + sizeScore;
            if (score > bestScore) bestScore = score;
          }

          if (bestScore > 0) matchedGroups.push({ group, score: bestScore });
          else otherGroups.push(group);
        });

        // sort matched groups by score desc (higher relevance first)
        matchedGroups.sort((a, b) => b.score - a.score);

        // Reorder: matched groups first (in sorted order), then the others
        const reordered = [
          ...matchedGroups.map((m) => m.group),
          ...otherGroups,
        ];
        reordered.forEach((g) => matches.push(g));
      }

      return { searchItem: searchQuery, matches, error: null };
    });

    return {
      location,
      coordinates,
      rawApiResults,
      processedResults,
      totalItems: items.length,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw err;
  }
};

// Input validation schema
const requestSchema = z.object({
  items: z
    .array(
      z.object({
        size: z
          .string()
          .optional()
          .describe("Product size like '500ml', '1kg', etc."),
        brand_name: z
          .string()
          .optional()
          .describe("Brand name like 'Amul', 'Nestle', etc."),
        product_name: z
          .string()
          .describe("Product name like 'cow milk', 'bread', etc."),
        query: z
          .string()
          .optional()
          .describe("Additional search context or full query"),
      })
    )
    .min(1, "At least one item is required"),
  location: z
    .string()
    .optional()
    .default("Mumbai")
    .describe("Location to search - can be city, area, or address"),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    console.log("API Request body:", body);

    // Validate input
    const validatedInput = requestSchema.parse(body);
    const { items, location } = validatedInput;

    console.log("Validated input:", { items, location });

    // Fetch raw product price information
    const results = await fetchProductPriceInfo(items, location);

    console.log("API Results:", {
      totalItems: results.totalItems,
      totalApiResults: results.rawApiResults.length,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully fetched raw product data for ${items.length} items in ${location}`,
      data: results,
    });
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input parameters",
          error: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET method for simple testing
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url);
  const itemStrings = searchParams.get("items")?.split(",") || ["milk"];
  const location =
    searchParams.get("location") || searchParams.get("city") || "Mumbai";

  try {
    console.log("GET Request params:", { items: itemStrings, location });

    // Convert string items to StructuredItems for backward compatibility
    const items: StructuredItem[] = itemStrings.map((item) => ({
      product_name: item.trim(),
      // Could parse size/brand from the string if needed, but for simplicity just use product_name
    }));

    const results = await fetchProductPriceInfo(items, location);

    return NextResponse.json({
      success: true,
      message: `Successfully fetched raw product data for ${items.length} items in ${location}`,
      data: results,
    });
  } catch (error) {
    console.error("GET API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product price information",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
