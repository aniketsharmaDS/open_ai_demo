# Product Price Info Tool - API Call Structure

## Overview

The Product Price Info MCP tool calls the Next.js API endpoint using the standard **Fetch API**.

## API Call Location

File: `/app/mcp/route.ts`
Line: ~1003

## API Call Code

```typescript
const apiResponse = await fetch(`${baseURL}/api/product-price-info`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    items,
    location,
  }),
});
```

## Request Structure

### Endpoint

- **URL**: `${baseURL}/api/product-price-info`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body (New Structured Format)

```json
{
  "items": [
    {
      "size": "1kg",
      "brand_name": "Tata Sampann",
      "product_name": "Basmati Rice",
      "query": "optional additional context"
    }
  ],
  "location": "Mumbai"
}
```

### Field Descriptions

| Field                  | Type   | Required | Description                                                  |
| ---------------------- | ------ | -------- | ------------------------------------------------------------ |
| `items`                | Array  | Yes      | Array of structured product items                            |
| `items[].size`         | String | No       | Product size (e.g., "500ml", "1kg")                          |
| `items[].brand_name`   | String | No       | Brand name (e.g., "Amul", "Tata")                            |
| `items[].product_name` | String | Yes      | Product name (e.g., "cow milk", "rice")                      |
| `items[].query`        | String | No       | Additional search context                                    |
| `location`             | String | No       | Search location - city, area, or address (default: "Mumbai") |

## Response Structure

### Success Response

```json
{
  "success": true,
  "message": "Successfully fetched raw product data for 1 items in Mumbai",
  "data": {
    "location": "Mumbai",
    "coordinates": {
      "lat": 19.0759837,
      "long": 72.8776559
    },
    "rawApiResults": [...],
    "processedResults": [
      {
        "searchItem": "1kg Tata Sampann Basmati Rice",
        "matches": [
          [
            {
              "name": "Classic Basmati Rice",
              "price": 203.6,
              "platform": "bbnow",
              "in_stock": true,
              "url": "https://..."
            }
          ]
        ],
        "error": null
      }
    ],
    "totalItems": 1,
    "timestamp": "2025-11-05T13:10:45.754Z"
  }
}
```

## Widget Results Transformation

The MCP tool transforms the API response into a format the UI widget expects:

```typescript
const widgetResults = {
  location,
  coordinates,
  items: processedResults.map((result: any) => ({
    item: result.searchItem,
    products:
      result.matches && result.matches.length > 0 ? result.matches[0] : [],
    totalFound: result.matches ? result.matches.length : 0,
    searchQuery: result.searchItem,
    error: result.error,
  })),
  stores: storeResults,
  totalItems: items.length,
  timestamp: new Date().toISOString(),
};
```

## Common Issues & Solutions

### Issue 1: Loader keeps spinning, no UI response

**Cause**: The summary text generation was referencing properties that don't exist in the data structure (e.g., `item.hasMatch`, `item.product`)

**Solution**: Fixed to use the actual structure:

- Use `item.products && item.products.length > 0` instead of `item.hasMatch`
- Use `item.products` array instead of `item.product` single object

### Issue 2: items.join() error

**Cause**: Items are now structured objects, not strings

**Solution**: Convert structured items to strings before joining:

```typescript
const itemsDisplay = items
  .map((item: any) => {
    const parts = [];
    if (item.size) parts.push(item.size);
    if (item.brand_name) parts.push(item.brand_name);
    parts.push(item.product_name);
    return parts.join(" ");
  })
  .join(", ");
```

## Testing the API

### Using the test script

```bash
node test-structured-input.js
```

### Manual testing with curl

```bash
curl -X POST http://localhost:3000/api/product-price-info \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "size": "1kg",
        "brand_name": "Tata Sampann",
        "product_name": "Basmati Rice"
      }
    ],
    "location": "Mumbai"
  }'
```

## Benefits of Fetch API

1. **Native JavaScript**: No external dependencies required
2. **Promise-based**: Works seamlessly with async/await
3. **Standard API**: Consistent across Node.js and browsers
4. **Flexible**: Easy to add headers, handle different content types
5. **Error handling**: Clear error states and response checking

## Alternative HTTP Clients

While Fetch is used, other options include:

- **axios**: Feature-rich HTTP client with interceptors
- **got**: Lightweight alternative with better Node.js support
- **node-fetch**: Polyfill for older Node.js versions (not needed in modern Next.js)
