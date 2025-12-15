# Trip Planner Application - Implementation Plan

**Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Planning Phase

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Routes Structure](#api-routes-structure)
4. [Component Hierarchy](#component-hierarchy)
5. [Integration Points](#integration-points)
6. [State Management](#state-management)
7. [File Structure](#file-structure)
8. [Implementation Phases](#implementation-phases)
9. [Environment Variables](#environment-variables)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js App Router)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Pages  │  │  Trip Form   │  │  Results & Map       │  │
│  │  (Protected) │  │  (Protected) │  │  (Protected)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Saved Trips Viewer (Protected)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │                                        │
           │ HTTP Requests                          │ Auth Sessions
           ▼                                        │ (Cookies)
┌─────────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (/api)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/plan-trip                                    │   │
│  │  - Validates user input                               │   │
│  │  - Invokes LangGraph agent                           │   │
│  │  - Returns generated itinerary                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/save-trip                                   │   │
│  │  - Stores trip to Supabase                           │   │
│  │  - Returns saved trip ID                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/saved-trips                                  │   │
│  │  - Retrieves user's saved trips                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │
           │ Orchestrates agent workflow
           ▼
┌─────────────────────────────────────────────────────────────────┐
│              LangGraph Agent (lib/langgraph-agent.ts)           │
│                                                                   │
│  ┌──────────────────┐                                           │
│  │ Input Processing │                                           │
│  │  - Validate      │                                           │
│  │  - Parse dates   │                                           │
│  │  - Convert units │                                           │
│  └──────────────────┘                                           │
│         │                                                         │
│         ▼                                                         │
│  ┌──────────────────────────────────────────┐                  │
│  │ Interest Points Discovery (Gemini)       │                  │
│  │  - Identify attractions                  │                  │
│  │  - Get descriptions                      │                  │
│  │  - Gather location data                  │                  │
│  └──────────────────────────────────────────┘                  │
│         │                                                         │
│         ▼                                                         │
│  ┌──────────────────────────────────────────┐                  │
│  │ Route Planning (Google Maps API)         │                  │
│  │  - Calculate routes between POIs         │                  │
│  │  - Get travel times/distances            │                  │
│  │  - Organize by day                       │                  │
│  └──────────────────────────────────────────┘                  │
│         │                                                         │
│         ▼                                                         │
│  ┌──────────────────────────────────────────┐                  │
│  │ Accommodation Search (Airbnb MCP)        │                  │
│  │  - Search by date range                  │                  │
│  │  - Filter by budget                      │                  │
│  │  - Filter by proximity to route          │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
           │
           ├─────────────────────┬────────────────┬──────────────┐
           ▼                     ▼                ▼              ▼
    ┌────────────┐       ┌────────────┐  ┌────────────┐  ┌──────────┐
    │  Gemini    │       │   Google   │  │   Airbnb   │  │ Supabase │
    │  API       │       │   Maps API │  │   MCP      │  │  (DB)    │
    │ (gpt-3.5)  │       │            │  │            │  │          │
    └────────────┘       └────────────┘  └────────────┘  └──────────┘
```

### LangGraph Agent Structure

**Graph Configuration:**
- **State Type:** Custom TypeScript interface containing user inputs, discovered POIs, routes, and accommodations
- **Execution Mode:** Sequential (no branching)
- **State Persistence:** Ephemeral (no persistence, single execution)
- **Compile Mode:** Graph is compiled once and reused for multiple invocations

**Nodes:**

1. **Input Validation Node**
   - Input: Raw form data
   - Processing: Validate destination, dates (future only), budget (positive number)
   - Output: Normalized state object
   - Error handling: Throw ValidationError if invalid

2. **Interest Points Discovery Node**
   - Input: Destination, trip dates
   - Processing: Call Gemini to generate 8-12 POIs for the destination
   - Output: Array of POI objects with name, description, coordinates, category
   - LLM Config: Temperature 0.7 (creative but consistent)

3. **Route Planning Node**
   - Input: POIs, trip dates (calculate days)
   - Processing: Use Google Maps Routes API to plan daily routes
   - Output: Day-by-day itinerary with travel times and distances
   - Algorithm: Nearest neighbor for daily optimization

4. **Accommodation Search Node**
   - Input: Route (central location), date range, budget
   - Processing: Query Airbnb MCP server with filters
   - Output: Top 5-10 Airbnb listings matching criteria
   - Filtering: Price per night ≤ (budget / number of nights)

**Edges:**
- START → Input Validation
- Input Validation → Interest Points Discovery
- Interest Points Discovery → Route Planning
- Route Planning → Accommodation Search
- Accommodation Search → END

---

## Database Schema

### Supabase Tables

#### `trips` Table

Primary table for storing complete trip plans.

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trip Basic Info
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_usd DECIMAL(10, 2) NOT NULL,
  
  -- Generated Content (stored as JSON)
  points_of_interest JSONB NOT NULL, -- Array of POI objects
  daily_itinerary JSONB NOT NULL,    -- Day-by-day breakdown
  route_information JSONB NOT NULL,  -- Route with distances/times
  airbnb_recommendations JSONB NOT NULL, -- Array of listings
  
  -- Metadata
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at DESC),
  UNIQUE INDEX idx_user_destination_dates (user_id, destination, start_date, end_date)
);
```

**Column Descriptions:**

- `id`: UUID primary key for unique identification
- `user_id`: Foreign key to auth.users, ensures data isolation
- `destination`: Trip destination (required)
- `start_date`, `end_date`: Defines trip duration
- `budget_usd`: Accommodation budget only (numeric for sorting/filtering)
- `points_of_interest`: JSON array storing discovered POI objects with structure:
  ```json
  [
    {
      "name": "Eiffel Tower",
      "description": "Iconic iron lattice tower",
      "lat": 48.8584,
      "lng": 2.2945,
      "category": "monument"
    }
  ]
  ```
- `daily_itinerary`: JSON object with day-by-day schedule:
  ```json
  {
    "day1": {
      "date": "2025-06-15",
      "pois": [
        {
          "name": "Eiffel Tower",
          "timeWindow": "09:00-11:00",
          "duration": 120,
          "travelTimeFromPrevious": 15
        }
      ]
    }
  }
  ```
- `route_information`: JSON object storing Google Maps route data:
  ```json
  {
    "totalDistance": "45.2 km",
    "totalDuration": "5 hours 30 minutes",
    "routes": [
      {
        "day": 1,
        "legs": [
          {
            "startLocation": "Eiffel Tower",
            "endLocation": "Louvre Museum",
            "distance": "2.1 km",
            "duration": "25 minutes"
          }
        ]
      }
    ]
  }
  ```
- `airbnb_recommendations`: JSON array of listing objects:
  ```json
  [
    {
      "id": "12345678",
      "name": "Charming Studio in Marais",
      "price": "89.00",
      "pricePerNight": "89.00",
      "link": "https://www.airbnb.com/rooms/12345678",
      "location": {
        "lat": 48.8566,
        "lng": 2.3522
      },
      "distanceToRoute": "0.5 km"
    }
  ]
  ```
- `created_at`: Timestamp when trip was created (auto)
- `updated_at`: Timestamp of last update (auto)
- `is_favorite`: Boolean for user to mark favorite trips

**Row-Level Security (RLS):**
```sql
-- Users can only view their own trips
CREATE POLICY "Users can view own trips"
  ON trips
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert trips for themselves
CREATE POLICY "Users can create own trips"
  ON trips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trips are read-only after creation (no updates)
CREATE POLICY "Trips cannot be modified"
  ON trips
  FOR UPDATE
  USING (false);

-- Users can delete own trips
CREATE POLICY "Users can delete own trips"
  ON trips
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## API Routes Structure

### POST /api/plan-trip

**Purpose:** Main endpoint that orchestrates the LangGraph agent to generate a complete trip plan.

**Authentication:** Required (via session cookies)

**Request Body:**
```typescript
{
  destination: string;        // e.g., "Paris, France"
  startDate: string;          // ISO 8601: "2025-06-15"
  endDate: string;            // ISO 8601: "2025-06-22"
  budgetUsd: number;          // Positive integer, e.g., 1000
}
```

**Response (Success 200):**
```typescript
{
  success: true;
  data: {
    pointsOfInterest: POI[];
    dailyItinerary: DailyItinerary[];
    routeInformation: RouteData;
    airbnbRecommendations: AirbnbListing[];
  };
}
```

**Response (Validation Error 400):**
```typescript
{
  success: false;
  error: "Invalid destination: must not be empty";
  code: "VALIDATION_ERROR";
}
```

**Response (LLM Timeout 504):**
```typescript
{
  success: false;
  error: "Trip planning took too long. Please try again.";
  code: "TIMEOUT_ERROR";
  timeout: 60000;
}
```

**Error Codes:**
- `VALIDATION_ERROR`: Input validation failed
- `MISSING_ENV`: Missing API keys
- `TIMEOUT_ERROR`: Agent execution exceeded timeout (60 seconds)
- `GEMINI_ERROR`: Gemini API call failed
- `GOOGLE_MAPS_ERROR`: Google Maps API call failed
- `AIRBNB_ERROR`: Airbnb MCP server error
- `INTERNAL_ERROR`: Unexpected server error

### POST /api/save-trip

**Purpose:** Saves a generated trip plan to Supabase for later retrieval.

**Authentication:** Required

**Request Body:**
```typescript
{
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  pointsOfInterest: POI[];
  dailyItinerary: DailyItinerary[];
  routeInformation: RouteData;
  airbnbRecommendations: AirbnbListing[];
}
```

**Response (Success 200):**
```typescript
{
  success: true;
  data: {
    tripId: string;  // UUID of saved trip
    createdAt: string; // ISO 8601 timestamp
  };
}
```

**Response (Database Error 500):**
```typescript
{
  success: false;
  error: "Failed to save trip. Please try again later.";
  code: "DATABASE_ERROR";
}
```

### GET /api/saved-trips

**Purpose:** Retrieves all trips saved by the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Default 50, max 100
- `offset` (optional): Default 0
- `sortBy` (optional): "created_at" (default) or "is_favorite"

**Response (Success 200):**
```typescript
{
  success: true;
  data: {
    trips: SavedTrip[];
    total: number;
    hasMore: boolean;
  };
}
```

**SavedTrip Object:**
```typescript
{
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  createdAt: string;
  isFavorite: boolean;
  // Full data available on demand:
  pointsOfInterest?: POI[];
  dailyItinerary?: DailyItinerary[];
  // ... etc
}
```

---

## Component Hierarchy

### Page Structure (App Router)

```
app/
├── layout.tsx                 # Root layout with auth provider
├── page.tsx                   # Home page (public)
├── login/
│   └── page.tsx              # Login page
├── (protected)/              # Route group for protected routes
│   ├── layout.tsx            # Protected layout with nav
│   ├── plan/
│   │   └── page.tsx          # Trip planner form page
│   ├── results/
│   │   └── [tripId]/page.tsx # Results display page
│   └── saved-trips/
│       └── page.tsx          # Saved trips list page
└── api/
    ├── plan-trip/route.ts
    ├── save-trip/route.ts
    └── saved-trips/route.ts
```

### Component Tree

```
App (root layout)
├── Header
│   ├── Logo
│   ├── Nav
│   └── UserMenu
│
├── (Protected Route Group)
│   ├── ProtectedLayout
│   │   ├── Header (with logout)
│   │   ├── MainContent
│   │   └── Footer
│   │
│   ├── /plan Page
│   │   └── TripPlannerForm
│   │       ├── DestinationInput
│   │       ├── DateRangeSelector
│   │       ├── BudgetInput
│   │       ├── ValidationSummary
│   │       └── SubmitButton
│   │
│   ├── /results Page
│   │   ├── ResultsContainer
│   │   │   ├── LoadingState
│   │   │   │   └── ResultSkeleton
│   │   │   ├── ItinerarySection
│   │   │   │   ├── DayCard (repeating)
│   │   │   │   │   ├── TimelineItem (repeating)
│   │   │   │   │   │   ├── POIName
│   │   │   │   │   │   ├── Description
│   │   │   │   │   │   └── Duration
│   │   │   │   │   └── TravelInfo
│   │   │   │   └── TotalStats
│   │   │   │
│   │   │   ├── MapSection
│   │   │   │   ├── GoogleMapEmbed
│   │   │   │   ├── RoutePolyline
│   │   │   │   ├── POIMarkers
│   │   │   │   └── MapLegend
│   │   │   │
│   │   │   ├── AccommodationSection
│   │   │   │   ├── AccommodationCard (repeating)
│   │   │   │   │   ├── Image
│   │   │   │   │   ├── Title
│   │   │   │   │   ├── Price
│   │   │   │   │   ├── Location
│   │   │   │   │   └── Link
│   │   │   │   └── BudgetIndicator
│   │   │   │
│   │   │   └── ActionButtons
│   │   │       ├── SaveTripButton
│   │   │       ├── ShareButton
│   │   │       └── BackButton
│   │
│   └── /saved-trips Page
│       ├── TripsListContainer
│       │   ├── TripsGrid
│       │   │   ├── TripCard (repeating)
│       │   │   │   ├── Destination
│       │   │   │   ├── DateRange
│       │   │   │   ├── Budget
│       │   │   │   ├── CreatedDate
│       │   │   │   ├── FavoriteToggle
│       │   │   │   └── ViewDetailsLink
│       │   │   └── EmptyState
│       │   └── Pagination
```

### Key Components

#### TripPlannerForm
- Manages form state with React hooks
- Validates input in real-time
- Submits to `/api/plan-trip`
- Handles loading state and errors
- Redirects to results on success

#### ResultsContainer
- Receives trip data as props/URL params
- Displays loading skeleton while fetching
- Three main sections side-by-side (desktop) or stacked (mobile)
- Handles error states for individual sections

#### InteractiveMap
- Renders Google Maps embedded view
- Displays POI markers with custom icons
- Shows route polylines connecting POIs
- Legend identifying different marker types
- Responsive sizing

#### SaveTripButton
- Server Action that calls `/api/save-trip`
- Shows success/error toast
- Disables after successful save
- Passes full trip data to backend

---

## Integration Points

### 1. Gemini API Integration

**Library:** `@google/genai` (latest Node.js SDK)

**Configuration:**
```typescript
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = ai.models.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: "You are a knowledgeable travel guide...",
});
```

**Usage in Interest Points Discovery Node:**
```typescript
const response = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [
        {
          text: `List 8-12 must-see attractions in ${destination}...`,
        },
      ],
    },
  ],
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
  },
});

// Parse structured output using Zod schema
const poisSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    category: z.enum(["monument", "museum", "nature", "food", "culture"]),
  })
);

const pois = poisSchema.parse(JSON.parse(response.text()));
```

**Error Handling:**
- Catch API quota errors (429) and retry with exponential backoff
- Catch malformed responses and re-prompt with clearer instructions
- 60-second timeout for all Gemini calls

### 2. Google Maps API Integration

**Library:** `@googlemaps/google-maps-services-js` (Node.js client)

**Configuration:**
```typescript
const mapsClient = new Client();

interface RouteRequest {
  params: {
    key: process.env.GOOGLE_MAPS_API_KEY,
    origin: string,
    destination: string,
    waypoints?: string[],
    travelMode: "DRIVING" | "WALKING",
  };
}
```

**Usage in Route Planning Node:**
```typescript
// Calculate optimal daily routes using Nearest Neighbor algorithm
for (let day = 0; day < numDays; day++) {
  const dayPOIs = assignPOIsToDay(pois, day, numDays);
  
  for (let i = 0; i < dayPOIs.length - 1; i++) {
    const response = await mapsClient.directions({
      params: {
        origin: `${dayPOIs[i].latitude},${dayPOIs[i].longitude}`,
        destination: `${dayPOIs[i + 1].latitude},${dayPOIs[i + 1].longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    
    itinerary[day].legs.push({
      startLocation: dayPOIs[i].name,
      endLocation: dayPOIs[i + 1].name,
      distance: response.data.routes[0].legs[0].distance.text,
      duration: response.data.routes[0].legs[0].duration.text,
    });
  }
}
```

**Error Handling:**
- Handle rate limits with exponential backoff
- Validate coordinates before calling API
- Return null routes if API fails (don't block accommodation search)

### 3. Airbnb MCP Server Integration

**Expected MCP Server Configuration:**
```
Host: localhost:8000 (development) or provided cloud endpoint
Protocol: Model Context Protocol (stdio or HTTP)
Tools Available:
  - search_airbnb_listings
  - get_listing_details
```

**Usage in Accommodation Search Node:**
```typescript
// Initialize MCP client
const mcpClient = await MCPClient.initialize({
  endpoint: process.env.AIRBNB_MCP_ENDPOINT,
  auth: process.env.AIRBNB_MCP_AUTH,
});

// Search with filters
const listings = await mcpClient.call("search_airbnb_listings", {
  destination: destination,
  checkInDate: startDate,
  checkOutDate: endDate,
  minPrice: 0,
  maxPrice: budgetPerNight,
  limit: 10,
});

// Filter by proximity to route center
const routeCenter = calculateCentroid(pois);
const filtered = listings.filter(
  (listing) =>
    distance(listing.location, routeCenter) < 5 // within 5km
);
```

**Error Handling:**
- If MCP server is unavailable, return empty array with warning log
- Catch timeout errors and return partial results
- Validate all listing URLs before including in response

### 4. Supabase Integration

**Library:** `@supabase/supabase-js` (JavaScript client)

**Configuration:**
```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role in API routes
);
```

**Usage in /api/save-trip:**
```typescript
const { data, error } = await supabase.from("trips").insert([
  {
    user_id: userId,
    destination,
    start_date: startDate,
    end_date: endDate,
    budget_usd: budgetUsd,
    points_of_interest: pointsOfInterest,
    daily_itinerary: dailyItinerary,
    route_information: routeInformation,
    airbnb_recommendations: airbnbRecommendations,
  },
]);

if (error) throw new Error(`Save failed: ${error.message}`);
return { success: true, tripId: data[0].id };
```

**Error Handling:**
- Handle unique constraint violations (duplicate trip) with 409 response
- Return 500 for database connection errors
- Implement retry logic for transient failures

---

## State Management

### Client-Side State (React)

**TripPlannerForm State:**
```typescript
interface FormState {
  destination: string;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  budgetUsd: number;
  loading: boolean;
  errors: Record<string, string>;
  submitted: boolean;
}
```

**ResultsContainer State:**
```typescript
interface ResultsState {
  loading: boolean;
  error: string | null;
  data: {
    pointsOfInterest: POI[];
    dailyItinerary: DailyItinerary[];
    routeInformation: RouteData;
    airbnbRecommendations: AirbnbListing[];
  } | null;
  saveInProgress: boolean;
  saved: boolean;
}
```

**Saved Trips State:**
```typescript
interface SavedTripsState {
  trips: SavedTrip[];
  loading: boolean;
  error: string | null;
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}
```

### LangGraph Agent State

**Fully Typed TypeScript Interface:**
```typescript
interface TripPlannerState {
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

// State flows through nodes:
// START → input validation → discovery → routing → accommodation → END
```

### Data Flow

```
User Input (Form)
    ↓
POST /api/plan-trip
    ↓
[Server] Validate input
    ↓
[LangGraph] Initialize state
    ↓
[Node 1] Input Processing
    ├─ Parse dates → state.startDate, state.endDate
    ├─ Validate budget → state.budgetUsd
    └─ Calculate days → state.daysCount
    ↓
[Node 2] Interest Points Discovery
    ├─ Call Gemini with destination
    └─ Populate state.pointsOfInterest
    ↓
[Node 3] Route Planning
    ├─ Call Google Maps for each day
    └─ Populate state.dailyItinerary, state.routeInformation
    ↓
[Node 4] Accommodation Search
    ├─ Call Airbnb MCP with date range and budget
    └─ Populate state.airbnbRecommendations
    ↓
[Server] Extract state → response
    ↓
Frontend: Display in three sections (itinerary, map, accommodations)
    ↓
User clicks "Save Trip"
    ↓
POST /api/save-trip (with all trip data)
    ↓
Supabase: Insert into trips table
    ↓
Success response → redirect to saved trips
```

---

## File Structure

### Expected Project Layout

```
trip-ai/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── (protected)/
│   │   ├── layout.tsx                # Protected layout with nav
│   │   ├── plan/
│   │   │   └── page.tsx              # Trip planner page
│   │   ├── results/
│   │   │   └── [tripId]/
│   │   │       └── page.tsx          # Results page
│   │   └── saved-trips/
│   │       └── page.tsx              # Saved trips page
│   └── api/
│       ├── plan-trip/
│       │   └── route.ts              # POST /api/plan-trip
│       ├── save-trip/
│       │   └── route.ts              # POST /api/save-trip
│       └── saved-trips/
│           └── route.ts              # GET /api/saved-trips
│
├── components/
│   ├── forms/
│   │   └── TripPlannerForm.tsx
│   ├── results/
│   │   ├── ResultsContainer.tsx
│   │   ├── ItinerarySection.tsx
│   │   ├── DayCard.tsx
│   │   ├── TimelineItem.tsx
│   │   ├── InteractiveMap.tsx
│   │   ├── AccommodationSection.tsx
│   │   └── AccommodationCard.tsx
│   ├── saved-trips/
│   │   ├── TripsListContainer.tsx
│   │   ├── TripCard.tsx
│   │   └── EmptyState.tsx
│   ├── shared/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── UserMenu.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── Toast.tsx
│   └── ui/
│       ├── Button.tsx (from shadcn)
│       ├── Input.tsx (from shadcn)
│       ├── Card.tsx (from shadcn)
│       ├── Select.tsx (from shadcn)
│       ├── Tabs.tsx (from shadcn)
│       └── ...other shadcn components
│
├── lib/
│   ├── langgraph-agent.ts            # Main agent definition
│   ├── nodes/
│   │   ├── input-validation.ts
│   │   ├── interest-points.ts
│   │   ├── route-planning.ts
│   │   └── accommodation.ts
│   ├── services/
│   │   ├── gemini.ts                 # Gemini API wrapper
│   │   ├── google-maps.ts            # Google Maps API wrapper
│   │   ├── airbnb-mcp.ts             # Airbnb MCP client
│   │   └── supabase.ts               # Supabase client
│   ├── auth.ts                       # Auth utilities
│   ├── types.ts                      # TypeScript interfaces
│   └── utils.ts                      # Helper functions
│
├── styles/
│   ├── globals.css
│   └── variables.css
│
├── .env.local                        # Local env vars (not committed)
├── .env.example                      # Template for env vars
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── IMPLEMENTATION_PLAN.md            # This file
```

### Key Files Created Per Phase

**Phase 1 (Setup):**
- `lib/types.ts` - All TypeScript interfaces
- `lib/auth.ts` - Auth utilities
- `IMPLEMENTATION_PLAN.md` - This document

**Phase 2 (Database):**
- Schema migration files in Supabase
- `lib/services/supabase.ts`

**Phase 3 (Agent):**
- `lib/langgraph-agent.ts`
- `lib/nodes/*.ts`
- `lib/services/gemini.ts`
- `lib/services/google-maps.ts`
- `lib/services/airbnb-mcp.ts`

**Phase 4 (API):**
- `app/api/plan-trip/route.ts`
- `app/api/save-trip/route.ts`
- `app/api/saved-trips/route.ts`

**Phase 5 (Frontend):**
- All component files
- All page files

---

## Implementation Phases

### Phase 1: Foundation & Planning
**Duration:** 1-2 days  
**Outcomes:** Project structure, types, environment setup

1. Create project structure and install dependencies
2. Define all TypeScript types in `lib/types.ts`
3. Set up environment variables and validation
4. Configure Tailwind CSS and shadcn/ui
5. Create basic layout components
6. Create .env.example with all required variables

**Deliverables:**
- ✅ Structured project
- ✅ TypeScript interfaces
- ✅ Environmental configuration
- ✅ IMPLEMENTATION_PLAN.md

### Phase 2: Database & Auth
**Duration:** 1 day  
**Outcomes:** Database schema, auth integration

1. Create `trips` table in Supabase with RLS policies
2. Create `lib/services/supabase.ts` client
3. Create `lib/auth.ts` utilities (check auth, get user)
4. Implement protected routes middleware
5. Create login page (if not already present)
6. Test authentication flow

**Deliverables:**
- ✅ Supabase tables with RLS
- ✅ Auth service layer
- ✅ Protected route middleware

### Phase 3: LangGraph Agent
**Duration:** 2-3 days  
**Outcomes:** Fully functional agent

1. Create `lib/services/gemini.ts` - Gemini API wrapper with error handling
2. Create `lib/services/google-maps.ts` - Maps client with caching
3. Create `lib/services/airbnb-mcp.ts` - MCP client wrapper
4. Create `lib/nodes/input-validation.ts` - Input validation node
5. Create `lib/nodes/interest-points.ts` - Gemini discovery node
6. Create `lib/nodes/route-planning.ts` - Google Maps routing node
7. Create `lib/nodes/accommodation.ts` - Airbnb search node
8. Create `lib/langgraph-agent.ts` - Graph definition and compilation
9. Unit tests for each node
10. Integration test for full agent

**Deliverables:**
- ✅ Agent implementation
- ✅ Node implementations
- ✅ Service wrappers
- ✅ Error handling
- ✅ Passing tests

### Phase 4: API Routes
**Duration:** 1-2 days  
**Outcomes:** All API endpoints functional

1. Create `app/api/plan-trip/route.ts`
   - Input validation
   - Agent invocation
   - Response formatting
   - Error handling
2. Create `app/api/save-trip/route.ts`
   - Supabase insert
   - Duplicate handling
   - Success/error responses
3. Create `app/api/saved-trips/route.ts`
   - Query building with filters
   - Pagination
   - Authorization check
4. Integration tests for all endpoints
5. Load test for agent timeout scenarios

**Deliverables:**
- ✅ Three API routes
- ✅ Error handling
- ✅ Request/response types
- ✅ Tests

### Phase 5: Frontend Components
**Duration:** 2-3 days  
**Outcomes:** Full UI implementation

1. Create `components/forms/TripPlannerForm.tsx`
   - Form state management
   - Real-time validation
   - Error display
   - Loading state
2. Create results components:
   - `ResultsContainer.tsx` - Main container
   - `ItinerarySection.tsx` - Day-by-day schedule
   - `DayCard.tsx` - Individual day card
   - `TimelineItem.tsx` - Single POI in timeline
   - `InteractiveMap.tsx` - Google Maps embed
   - `AccommodationSection.tsx` - Listings section
   - `AccommodationCard.tsx` - Individual listing
3. Create saved trips components:
   - `TripsListContainer.tsx`
   - `TripCard.tsx`
   - `EmptyState.tsx`
4. Create shared components:
   - `Header.tsx`
   - `Navigation.tsx`
   - `UserMenu.tsx`
   - `LoadingSkeleton.tsx`
   - `Toast.tsx` (for notifications)
5. Create pages:
   - `/plan` - Trip planner page
   - `/results/[tripId]` - Results page
   - `/saved-trips` - Saved trips page
   - Update `(protected)/layout.tsx`

**Deliverables:**
- ✅ All components
- ✅ All pages
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

### Phase 6: Integration & Polish
**Duration:** 1-2 days  
**Outcomes:** Fully integrated, production-ready app

1. End-to-end testing:
   - Create account → Login → Plan trip → View results → Save trip → View saved trips
   - Test on mobile and desktop
2. Error scenario testing:
   - Missing env vars
   - API timeouts
   - Database errors
   - Invalid inputs
3. Performance optimization:
   - Memoize components
   - Lazy load maps
   - Optimize images
4. Security audit:
   - Check RLS policies
   - Validate all inputs
   - Check for XSS vulnerabilities
5. Documentation:
   - Update README with setup instructions
   - Document environment variables
   - Create troubleshooting guide

**Deliverables:**
- ✅ Fully integrated app
- ✅ All tests passing
- ✅ Documentation
- ✅ Production-ready

---

## Environment Variables

### Required Variables

#### Google & Gemini APIs
```bash
# Gemini API (required)
GEMINI_API_KEY=sk_xxxxxxxxxxxxx

# Google Maps API (required)
GOOGLE_MAPS_API_KEY=AIzaSyDxxxxxxxxxxx
```

#### Airbnb MCP Server
```bash
# Airbnb MCP endpoint (required)
AIRBNB_MCP_ENDPOINT=http://localhost:8000
# or for cloud deployment:
AIRBNB_MCP_ENDPOINT=https://api.airbnb-mcp.example.com

# Authentication for MCP (if required)
AIRBNB_MCP_AUTH_TOKEN=optional_auth_token
```

#### Supabase (Already Configured)
```bash
# From existing setup
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Service role key (for API routes - never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

#### Application Configuration
```bash
# Node environment
NODE_ENV=development

# Optional: LLM timeout (milliseconds)
AGENT_TIMEOUT_MS=60000

# Optional: Max concurrent requests to external APIs
API_RATE_LIMIT=10
```

### Environment Variable Validation

Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
# Then fill in actual values
```

**Validation Script** (`lib/env-validation.ts`):
```typescript
const requiredEnvVars = [
  "GEMINI_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "AIRBNB_MCP_ENDPOINT",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
}
```

Call this on app startup to fail fast if config is incomplete.

---

## Next Steps

1. **Immediate (Next Session):**
   - Set up database schema in Supabase
   - Create TypeScript types
   - Set up environment configuration

2. **Short Term:**
   - Implement LangGraph agent
   - Build API routes
   - Create core components

3. **Medium Term:**
   - Complete all UI components
   - Integration testing
   - Performance optimization

4. **Long Term (Post-MVP):**
   - User preferences (favorite destinations)
   - Trip editing/cloning
   - Collaborative trip planning
   - Mobile app
   - Real-time price tracking

---

## References

- **LangGraph.js:** https://langchain-ai.github.io/langgraphjs/
- **Gemini API:** https://ai.google.dev/gemini-api/docs
- **Google Maps API:** https://developers.google.com/maps/documentation
- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.io/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

**Document Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** Ready for implementation  
**Next Review:** After Phase 1 completion
