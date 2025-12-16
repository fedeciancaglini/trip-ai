/**
 * LangGraph Node: Calculate Routes
 * Fetches actual route data including polylines from Google Maps API
 */

import type { TripPlannerState } from "../types";
import { geocodeAddress } from "../services/google-maps";

interface RoutePolyline {
  startLocation: string;
  endLocation: string;
  points: Array<{ lat: number; lng: number }>;
  distance: string;
  duration: string;
}

interface DayRoutes {
  day: number;
  polylines: RoutePolyline[];
}

/**
 * Decode polyline using Google's polyline algorithm
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let result = 0,
      shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Fetch actual routes for daily itinerary using Google Maps API
 */
export async function calculateRoutes(
  state: TripPlannerState
): Promise<Partial<TripPlannerState>> {
  try {
    if (!state.dailyItinerary || state.dailyItinerary.length === 0) {
      return {
        routePolylines: [],
      };
    }

    const dayRoutes: DayRoutes[] = [];

    // For each day, calculate routes between consecutive POIs
    for (const day of state.dailyItinerary) {
      const dayPolylines: RoutePolyline[] = [];

      // For each consecutive pair of POIs
      for (let i = 0; i < day.pois.length - 1; i++) {
        const current = day.pois[i];
        const next = day.pois[i + 1];

        try {
          const routeData = await getRouteWithPolyline(
            { lat: current.lat, lng: current.lng },
            { lat: next.lat, lng: next.lng }
          );

          dayPolylines.push({
            startLocation: current.name,
            endLocation: next.name,
            points: routeData.points,
            distance: routeData.distance,
            duration: routeData.duration,
          });
        } catch (error) {
          // Log error but continue - use straight line as fallback
          console.error(
            `Failed to get route from ${current.name} to ${next.name}:`,
            error
          );

          // Fallback to direct coordinates
          dayPolylines.push({
            startLocation: current.name,
            endLocation: next.name,
            points: [
              { lat: current.lat, lng: current.lng },
              { lat: next.lat, lng: next.lng },
            ],
            distance: "N/A",
            duration: "N/A",
          });
        }
      }

      if (dayPolylines.length > 0) {
        dayRoutes.push({
          day: day.day,
          polylines: dayPolylines,
        });
      }
    }

    return {
      routePolylines: dayRoutes,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [`Route calculation failed: ${message}`],
      routePolylines: [],
    };
  }
}

/**
 * Get route with polyline data from Google Maps API
 */
async function getRouteWithPolyline(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{
  points: Array<{ lat: number; lng: number }>;
  distance: string;
  duration: string;
}> {
  try {
    // Use Google Maps Directions API
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("key", process.env.GOOGLE_MAPS_API_KEY || "");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      routes?: Array<{
        overview_polyline?: { points?: string };
        legs?: Array<{
          distance?: { text?: string; value?: number };
          duration?: { text?: string; value?: number };
        }>;
      }>;
      status?: string;
    };

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      throw new Error(`Google Maps API returned status: ${data.status}`);
    }

    const route = data.routes[0];
    let points: Array<{ lat: number; lng: number }> = [];
    let distance = "N/A";
    let duration = "N/A";

    // Decode polyline if available
    if (route.overview_polyline?.points) {
      points = decodePolyline(route.overview_polyline.points);
    } else {
      // Fallback to just the two endpoints
      points = [origin, destination];
    }

    // Extract distance and duration from first leg
    if (route.legs && route.legs[0]) {
      const leg = route.legs[0];
      if (leg.distance?.text) {
        distance = leg.distance.text;
      }
      if (leg.duration?.text) {
        duration = leg.duration.text;
      }
    }

    return { points, distance, duration };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch route polyline: ${message}`);
  }
}
