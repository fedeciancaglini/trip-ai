/**
 * LangGraph Node: Geocoding
 * Geocodes destination and origin addresses to coordinates
 */

import { geocodeAddress } from "../services/google-maps";
import type { TripPlannerState } from "../types";

/**
 * Geocode destination and origin addresses to coordinates
 */
export async function geocodeLocations(
  state: TripPlannerState,
): Promise<TripPlannerState> {
  try {
    const updates: Partial<TripPlannerState> = {};

    // Geocode destination (required)
    try {
      const destinationCoords = await geocodeAddress(state.destination);
      updates.destinationCoordinates = destinationCoords;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ...state,
        errors: [
          ...state.errors,
          `Failed to geocode destination "${state.destination}": ${message}`,
        ],
      };
    }

    // Geocode origin (optional)
    if (state.origin && state.origin.trim() !== "") {
      try {
        const originCoords = await geocodeAddress(state.origin);
        updates.originCoordinates = originCoords;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Log warning but don't fail the workflow if origin geocoding fails
        return {
          ...state,
          ...updates,
          errors: [
            ...state.errors,
            `Failed to geocode origin "${state.origin}": ${message}. Continuing without origin coordinates.`,
          ],
        };
      }
    }

    return {
      ...state,
      ...updates,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...state,
      errors: [...state.errors, `Geocoding failed: ${message}`],
    };
  }
}

