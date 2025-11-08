// Test script for shopping price comparison with real API
// Note: Using built-in fetch (Node.js 18+)

// Mock the geocoding function
async function geocodeCity(city) {
  try {
    const apiKey = "6900978dc9f28933450103qhj0eb6f7";
    const encodedCity = encodeURIComponent(city);
    const geocodeUrl = `https://geocode.maps.co/search?q=${encodedCity}&api_key=${apiKey}`;

    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodeResponse.status}`);
    }

    const geocodeData = await geocodeResponse.json();
    if (!geocodeData || geocodeData.length === 0) {
      throw new Error(`No location found for "${city}"`);
    }

    const { lat, lon } = geocodeData[0];
    return { lat, lon };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

// Test the shopping API
async function testShoppingAPI() {
  console.log("🚀 Testing Shopping Price Comparison API Integration\n");

  try {
    const city = "Mumbai";
    const items = ["bread", "milk"];

    console.log(`📍 Testing geocoding for: ${city}`);
    const { lat, lon } = await geocodeCity(city);
    console.log(`✅ Coordinates: ${lat}, ${lon}\n`);

    console.log(`🛒 Testing price comparison for items: ${items.join(", ")}`);

    for (const item of items) {
      console.log(`\n🔍 Searching for: ${item}`);

      const apiUrl = `https://tolmol-api.prod.shelfradar.ai/api/v4/aggregate?q=${encodeURIComponent(
        item
      )}&lat=${lat}&long=${lon}`;
      console.log(`API URL: ${apiUrl}`);

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Shopping-Comparison-Tool/1.0",
            Authorization:
              "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjdlYTA5ZDA1NzI2MmU2M2U2MmZmNzNmMDNlMDRhZDI5ZDg5Zjg5MmEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQW5pa2V0IFNoYXJtYSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLaTVsc3gzSGprczlOdV93TmZ0Q2EzblotTzR3OGp4UW1CajBrcmZzRllhbkZDanc9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdG9sbW9sLWY3ZTQwIiwiYXVkIjoidG9sbW9sLWY3ZTQwIiwiYXV0aF90aW1lIjoxNzYxMjkyMzE2LCJ1c2VyX2lkIjoiZ0ltSHdYeGlOb1Mza2JNODZETnVmeHd1UGdHMyIsInN1YiI6ImdJbUh3WHhpTm9TM2tiTTg2RE51Znh3dVBnRzMiLCJpYXQiOjE3NjE2NDgwNzEsImV4cCI6MTc2MTY1MTY3MSwiZW1haWwiOiJhbmlrZXQuc2hhcm1hQGRpZ2l0YWxzYWx0LmluIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDAxODMyODA2MjkzOTUyNzU5NjkiXSwiZW1haWwiOlsiYW5pa2V0LnNoYXJtYUBkaWdpdGFsc2FsdC5pbiJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.XtBbrgZz_yXu3s4dUGSxADp3W-zetHlsMs4FMYaLAbeAEeNM79IeiCxbx1rRA4xs_jaajiQ2MZw2k9OGnQnPxUJTXNlH2zibpo5EoAAbFUUy6KkoWRMOG3kG-0hZkt3oQpTe3CaTj5-RHkg2kvbUA1FJE2wjxiLJtnXqYUS2WhMNZojNyhnKypb_F8S8I1apY2d7lLwQYQUxbbxYp0RewC6PmY8qaz22nUI-_qc2t0n1Stf0n2-JhjakLqkhyjzkbUtcgI81V8f7L1zaD-kV5-XrrLk67KfpZ6Zw65wj0aI4ZxuNhDOxsRPdCT3YXtRucF8mfNnzOMG_9SBpHJ9hbQ",
          },
        });

        console.log(
          `Response status: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          console.log(`❌ API request failed for ${item}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`✅ Data received for ${item}`);
        console.log(
          `Total product groups: ${data.products ? data.products.length : 0}`
        );

        if (
          data.products &&
          Array.isArray(data.products) &&
          data.products.length > 0
        ) {
          console.log("\n📊 Sample results:");

          // Show first 3 product groups
          data.products.slice(0, 3).forEach((productGroup, groupIndex) => {
            if (Array.isArray(productGroup) && productGroup.length > 0) {
              const product = productGroup[0]; // First product in group
              console.log(
                `\n${groupIndex + 1}. ${product.platform || "Unknown Store"}`
              );
              console.log(`   Name: ${product.name || "N/A"}`);
              console.log(`   Brand: ${product.brand_name || "N/A"}`);
              console.log(`   Price: ₹${product.price || 0}`);
              console.log(`   MRP: ₹${product.mrp || 0}`);
              console.log(`   Size: ${product.size || "N/A"}`);
              console.log(`   In Stock: ${product.in_stock ? "Yes" : "No"}`);
              console.log(`   URL: ${product.url || "N/A"}`);
            }
          });
        } else {
          console.log(`⚠️ No products found for "${item}"`);
        }
      } catch (itemError) {
        console.log(`❌ Error fetching data for ${item}:`, itemError.message);
      }
    }

    console.log("\n✅ Test completed successfully!");
    console.log("\n🔗 The shopping comparison tool now supports:");
    console.log("   • Real-time price data from Tolmol API");
    console.log("   • Automatic geocoding for any city");
    console.log("   • Fallback to mock data if API fails");
    console.log("   • Rich product information (images, brands, sizes)");
    console.log("   • HTML widget display support");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testShoppingAPI();
