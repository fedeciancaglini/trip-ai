/**
 * Gemini API Service
 * Wrapper for Google's Generative AI API for POI discovery
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { POI } from "../types";
import { GeminiError } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  endDate: Date,
): Promise<POI[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const tripLength = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const prompt = `You are a travel expert. Suggest 10-12 interesting points of interest for a ${tripLength}-day trip to ${destination}. 

Return ONLY valid JSON in this format, no markdown code blocks:
{
  "pois": [
    {
      "name": "POI Name",
      "description": "2-3 sentence description of why it's worth visiting",
      "category": "museum|landmark|park|restaurant|market|historical|natural|entertainment",
      "lat": 48.8584,
      "lng": 2.2945
    }
  ]
}

Requirements:
- Include a mix of categories
- Provide accurate latitude/longitude coordinates
- Descriptions should be engaging and specific
- Focus on popular, accessible attractions suitable for tourists
- Spread across different areas of ${destination}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let jsonString = responseText;
    
    // Remove markdown code block markers if present
    if (jsonString.includes("```json")) {
      jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonString.includes("```")) {
      jsonString = jsonString.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonString.trim());

    if (!Array.isArray(parsed.pois)) {
      throw new Error("Invalid response format: missing pois array");
    }

    // Validate POI structure
    const pois: POI[] = parsed.pois.map((poi: unknown) => {
      const p = poi as Record<string, unknown>;
      return {
        name: String(p.name),
        description: String(p.description),
        lat: Number(p.lat),
        lng: Number(p.lng),
        category: String(p.category),
      };
    });

    return pois;
  } catch (error) {
    if (error instanceof Error) {
      throw new GeminiError(
        `Failed to discover POIs: ${error.message}`,
      );
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
  numDays: number,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const poiList = pois
      .map((poi) => `- ${poi.name} (${poi.category}): ${poi.description}`)
      .join("\n");

    const prompt = `You are a travel itinerary planner. Given these ${numDays} days and points of interest in ${destination}, provide recommendations for how to organize a daily schedule.

Points of Interest:
${poiList}

Provide practical advice about:
1. Which days to visit which attractions
2. Optimal order to minimize travel time
3. Time allocation for each location
4. General pacing recommendations

Be concise and practical.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new GeminiError(`Failed to generate schedule: ${error.message}`);
    }
    throw new GeminiError("Failed to generate schedule: Unknown error");
  }
}
