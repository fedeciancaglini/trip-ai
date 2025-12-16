/**
 * POST /api/plan-trip
 * Main endpoint that orchestrates the LangGraph agent to generate a complete trip plan
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { executeTripPlanner } from "@/lib/langgraph-agent";
import type { PlanTripRequest, PlanTripResponse } from "@/lib/types";
import { ValidationError, TimeoutError } from "@/lib/types";

const AGENT_TIMEOUT = parseInt(process.env.AGENT_TIMEOUT_MS || "60000");

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
        } as PlanTripResponse,
        { status: 400 },
      );
    }

    // Validate request structure
    const req = body as Record<string, unknown>;
    if (!req.destination || !req.startDate || !req.endDate || !req.budgetUsd) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: destination, startDate, endDate, budgetUsd",
          code: "VALIDATION_ERROR",
        } as PlanTripResponse,
        { status: 400 },
      );
    }

    const planRequest: PlanTripRequest = {
      destination: String(req.destination),
      origin: req.origin ? String(req.origin) : undefined,
      startDate: String(req.startDate),
      endDate: String(req.endDate),
      budgetUsd: Number(req.budgetUsd),
    };

    // Parse dates
    const startDate = new Date(planRequest.startDate);
    const endDate = new Date(planRequest.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)",
          code: "VALIDATION_ERROR",
        } as PlanTripResponse,
        { status: 400 },
      );
    }

    // Execute the agent
    const state = await executeTripPlanner(
      {
        destination: planRequest.destination,
        origin: planRequest.origin,
        startDate,
        endDate,
        budgetUsd: planRequest.budgetUsd,
        daysCount: 1, // Will be calculated
        pointsOfInterest: [],
        dailyItinerary: [],
        routeInformation: {
          totalDistance: "",
          totalDuration: "",
          routes: [],
        },
        routePolylines: [],
        destinationCoordinates: undefined,
        originCoordinates: undefined,
        transportationMode: undefined,
        airbnbRecommendations: [],
      },
      // comment out timeout for now
      // AGENT_TIMEOUT,
    );

    // Check for errors
    if (state.errors && state.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Trip planning encountered errors: ${state.errors.join("; ")}`,
          code: "PLANNING_ERROR",
        } as PlanTripResponse,
        { status: 400 },
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: {
          pointsOfInterest: state.pointsOfInterest,
          dailyItinerary: state.dailyItinerary,
          routeInformation: state.routeInformation,
          airbnbRecommendations: state.airbnbRecommendations,
          routePolylines: state.routePolylines,
        },
      } as PlanTripResponse,
      { status: 200 },
    );
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: "VALIDATION_ERROR",
        } as PlanTripResponse,
        { status: 400 },
      );
    }

    if (error instanceof TimeoutError) {
      return NextResponse.json(
        {
          success: false,
          error: "Trip planning took too long. Please try again.",
          code: "TIMEOUT_ERROR",
          timeout: error.timeout,
        } as PlanTripResponse,
        { status: 504 },
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_ERROR",
        } as PlanTripResponse,
        { status: 401 },
      );
    }

    // Generic server error
    console.error("Trip planning error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during trip planning",
        code: "INTERNAL_ERROR",
      } as PlanTripResponse,
      { status: 500 },
    );
  }
}
