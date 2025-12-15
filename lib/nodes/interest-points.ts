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
): Promise<TripPlannerState> {
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
      ...state,
      pointsOfInterest: pois,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...state,
      errors: [...state.errors, `POI Discovery failed: ${message}`],
    };
  }
}
