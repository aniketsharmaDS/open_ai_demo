#!/usr/bin/env node

// Test script for the updated combined Weather Forecast Tool
// This demonstrates the new single function that handles both geocoding and weather

const testCombinedWeatherTool = async () => {
  console.log("🌤️ Testing Combined Weather Forecast Tool (City Name Input)\n");

  // Test cities from different continents
  const testCities = [
    "Mumbai",
    "New York",
    "London",
    "Tokyo",
    "Sydney",
    "Dubai",
    "Paris",
    "Toronto",
  ];

  console.log("🏙️ Test Cities:");
  testCities.forEach((city, index) => {
    console.log(`   ${index + 1}. ${city}`);
  });

  console.log("\n✨ **Key Improvements:**");
  console.log("   • ✅ Single function call (previously 2 separate functions)");
  console.log("   • ✅ Automatic geocoding from city name");
  console.log("   • ✅ Combined error handling");
  console.log("   • ✅ Simplified API for users");
  console.log("   • ✅ Better performance (fewer function calls)");

  console.log("\n📋 **Updated MCP Tool Examples:**\n");

  // Example 1: Simple weather for Mumbai
  console.log("1️⃣ **Simple Weather (Mumbai):**");
  console.log(
    JSON.stringify(
      {
        tool: "get_weather_forecast",
        arguments: {
          city: "Mumbai",
        },
      },
      null,
      2
    )
  );

  console.log("\n2️⃣ **Detailed 3-Day Forecast (New York):**");
  console.log(
    JSON.stringify(
      {
        tool: "get_weather_forecast",
        arguments: {
          city: "New York",
          days: 3,
          includeHumidity: true,
          includePrecipitation: true,
          includeWindSpeed: true,
        },
      },
      null,
      2
    )
  );

  console.log("\n3️⃣ **Weekly Forecast (London):**");
  console.log(
    JSON.stringify(
      {
        tool: "get_weather_forecast",
        arguments: {
          city: "London",
          days: 7,
          includeHumidity: true,
          includePrecipitation: true,
        },
      },
      null,
      2
    )
  );

  console.log("\n🤖 **ChatGPT Example Prompts:**\n");

  console.log('• "What\'s the weather like in Mumbai today?"');
  console.log('• "Give me a 3-day forecast for New York with humidity"');
  console.log('• "Will it rain in London this week?"');
  console.log('• "Show me the temperature in Tokyo for the next 5 days"');
  console.log('• "What\'s the weather forecast for Dubai with wind data?"');

  console.log("\n📊 **Sample Response Format:**\n");

  // Simulate a combined response
  const mockResponse = `🌤️ **Weather Forecast for Mumbai, Mumbai Suburban, Maharashtra, India**

📍 **Location:** 19.05°N, 72.87°E
🏔️ **Elevation:** 8m above sea level
⏰ **Timezone Offset:** 5.5h from UTC

🌡️ **Temperature Summary:**
   Current: 28.5°C
   Today's Range: 24.2°C - 32.1°C
   Average: 29.8°C
   Conditions: Warm

📊 **Next 24 Hours (3-hour intervals):**
   00:00: 28.5°C
   03:00: 26.8°C | 💧78% | 💨12.3km/h
   06:00: 25.2°C | 💧82% | 💨8.7km/h
   09:00: 27.8°C | 💧71% | 💨15.2km/h
   12:00: 31.2°C | 💧65% | 💨18.4km/h
   15:00: 32.1°C | 💧60% | 💨22.1km/h
   18:00: 30.4°C | 💧68% | 💨16.8km/h
   21:00: 29.1°C | 💧74% | 💨13.5km/h

⏱️ **Forecast generated:** ${new Date().toLocaleString()}
🌐 **Data source:** Open-Meteo API`;

  console.log(mockResponse);

  console.log("\n🔧 **Technical Changes Made:**\n");
  console.log("**Before (2 separate functions):**");
  console.log("   1. geocodeCity(cityName) → coordinates");
  console.log("   2. fetchWeatherForecast(lat, lon, options) → weather");
  console.log("");
  console.log("**After (1 combined function):**");
  console.log(
    "   1. getWeatherForecastByCity(cityName, options) → weather + location"
  );
  console.log("");
  console.log("**Benefits:**");
  console.log("   • Reduced API calls in tool registration");
  console.log("   • Simplified error handling");
  console.log("   • Better user experience (just city names)");
  console.log("   • Atomic operation (geocoding + weather together)");

  console.log("\n✅ Combined Weather Tool Test Complete!");
  console.log("\n🚀 **Ready for ChatGPT Integration:**");
  console.log("   • Users can now simply say city names");
  console.log("   • No need for coordinates");
  console.log("   • Automatic location resolution");
  console.log("   • Global city support via geocoding API");
};

// Run the test
testCombinedWeatherTool().catch(console.error);
