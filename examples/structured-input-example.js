// Example of how the MCP tool now calls the API with structured input

const exampleMCPCall = {
  items: [
    {
      size: "500ml",
      brand_name: "Amul",
      product_name: "cow milk",
    },
    {
      size: "400g",
      brand_name: "Harvest Gold",
      product_name: "bread",
    },
    {
      size: "1kg",
      product_name: "basmati rice",
      query: "premium quality",
    },
  ],
  location: "Mumbai",
};

console.log("📦 New structured format example:");
console.log(JSON.stringify(exampleMCPCall, null, 2));

console.log("\n🎯 Benefits of the new format:");
console.log("✅ Separate fields for size, brand, and product name");
console.log("✅ Better sorting: product name → size → brand priority");
console.log("✅ Location parameter accepts city, area, or address");
console.log("✅ Optional query field for additional context");
console.log("✅ More precise matching and scoring");

console.log("\n🔄 Migration from old format:");
console.log("OLD: ['500ml amul cow milk', '400g harvest gold bread']");
console.log(
  "NEW: [{size: '500ml', brand_name: 'amul', product_name: 'cow milk'}, ...]"
);
