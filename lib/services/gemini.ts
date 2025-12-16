/**
 * Gemini API Service
 * Wrapper for Google's Generative AI API for POI discovery using Vercel AI SDK
 */

import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { POI } from "../types";
import { GeminiError } from "../types";

// Zod schema for POI discovery response
const POIDiscoverySchema = z.object({
  pois: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      category: z.enum([
        "museum",
        "landmark",
        "park",
        "restaurant",
        "market",
        "historical",
        "natural",
        "entertainment",
      ]),
      lat: z.number(),
      lng: z.number(),
    })
  ),
});

/**
 * Discover points of interest for a destination using Gemini
 * @param destination - Travel destination
 * @param startDate - Trip start date
 * @param endDate - Trip end date
 * @returns Array of POI objects
 */
export async function discoverPointsOfInterest(
  destination: string,
  startDate: Date,
  endDate: Date
): Promise<POI[]> {
  try {
    const tripLength = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: POIDiscoverySchema,
      prompt: `
      You are a travel expert. Suggest 10-12 interesting points of interest for a ${tripLength}-day trip to ${destination}.

      Requirements:
      - Include a mix of categories (museum, landmark, park, restaurant, market, historical, natural, entertainment)
      - Provide accurate latitude/longitude coordinates
      - Descriptions should be engaging and specific (2-3 sentences explaining why it's worth visiting)
      - Focus on popular, accessible attractions suitable for tourists
      - Spread across different areas of ${destination}`,
    });

    return object.pois;
  } catch (error) {
    if (error instanceof Error) {
      throw new GeminiError(`Failed to discover POIs: ${error.message}`);
    }
    throw new GeminiError("Failed to discover POIs: Unknown error");
  }
}

/**
 * Generate daily schedule recommendations using Gemini
 * @param destination - Travel destination
 * @param pois - List of points of interest
 * @param numDays - Number of days in trip
 * @returns Recommendation text
 */
export async function generateScheduleRecommendations(
  destination: string,
  pois: POI[],
  numDays: number
): Promise<string> {
  try {
    const poiList = pois
      .map((poi) => `- ${poi.name} (${poi.category}): ${poi.description}`)
      .join("\n");

    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `
        You are a travel itinerary planner. Given these ${numDays} days and points of interest in ${destination}, provide recommendations for how to organize a daily schedule.

        Points of Interest:
        ${poiList}

        Provide practical advice about:
        1. Which days to visit which attractions
        2. Optimal order to minimize travel time
        3. Time allocation for each location
        4. General pacing recommendations

        Be concise and practical.`,
    });

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw new GeminiError(`Failed to generate schedule: ${error.message}`);
    }
    throw new GeminiError("Failed to generate schedule: Unknown error");
  }
}
