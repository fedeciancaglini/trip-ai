/**
 * LangGraph Node: Route Planning
 * Plans routes and generates daily itinerary using LLM
 */

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { TripPlannerState, RouteData } from "../types";

// Zod schema for daily itinerary
const DayPOISchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  lat: z.number(),
  lng: z.number(),
  timeWindow: z.string().describe("Time slot for this POI, e.g., '09:00-11:00'"),
  duration: z.number().describe("Duration in minutes"),
  travelTimeFromPrevious: z.number().describe("Travel time in minutes from previous location"),
});

const DayScheduleSchema = z.object({
  day: z.number(),
  date: z.string().describe("Date in YYYY-MM-DD format"),
  pois: z.array(DayPOISchema),
  totalDuration: z.string().describe("Total duration for the day, e.g., '6 hours'"),
});

const ItinerarySchema = z.object({
  itinerary: z.array(DayScheduleSchema),
});

/**
 * Plan routes connecting POIs and generate daily itinerary using LLM
 */
export async function planRoutes(state: TripPlannerState): Promise<Partial<TripPlannerState>> {
  try {
    if (!state.pointsOfInterest || state.pointsOfInterest.length === 0) {
      throw new Error("No POIs available for route planning");
    }

    if (!state.daysCount || state.daysCount <= 0) {
      throw new Error("Invalid number of days for route planning");
    }

    if (!state.startDate || !state.endDate) {
      throw new Error("Missing start or end date for route planning");
    }

    const startDate = state.startDate instanceof Date ? state.startDate : new Date(state.startDate);

    // Build POI list for LLM prompt
    const poiList = state.pointsOfInterest
      .map((poi) => `- ${poi.name} (${poi.category}): ${poi.description} [${poi.lat.toFixed(4)}, ${poi.lng.toFixed(4)}]`)
      .join("\n");

    // Generate dates for each day
    const dates = [];
    for (let i = 0; i < state.daysCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      dates.push(currentDate.toISOString().split("T")[0]);
    }

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: ItinerarySchema,
      prompt: `You are a travel itinerary planner. Given the following points of interest in ${state.destination}, create an optimized ${state.daysCount}-day itinerary.

Points of Interest:
${poiList}

Requirements:
1. Distribute all POIs across the ${state.daysCount} days logically (consider travel time and proximity)
2. For each day, order POIs to minimize travel between locations
3. Assign realistic time windows (start at 09:00, end by 18:00 or 19:00)
4. Allocate 2 hours per location for exploration
5. Estimate realistic travel time between consecutive locations (30-60 minutes depending on distance)
6. Provide dates in this exact order: ${dates.join(", ")}
7. Ensure each day is balanced and interesting

Return a complete itinerary with all POIs assigned to days.`,
    });

    const dailyItinerary = object.itinerary;

    // Simple route information
    const routeInformation: RouteData = {
      totalDistance: "Distance data available in map",
      totalDuration: `${state.daysCount} days`,
      routes: dailyItinerary.map((day) => ({
        day: day.day,
        legs: [],
      })),
    };

    return {
      dailyItinerary,
      routeInformation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      errors: [`Route planning failed: ${message}`],
    };
  }
}
