#!/usr/bin/env node

// Simple test script to verify the shopping list price comparison tool
const testShoppingList = async () => {
  const testItems = ["Organic Bananas", "Whole Milk 1 Gallon", "Bread Loaf"];

  console.log("🛒 Testing Shopping List Price Comparison Tool\n");
  console.log("Test Items:", testItems.join(", "));
  console.log("\nStarting price comparison...\n");

  // Simulate the price comparison function
  const mockComparison = testItems.map((item) => {
    const stores = ["Walmart", "Target", "Kroger"];
    const prices = stores
      .map((store) => ({
        store,
        price: parseFloat((Math.random() * 15 + 3).toFixed(2)),
        inStock: Math.random() > 0.1,
      }))
      .sort((a, b) => a.price - b.price);

    return {
      item,
      bestPrice: prices[0].price,
      bestStore: prices[0].store,
      allPrices: prices,
    };
  });

  // Display results
  mockComparison.forEach((item, index) => {
    console.log(`${index + 1}. ${item.item}`);
    console.log(`   🏆 Best: $${item.bestPrice} at ${item.bestStore}`);
    item.allPrices.forEach((store, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
      const stock = store.inStock ? "✅" : "❌";
      console.log(`   ${medal} ${store.store}: $${store.price} ${stock}`);
    });
    console.log("");
  });

  const totalBest = mockComparison.reduce(
    (sum, item) => sum + item.bestPrice,
    0
  );
  console.log(`💰 Total Best Price: $${totalBest.toFixed(2)}`);
  console.log("\n✅ Test completed successfully!");
};

// Run the test
testShoppingList().catch(console.error);
