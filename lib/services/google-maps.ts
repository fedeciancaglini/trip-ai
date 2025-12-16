/**
 * Google Maps MCP Service
 * Client for interacting with the Google Maps MCP server
 * https://github.com/modelcontextprotocol/servers
 *
 * Uses @modelcontextprotocol/sdk to spawn and communicate with the MCP server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { DaySchedule, POI, RouteData, RouteStep } from "../types";
import { GoogleMapsError } from "../types";

let googleMapsClient: Client | null = null;
let initPromise: Promise<Client> | null = null;

/**
 * Initialize the Google Maps MCP client by spawning the server process
 */
async function initializeGoogleMapsClient(): Promise<Client> {
  // Return existing client if already initialized
  if (googleMapsClient) {
    return googleMapsClient;
  }

  // Return pending initialization if already in progress
  if (initPromise) {
    return initPromise;
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-google-maps"],
        env: {
          GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      });

      const client = new Client(
        {
          name: "trip-planner-google-maps",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      googleMapsClient = client;
      return client;
    } catch (error) {
      initPromise = null; // Reset on error so next call tries again
      throw new GoogleMapsError(
        `Failed to initialize Google Maps MCP: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  })();

  return initPromise;
}

/**
 * Plan daily routes connecting POIs
 * Uses nearest neighbor algorithm to optimize route each day
 */
export async function planDailyRoutes(
  pois: POI[],
  startDate: Date,
  endDate: Date
): Promise<RouteData> {
  try {
    const numDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Simple distribution: spread POIs evenly across days
    const poisPerDay = Math.ceil(pois.length / numDays);
    const dailyItinerary: DaySchedule[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    const routes = [];

    // For each day, create a sub-route
    for (let day = 1; day <= numDays; day++) {
      const startIdx = (day - 1) * poisPerDay;
      const endIdx = Math.min(day * poisPerDay, pois.length);
      const dayPois = pois.slice(startIdx, endIdx);

      if (dayPois.length === 0) {
        continue;
      }

      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day - 1);
      const dateStr = currentDate.toISOString().split("T")[0];

      // For each POI on this day, calculate travel time to next
      const dayRoute = {
        day,
        legs: [] as Array<{
          startLocation: string;
          endLocation: string;
          distance: string;
          duration: string;
        }>,
      };

      for (let i = 0; i <= dayPois.length - 1; i++) {
        const start = dayPois[i];
        const end = dayPois[i + 1];

        // Call Google Maps MCP for this leg
        try {
          const routeData = await getRoute(
            { lat: start.lat, lng: start.lng },
            { lat: end.lat, lng: end.lng }
          );

          dayRoute.legs.push({
            startLocation: start.name,
            endLocation: end.name,
            distance: routeData.distance,
            duration: routeData.duration,
          });

          totalDistance += routeData.distanceValue;
          totalDuration += routeData.durationValue;
        } catch {
          // Fallback: estimate based on straight-line distance
          const estimatedDist = calculateDistance(
            start.lat,
            start.lng,
            end.lat,
            end.lng
          );
          dayRoute.legs.push({
            startLocation: start.name,
            endLocation: end.name,
            distance: `${(estimatedDist / 1000).toFixed(1)} km`,
            duration: `${Math.ceil(estimatedDist / 60)} mins`,
          });
          totalDistance += estimatedDist * 1000;
          totalDuration += estimatedDist * 60;
        }
      }

      if (dayRoute.legs.length > 0) {
        routes.push(dayRoute);
      }

      dailyItinerary.push({
        day,
        date: dateStr,
        pois: dayPois.map((poi, index) => ({
          ...poi,
          timeWindow: `${9 + index * 2}:00-${11 + index * 2}:00`,
          duration: 120,
          travelTimeFromPrevious: index === 0 ? 0 : 30,
        })),
        totalDuration: `${dayRoute.legs.length * 2} hours`,
      });
    }

    return {
      totalDistance: formatDistance(totalDistance),
      totalDuration: formatDuration(totalDuration),
      routes,
    };
  } catch (error) {
    if (error instanceof GoogleMapsError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new GoogleMapsError(`Route planning failed: ${error.message}`);
    }
    throw new GoogleMapsError("Route planning failed: Unknown error");
  }
}

/**
 * Geocode an address to coordinates using MCP
 * @param address - Address string to geocode
 * @returns Coordinates object with lat and lng
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  try {
    const client = await initializeGoogleMapsClient();

    // Use maps_geocode tool
    const result = await client.callTool({
      name: "maps_geocode",
      arguments: {
        address: address,
      },
    });

    if (!result.content || !Array.isArray(result.content)) {
      throw new Error("Invalid response from Google Maps MCP: no content");
    }

    // Parse the response
    for (const content of result.content) {
      if (content.type !== "text") continue;

      try {
        const parsed = JSON.parse(content.text);

        let lat: number;
        let lng: number;

        if (parsed.location && parsed.location.lat && parsed.location.lng) {
          lat = parsed.location.lat;
          lng = parsed.location.lng;
        } else {
          throw new Error(
            "Could not parse coordinates from geocoding response"
          );
        }

        // Validate coordinates
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          isNaN(lat) ||
          isNaN(lng)
        ) {
          throw new Error("Invalid coordinates in geocoding response");
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          throw new Error("Coordinates out of valid range");
        }

        return { lat, lng };
      } catch (parseError) {
        // If not JSON, try to extract from text
        console.error(
          "Failed to parse Google Maps MCP geocoding response:",
          parseError
        );
        continue;
      }
    }

    throw new Error("Could not parse coordinates from MCP geocoding response");
  } catch (error) {
    if (error instanceof GoogleMapsError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new GoogleMapsError(`Geocoding failed: ${error.message}`);
    }
    throw new GoogleMapsError("Geocoding failed: Unknown error");
  }
}

/**
 * Calculate car route from origin to destination
 * Public function for calculating driving route between two locations
 */
export async function calculateCarRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
  steps: RouteStep[];
}> {
  return getRoute(origin, destination);
}

/**
 * Get route information between two points using MCP maps_directions tool
 */
async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
  steps: RouteStep[];
}> {
  try {
    const client = await initializeGoogleMapsClient();

    // Use maps_directions tool
    const result = await client.callTool({
      name: "maps_directions",
      arguments: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: "driving",
      },
    });

    if (!result.content || !Array.isArray(result.content)) {
      throw new Error("Invalid response from Google Maps MCP: no content");
    }

    // Parse the response - maps_directions returns array format
    // [{ summary, distance: { text, value }, duration: { text, value }, steps: [...] }]
    for (const content of result.content) {
      if (content.type !== "text") continue;

      try {
        const parsed = JSON.parse(content.text);
        const routes = parsed.routes;

        if (!Array.isArray(routes) || routes.length === 0) {
          throw new Error("Invalid maps_directions response format: expected array");
        }

        const route = routes[0];
        
        if (!route.distance || typeof route.distance.value !== "number") {
          throw new Error("Invalid distance in maps_directions response");
        }
        
        if (!route.duration || typeof route.duration.value !== "number") {
          throw new Error("Invalid duration in maps_directions response");
        }

        const distanceValue = route.distance.value; // in meters
        const durationValue = route.duration.value; // in seconds

        // Extract steps if available
        const steps: RouteStep[] = route.steps && Array.isArray(route.steps)
          ? route.steps.map((step: any) => ({
              instructions: step.instructions || "",
              distance: {
                text: step.distance?.text || "",
                value: step.distance?.value || 0,
              },
              duration: {
                text: step.duration?.text || "",
                value: step.duration?.value || 0,
              },
              travel_mode: step.travel_mode || "DRIVING",
            }))
          : [];

        return {
          distance: route.distance.text || `${(distanceValue / 1000).toFixed(1)} km`,
          distanceValue,
          duration: route.duration.text || formatDuration(durationValue),
          durationValue,
          steps,
        };
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes("Invalid")) {
          throw parseError;
        }
        // If not JSON or parsing failed, log and continue
        console.error("Failed to parse Google Maps MCP response:", parseError);
        continue;
      }
    }

    throw new Error("Could not parse route data from maps_directions response");
  } catch (error) {
    if (error instanceof GoogleMapsError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`Route calculation failed: ${error.message}`);
    }
    throw new Error("Route calculation failed: Unknown error");
  }
}

/**
 * Parse duration string (e.g., "3600s", "1h 30m") to seconds
 */
function parseDuration(duration: string): number {
  // Handle ISO 8601 duration format (e.g., "3600s", "1h", "1h30m")
  if (duration.endsWith("s")) {
    return parseInt(duration) || 3600;
  }

  // Handle "Xh Ym" format
  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  return hours * 3600 + minutes * 60;
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance value to readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration value (seconds) to readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} minutes`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (minutes === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Close the Google Maps MCP client connection
 * Call this during app shutdown
 */
export async function closeGoogleMapsClient(): Promise<void> {
  if (googleMapsClient) {
    // MCP client doesn't have explicit close, but we can clear reference
    googleMapsClient = null;
    initPromise = null;
  }
}
