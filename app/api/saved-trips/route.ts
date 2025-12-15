/**
 * GET /api/saved-trips
 * Retrieves all trips saved by the authenticated user with pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserTrips } from "@/lib/services/supabase";
import type { SavedTripsListResponse } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const user = await requireAuth();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50"), 1),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const sortBy = (searchParams.get("sortBy") || "created_at") as
      | "created_at"
      | "is_favorite";

    // Validate sortBy parameter
    if (!["created_at", "is_favorite"].includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: 'sortBy must be "created_at" or "is_favorite"',
          code: "VALIDATION_ERROR",
        } as SavedTripsListResponse,
        { status: 400 },
      );
    }

    // Fetch trips
    const { trips, total } = await getUserTrips(user.id, {
      limit,
      offset,
      sortBy,
    });

    const hasMore = offset + limit < total;

    return NextResponse.json(
      {
        success: true,
        data: {
          trips,
          total,
          hasMore,
        },
      } as SavedTripsListResponse,
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
        } as SavedTripsListResponse,
        { status: 401 },
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch trips. Please try again later.",
          code: "DATABASE_ERROR",
        } as SavedTripsListResponse,
        { status: 500 },
      );
    }

    // Generic server error
    console.error("Fetch trips error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while fetching trips",
        code: "INTERNAL_ERROR",
      } as SavedTripsListResponse,
      { status: 500 },
    );
  }
}
