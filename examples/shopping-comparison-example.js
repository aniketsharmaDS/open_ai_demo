// Example usage of the Shopping List Price Comparison MCP Tool

// Test shopping list items
const testShoppingList = [
  "Organic Bananas",
  "Whole Milk 1 Gallon",
  "Sourdough Bread Loaf",
  "Organic Chicken Breast 1lb",
  "Free Range Eggs Dozen",
  "Greek Yogurt",
  "Avocados",
  "Olive Oil Extra Virgin",
  "Brown Rice 2lb",
  "Spinach Organic",
];

// Example MCP tool call payload
const mcpToolCall = {
  tool: "compare_shopping_prices",
  arguments: {
    items: testShoppingList,
    maxStores: 5,
  },
};

// Example response structure that you would get
const exampleResponse = {
  content: [
    {
      type: "text",
      text: `🛒 **Shopping List Price Comparison**

**Total Items:** 10
**Best Total Price:** $87.42
**Potential Savings:** $23.18

**Item-by-Item Comparison:**

**1. Organic Bananas**
   🏆 Best Price: $3.49 at Walmart
   🥇 Walmart: $3.49 ✅
   🥈 Kroger: $3.79 ✅
   🥉 Target: $3.99 ✅

**2. Whole Milk 1 Gallon**
   🏆 Best Price: $4.29 at Target
   🥇 Target: $4.29 ✅
   🥈 Walmart: $4.39 ✅
   🥉 Amazon Fresh: $4.49 ✅

... (continues for all items)

**Store Totals (for complete shopping):**
🥇 Walmart: $89.42 (9/10 items available)
🥈 Target: $92.15 (10/10 items available)
🥉 Kroger: $94.78 (8/10 items available)`,
    },
  ],
  structuredContent: {
    priceComparison: [
      {
        item: "Organic Bananas",
        stores: [
          {
            store: "Walmart",
            price: 3.49,
            inStock: true,
            url: "https://walmart.com/search?q=Organic%20Bananas",
          },
          // ... more stores
        ],
        lowestPrice: 3.49,
        bestStore: "Walmart",
      },
      // ... more items
    ],
    summary: {
      totalItems: 10,
      bestTotalPrice: 87.42,
      potentialSavings: 23.18,
      storeTotals: [
        {
          store: "Walmart",
          total: 89.42,
          availability: 9,
        },
        // ... more stores
      ],
    },
    timestamp: "2024-10-23T10:30:00.000Z",
  },
};

// How to integrate with ChatGPT
const chatGptPrompt = `
I have a shopping list and want to compare prices across stores. 
Please use the compare_shopping_prices tool with these items:

${testShoppingList.join(", ")}

Find me the best deals and tell me which store would be cheapest overall.
`;

console.log("Test Shopping List:", testShoppingList);
console.log("MCP Tool Call:", JSON.stringify(mcpToolCall, null, 2));
console.log("Chat GPT Prompt:", chatGptPrompt);
