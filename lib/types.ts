/**
 * Trip Planner Application - Type Definitions
 * Core interfaces used throughout the application
 */

// ============================================================================
// API & External Service Types
// ============================================================================

export interface POI {
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
}

export interface RouteSegment {
  startLocation: string;
  endLocation: string;
  distance: string;
  duration: string;
}

export interface DaySchedule {
  day: number;
  date: string;
  pois: DayPOI[];
  totalDuration: string;
}

export interface DayPOI {
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  timeWindow: string;
  duration: number; // minutes
  travelTimeFromPrevious: number; // minutes
}

export interface RouteData {
  totalDistance: string;
  totalDuration: string;
  routes: {
    day: number;
    legs: RouteSegment[];
  }[];
}

export interface AirbnbListing {
  id: string;
  name: string;
  price: string;
  pricePerNight: string;
  link: string;
  location: {
    lat: number;
    lng: number;
  };
  distanceToRoute: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
}

// ============================================================================
// LangGraph Agent Types
// ============================================================================

export interface TripPlannerState {
  // Input
  destination: string;
  startDate: Date;
  endDate: Date;
  budgetUsd: number;
  daysCount: number;

  // Processing
  pointsOfInterest: POI[];
  dailyItinerary: DaySchedule[];
  routeInformation: RouteData;

  // Output
  airbnbRecommendations: AirbnbListing[];

  // Metadata
  errors: string[];
  startTime: Date;
  endTime?: Date;
}

// ============================================================================
// Form & UI Types
// ============================================================================

export interface TripFormInput {
  destination: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  budgetUsd: number;
}

export interface TripFormState {
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  loading: boolean;
  errors: Record<string, string>;
  submitted: boolean;
}

export interface ResultsState {
  loading: boolean;
  error: string | null;
  data: {
    pointsOfInterest: POI[];
    dailyItinerary: DaySchedule[];
    routeInformation: RouteData;
    airbnbRecommendations: AirbnbListing[];
  } | null;
  saveInProgress: boolean;
  saved: boolean;
}

export interface SavedTripsState {
  trips: SavedTrip[];
  loading: boolean;
  error: string | null;
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// Database & Persistence Types
// ============================================================================

export interface SavedTrip {
  id: string;
  userId: string;
  destination: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  budgetUsd: number;
  pointsOfInterest: POI[];
  dailyItinerary: DaySchedule[];
  routeInformation: RouteData;
  airbnbRecommendations: AirbnbListing[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  isFavorite: boolean;
}

export interface SupabaseTrip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_usd: number;
  points_of_interest: POI[];
  daily_itinerary: DaySchedule[];
  route_information: RouteData;
  airbnb_recommendations: AirbnbListing[];
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PlanTripRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
}

export interface PlanTripResponse {
  success: boolean;
  data?: {
    pointsOfInterest: POI[];
    dailyItinerary: DaySchedule[];
    routeInformation: RouteData;
    airbnbRecommendations: AirbnbListing[];
  };
  error?: string;
  code?: string;
  timeout?: number;
}

export interface SaveTripRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  pointsOfInterest: POI[];
  dailyItinerary: DaySchedule[];
  routeInformation: RouteData;
  airbnbRecommendations: AirbnbListing[];
}

export interface SaveTripResponse {
  success: boolean;
  data?: {
    tripId: string;
    createdAt: string;
  };
  error?: string;
  code?: string;
}

export interface SavedTripsListResponse {
  success: boolean;
  data?: {
    trips: SavedTrip[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
  code?: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthUser {
  id: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser;
}

// ============================================================================
// Error Types
// ============================================================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class TimeoutError extends Error {
  timeout: number;

  constructor(message: string, timeout: number) {
    super(message);
    this.name = "TimeoutError";
    this.timeout = timeout;
  }
}

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

export class GoogleMapsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleMapsError";
  }
}

export class AirbnbMCPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AirbnbMCPError";
  }
}
