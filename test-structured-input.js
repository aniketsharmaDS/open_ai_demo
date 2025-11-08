// Test script for the new structured input format
const testStructuredFormat = async () => {
  const testData = {
    items: [
      {
        size: "500ml",
        brand_name: "Amul",
        product_name: "cow milk",
        query: "fresh dairy",
      },
      {
        product_name: "bread",
        brand_name: "Harvest Gold",
      },
      {
        size: "1kg",
        product_name: "basmati rice",
      },
    ],
    location: "Mumbai",
  };

  try {
    console.log("🧪 Testing structured input format...");
    console.log("📋 Test data:", JSON.stringify(testData, null, 2));

    const response = await fetch(
      "http://localhost:3000/api/product-price-info",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ API Response:", JSON.stringify(result, null, 2));

    // Test the enhanced sorting preferences
    if (result.success && result.data) {
      console.log("\n🎯 Testing sorting preferences:");
      result.data.processedResults.forEach((item, index) => {
        console.log(`\n${index + 1}. Item: ${item.searchItem}`);
        if (item.matches && item.matches.length > 0) {
          console.log(`   📊 Found ${item.matches.length} product groups`);
          console.log(`   🥇 Best match: ${item.matches[0][0]?.name || "N/A"}`);
        } else {
          console.log(`   ❌ No matches found`);
        }
      });
    }

    return result;
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

// Run the test
testStructuredFormat()
  .then(() => console.log("\n🎉 Test completed successfully!"))
  .catch((error) => console.error("\n💥 Test failed:", error));
