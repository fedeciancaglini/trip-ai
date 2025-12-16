/**
 * LangGraph Node: Transportation Mode Determination
 * Determines the best transportation mode (plane, bus, train, car, etc.)
 * based on distance between origin and destination
 */

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { TripPlannerState } from "../types";

/**
 * Calculate straight-line distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
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

// Zod schema for transportation mode response
const TransportationModeSchema = z.object({
  mode: z.enum([
    "plane",
    "train",
    "bus",
    "car",
    "ferry",
    "combination",
  ]),
  reasoning: z.string().describe("Brief explanation for the chosen mode"),
});

/**
 * Determine transportation mode based on distance and context
 */
export async function determineTransportationMode(
  state: TripPlannerState,
): Promise<Partial<TripPlannerState>> {
  try {
    // Check if both origin and destination coordinates exist
    if (
      !state.originCoordinates ||
      !state.destinationCoordinates
    ) {
      // Skip if coordinates are not available - return empty update
      return {};
    }

    // Calculate distance in kilometers
    const distanceKm = calculateDistance(
      state.originCoordinates.lat,
      state.originCoordinates.lng,
      state.destinationCoordinates.lat,
      state.destinationCoordinates.lng,
    );

    // Use LLM to determine transportation mode
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: TransportationModeSchema,
      prompt: `
        You are a travel expert. Determine the most appropriate transportation mode for a trip from ${state.origin || "origin"} to ${state.destination}.

        Distance: ${distanceKm.toFixed(1)} km (${(distanceKm * 0.621371).toFixed(1)} miles)

        Consider:
        - Distance: Short (< 100 km), Medium (100-500 km), Long (500-2000 km), Very Long (> 2000 km)
        - Geography: Are there bodies of water, mountains, or other obstacles?
        - Typical transportation options for this route
        - Cost and time efficiency
        - Availability of infrastructure (airports, train stations, highways)

        Choose the most practical primary mode of transportation:
        - plane: For long distances (> 1000 km typically, or when significantly faster)
        - train: For medium to long distances with good rail infrastructure
        - bus: For short to medium distances, budget-friendly option
        - car: For short to medium distances with flexibility needs
        - ferry: When crossing significant bodies of water
        - combination: When multiple modes are typically needed (e.g., plane + car)

        Provide a brief reasoning for your choice.
      `,
    });

    return {
      transportationMode: object.mode,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [
        `Transportation mode determination failed: ${message}`,
      ],
    };
  }
}

