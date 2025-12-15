/**
 * POST /api/save-trip
 * Saves a generated trip plan to Supabase for later retrieval
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveTrip } from "@/lib/services/supabase";
import type { SaveTripRequest, SaveTripResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const user = await requireAuth();

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          code: "INVALID_REQUEST",
        } as SaveTripResponse,
        { status: 400 },
      );
    }

    // Validate request structure
    const req = body as Record<string, unknown>;
    const requiredFields = [
      "destination",
      "startDate",
      "endDate",
      "budgetUsd",
      "pointsOfInterest",
      "dailyItinerary",
      "routeInformation",
      "airbnbRecommendations",
    ];

    const missing = requiredFields.filter((field) => !(field in req));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
          code: "VALIDATION_ERROR",
        } as SaveTripResponse,
        { status: 400 },
      );
    }

    const saveTripRequest: SaveTripRequest = {
      destination: String(req.destination),
      startDate: String(req.startDate),
      endDate: String(req.endDate),
      budgetUsd: Number(req.budgetUsd),
      pointsOfInterest: req.pointsOfInterest as never,
      dailyItinerary: req.dailyItinerary as never,
      routeInformation: req.routeInformation as never,
      airbnbRecommendations: req.airbnbRecommendations as never,
    };

    // Save to database
    const savedTrip = await saveTrip(user.id, saveTripRequest);

    return NextResponse.json(
      {
        success: true,
        data: {
          tripId: savedTrip.id,
          createdAt: savedTrip.createdAt,
        },
      } as SaveTripResponse,
      { status: 200 },
    );
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_ERROR",
        } as SaveTripResponse,
        { status: 401 },
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes("Failed to save trip")) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save trip. Please try again later.",
          code: "DATABASE_ERROR",
        } as SaveTripResponse,
        { status: 500 },
      );
    }

    // Generic server error
    console.error("Save trip error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while saving the trip",
        code: "INTERNAL_ERROR",
      } as SaveTripResponse,
      { status: 500 },
    );
  }
}
