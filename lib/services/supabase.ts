/**
 * Supabase database service for trips
 * Handles all database operations for the trips table
 */

import { createClient } from "../supabase/server";
import type { SavedTrip, SupabaseTrip, SaveTripRequest } from "../types";

/**
 * Convert Supabase snake_case to camelCase
 */
function convertSupabaseTripToCamelCase(trip: SupabaseTrip): SavedTrip {
  return {
    id: trip.id,
    userId: trip.user_id,
    destination: trip.destination,
    origin: trip.origin,
    startDate: trip.start_date,
    endDate: trip.end_date,
    budgetUsd: trip.budget_usd,
    pointsOfInterest: trip.points_of_interest,
    dailyItinerary: trip.daily_itinerary,
    routeInformation: trip.route_information,
    airbnbRecommendations: trip.airbnb_recommendations,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
    isFavorite: trip.is_favorite,
  };
}

/**
 * Convert camelCase to Supabase snake_case
 */
function convertTripToSupabaseCase(
  userId: string,
  trip: SaveTripRequest,
): Omit<SupabaseTrip, "created_at" | "updated_at" | "id"> {
  return {
    user_id: userId,
    destination: trip.destination,
    origin: trip.origin,
    start_date: trip.startDate,
    end_date: trip.endDate,
    budget_usd: trip.budgetUsd,
    points_of_interest: trip.pointsOfInterest,
    daily_itinerary: trip.dailyItinerary,
    route_information: trip.routeInformation,
    airbnb_recommendations: trip.airbnbRecommendations,
    is_favorite: false,
  };
}

/**
 * Save a new trip to the database
 * @param userId - Current user ID
 * @param trip - Trip data to save
 * @returns Saved trip with ID and timestamps
 */
export async function saveTrip(
  userId: string,
  trip: SaveTripRequest,
): Promise<SavedTrip> {
  const client = await createClient();

  const tripData = convertTripToSupabaseCase(userId, trip);

  const { data, error } = await client
    .from("trips")
    .insert([tripData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save trip: ${error.message}`);
  }

  return convertSupabaseTripToCamelCase(data as SupabaseTrip);
}

/**
 * Get all trips for a user with pagination
 * @param userId - Current user ID
 * @param options - Pagination and sorting options
 */
export async function getUserTrips(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: "created_at" | "is_favorite";
  } = {},
): Promise<{
  trips: SavedTrip[];
  total: number;
}> {
  const client = await createClient();
  const limit = Math.min(options.limit || 50, 100); // Max 100
  const offset = options.offset || 0;
  const sortBy = options.sortBy || "created_at";

  // Get count
  const { count, error: countError } = await client
    .from("trips")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw new Error(`Failed to fetch trip count: ${countError.message}`);
  }

  // Get paginated trips
  let query = client
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .order(sortBy, { ascending: sortBy === "is_favorite" ? false : true })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`);
  }

  const trips = (data as SupabaseTrip[]).map((trip) =>
    convertSupabaseTripToCamelCase(trip),
  );

  return {
    trips,
    total: count || 0,
  };
}

/**
 * Get a single trip by ID
 * @param userId - Current user ID (for authorization check)
 * @param tripId - Trip ID to fetch
 */
export async function getTripById(
  userId: string,
  tripId: string,
): Promise<SavedTrip | null> {
  const client = await createClient();

  const { data, error } = await client
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch trip: ${error.message}`);
  }

  return convertSupabaseTripToCamelCase(data as SupabaseTrip);
}

/**
 * Toggle favorite status of a trip
 * @param userId - Current user ID (for authorization)
 * @param tripId - Trip ID
 * @param isFavorite - New favorite status
 */
export async function updateTripFavorite(
  userId: string,
  tripId: string,
  isFavorite: boolean,
): Promise<SavedTrip> {
  const client = await createClient();

  const { data, error } = await client
    .from("trips")
    .update({ is_favorite: isFavorite })
    .eq("id", tripId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update trip: ${error.message}`);
  }

  return convertSupabaseTripToCamelCase(data as SupabaseTrip);
}

/**
 * Delete a trip
 * @param userId - Current user ID (for authorization)
 * @param tripId - Trip ID to delete
 */
export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  const client = await createClient();

  const { error } = await client
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`);
  }
}
