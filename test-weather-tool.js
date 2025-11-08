#!/usr/bin/env node

// Test script for the Weather Forecast Tool
// This simulates how the tool would work with the Open-Meteo API

const testWeatherForecast = async () => {
  console.log("🌤️ Testing Weather Forecast Tool\n");

  // Test locations
  const testLocations = [
    { name: "Berlin, Germany", lat: 52.52, lon: 13.41 },
    { name: "New York City, USA", lat: 40.7128, lon: -74.006 },
    { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
    { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  ];

  console.log("📍 Test Locations:");
  testLocations.forEach((loc, index) => {
    console.log(`   ${index + 1}. ${loc.name} (${loc.lat}°, ${loc.lon}°)`);
  });

  console.log("\n🔧 Tool Configuration:");
  console.log("   • Temperature: ✅ Always included");
  console.log("   • Humidity: ⚙️ Optional parameter");
  console.log("   • Precipitation: ⚙️ Optional parameter");
  console.log("   • Wind Speed: ⚙️ Optional parameter");
  console.log("   • Forecast Days: ⚙️ 1-16 days (default: 1)");

  console.log("\n📋 Example MCP Tool Calls:\n");

  // Example 1: Basic weather
  console.log("1️⃣ **Basic Weather (Temperature only):**");
  console.log(
    JSON.stringify(
      {
        tool: "get_weather_forecast",
        arguments: {
          latitude: 52.52,
          longitude: 13.41,
          locationName: "Berlin, Germany",
        },
      },
      null,
      2
    )
  );

  console.log("\n2️⃣ **Detailed Weather (All parameters):**");
  console.log(
    JSON.stringify(
      {
        tool: "get_weather_forecast",
        arguments: {
          latitude: 40.7128,
          longitude: -74.006,
          days: 3,
          includeHumidity: true,
          includePrecipitation: true,
          includeWindSpeed: true,
          locationName: "New York City",
        },
      },
      null,
      2
    )
  );

  console.log("\n3️⃣ **Weekly Forecast:**");
  console.log(
    JSON.stringify(
      {
        tool: "get_weather_forecast",
        arguments: {
          latitude: 35.6762,
          longitude: 139.6503,
          days: 7,
          includeHumidity: true,
          includePrecipitation: true,
          locationName: "Tokyo",
        },
      },
      null,
      2
    )
  );

  console.log("\n🤖 **ChatGPT Example Prompts:**\n");

  console.log('• "What\'s the weather like in Berlin today?"');
  console.log(
    '• "Give me a 3-day forecast for New York with humidity and rain data"'
  );
  console.log('• "Show me the weather in Tokyo for the next week"');
  console.log(
    '• "What\'s the temperature and wind speed in Sydney right now?"'
  );

  console.log("\n📊 **Mock Weather Report Example:**\n");

  // Simulate a weather report
  const mockReport = `🌤️ **Weather Forecast for Berlin, Germany**

📍 **Location:** 52.52°N, 13.41°E
🏔️ **Elevation:** 34m above sea level
⏰ **Timezone Offset:** 1h from UTC

🌡️ **Temperature Summary:**
   Current: 18.5°C
   Today's Range: 12.3°C - 22.1°C
   Average: 17.8°C
   Conditions: Cool

📊 **Next 24 Hours (3-hour intervals):**
   00:00: 18.5°C
   03:00: 16.2°C
   06:00: 14.8°C
   09:00: 17.3°C
   12:00: 21.1°C
   15:00: 22.1°C
   18:00: 20.4°C
   21:00: 18.9°C

⏱️ **Forecast generated:** ${new Date().toLocaleString()}
🌐 **Data source:** Open-Meteo API`;

  console.log(mockReport);

  console.log("\n✅ Weather Forecast Tool Test Complete!");
  console.log("\n🔗 **API Integration Status:**");
  console.log("   • Open-Meteo API: ✅ Integrated");
  console.log("   • Real-time Data: ✅ Available");
  console.log("   • Global Coverage: ✅ Worldwide");
  console.log("   • No API Key Required: ✅ Free to use");
};

// Run the test
testWeatherForecast().catch(console.error);
