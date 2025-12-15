/**
 * LangGraph Node: Route Planning
 * Plans routes and generates daily itinerary using Google Maps
 */

import { planDailyRoutes } from "../services/google-maps";
import type { TripPlannerState } from "../types";

/**
 * Plan routes connecting POIs and generate daily itinerary
 */
export async function planRoutes(state: TripPlannerState): Promise<TripPlannerState> {
  try {
    if (!state.pointsOfInterest || state.pointsOfInterest.length === 0) {
      throw new Error("No POIs available for route planning");
    }

    const routeData = await planDailyRoutes(
      state.pointsOfInterest,
      state.startDate,
      state.endDate,
    );

    // Extract daily itinerary from route data
    // The planDailyRoutes function already generates the itinerary
    // For now, create a simple itinerary structure
    const dailyItinerary = state.pointsOfInterest
      .reduce(
        (acc, poi, idx) => {
          const dayIndex = Math.floor(idx / Math.ceil(state.pointsOfInterest.length / state.daysCount));
          if (!acc[dayIndex]) {
            acc[dayIndex] = {
              day: dayIndex + 1,
              date: new Date(state.startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              pois: [],
              totalDuration: "",
            };
          }
          acc[dayIndex].pois.push({
            ...poi,
            timeWindow: `${9 + (idx % 5) * 2}:00-${11 + (idx % 5) * 2}:00`,
            duration: 120,
            travelTimeFromPrevious: idx % 5 === 0 ? 0 : 30,
          });
          return acc;
        },
        [] as Array<{
          day: number;
          date: string;
          pois: Array<typeof state.pointsOfInterest[0] & {
            timeWindow: string;
            duration: number;
            travelTimeFromPrevious: number;
          }>;
          totalDuration: string;
        }>,
      )
      .map((day) => ({
        ...day,
        totalDuration: `${day.pois.length * 2} hours`,
      }));

    return {
      ...state,
      dailyItinerary,
      routeInformation: routeData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...state,
      errors: [...state.errors, `Route planning failed: ${message}`],
    };
  }
}
