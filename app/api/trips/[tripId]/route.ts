/**
 * DELETE /api/trips/[tripId]
 * Deletes a trip
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteTrip } from "@/lib/services/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } },
): Promise<NextResponse> {
  try {
    // Check authentication
    const user = await requireAuth();

    const tripId = params.tripId;

    if (!tripId) {
      return NextResponse.json(
        {
          success: false,
          error: "Trip ID is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Delete trip
    await deleteTrip(user.id, tripId);

    return NextResponse.json(
      {
        success: true,
      },
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
        },
        { status: 401 },
      );
    }

    // Generic server error
    console.error("Delete trip error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while deleting the trip",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
