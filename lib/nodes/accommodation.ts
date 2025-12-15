/**
 * LangGraph Node: Accommodation Search
 * Searches for Airbnb listings matching criteria
 */

import { searchAirbnb } from "../services/airbnb-mcp";
import type { TripPlannerState } from "../types";

/**
 * Search for accommodations matching date range and budget
 */
export async function searchAccommodation(
  state: TripPlannerState,
): Promise<TripPlannerState> {
  try {
    const checkInDate = state.startDate.toISOString().split("T")[0];
    const checkOutDate = state.endDate.toISOString().split("T")[0];

    // Search for accommodations
    const listings = await searchAirbnb(
      state.destination,
      checkInDate,
      checkOutDate,
      state.budgetUsd,
      state.daysCount,
    );

    if (!Array.isArray(listings)) {
      throw new Error("Invalid response from Airbnb MCP server");
    }

    return {
      ...state,
      airbnbRecommendations: listings.slice(0, 10), // Limit to top 10
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...state,
      errors: [...state.errors, `Accommodation search failed: ${message}`],
    };
  }
}
