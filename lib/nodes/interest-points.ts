/**
 * LangGraph Node: Interest Points Discovery
 * Discovers POIs using Gemini API
 */

import { discoverPointsOfInterest } from "../services/gemini";
import type { TripPlannerState } from "../types";

/**
 * Discover points of interest for the destination
 */
export async function discoverInterestPoints(
  state: TripPlannerState,
): Promise<Partial<TripPlannerState>> {
  try {
    const pois = await discoverPointsOfInterest(
      state.destination,
      state.startDate,
      state.endDate,
    );

    if (!pois || pois.length === 0) {
      throw new Error("No points of interest found for destination");
    }

    return {
      pointsOfInterest: pois,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [`POI Discovery failed: ${message}`],
    };
  }
}
