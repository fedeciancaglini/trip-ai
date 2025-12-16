/**
 * LangGraph Node: Car Route Calculation
 * Calculates the driving route from origin to destination when transportation mode is car
 */

import { calculateCarRoute } from "../services/google-maps";
import type { TripPlannerState, RouteData } from "../types";

/**
 * Calculate car route from origin to destination
 */
export async function calculateCarRouteNode(
  state: TripPlannerState,
): Promise<Partial<TripPlannerState>> {
  try {
    // Only calculate if transportation mode is car
    if (state.transportationMode !== "car") {
      // Skip if not car mode - return empty update
      return {};
    }

    // Check if both origin and destination coordinates exist
    if (
      !state.originCoordinates ||
      !state.destinationCoordinates
    ) {
      return {
        errors: [
          "Cannot calculate car route: missing origin or destination coordinates",
        ],
      };
    }

    // Calculate the driving route
    const routeInfo = await calculateCarRoute(
      state.originCoordinates,
      state.destinationCoordinates
    );

    // Create route data structure
    const routeInformation: RouteData = {
      totalDistance: routeInfo.distance,
      totalDuration: routeInfo.duration,
      routes: [
        {
          day: 0, // Special day 0 for origin-to-destination route
          legs: [
            {
              startLocation: state.origin || "Origin",
              endLocation: state.destination,
              distance: routeInfo.distance,
              duration: routeInfo.duration,
            },
          ],
          steps: routeInfo.steps, // Include detailed steps for map rendering
        },
      ],
    };

    return {
      routeInformation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [`Car route calculation failed: ${message}`],
    };
  }
}
