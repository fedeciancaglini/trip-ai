# API Reference

## Authentication

All endpoints (except auth routes) require an authenticated user session via browser cookies.

## Endpoints

### POST /api/plan-trip

Generate a complete trip plan using the LangGraph agent.

**Request:**
```json
{
  "destination": "Paris, France",
  "startDate": "2025-06-15",
  "endDate": "2025-06-22",
  "budgetUsd": 2000
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "pointsOfInterest": [
      {
        "name": "Eiffel Tower",
        "description": "Iconic iron lattice tower...",
        "lat": 48.8584,
        "lng": 2.2945,
        "category": "monument"
      }
    ],
    "dailyItinerary": [
      {
        "day": 1,
        "date": "2025-06-15",
        "pois": [
          {
            "name": "Eiffel Tower",
            "description": "...",
            "lat": 48.8584,
            "lng": 2.2945,
            "category": "monument",
            "timeWindow": "09:00-11:00",
            "duration": 120,
            "travelTimeFromPrevious": 0
          }
        ],
        "totalDuration": "4 hours"
      }
    ],
    "routeInformation": {
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
    },
    "airbnbRecommendations": [
      {
        "id": "12345678",
        "name": "Charming Studio in Marais",
        "price": "1800",
        "pricePerNight": "250",
        "link": "https://www.airbnb.com/rooms/12345678",
        "location": {
          "lat": 48.8566,
          "lng": 2.3522
        },
        "distanceToRoute": "0.5 km",
        "rating": 4.8,
        "reviewCount": 120
      }
    ]
  }
}
```

**Response (400 - Validation Error):**
```json
{
  "success": false,
  "error": "Invalid destination: must not be empty",
  "code": "VALIDATION_ERROR"
}
```

**Response (504 - Timeout):**
```json
{
  "success": false,
  "error": "Trip planning took too long. Please try again.",
  "code": "TIMEOUT_ERROR",
  "timeout": 60000
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input
- `TIMEOUT_ERROR` - Agent execution exceeded 60 seconds
- `GEMINI_ERROR` - Gemini API failed
- `GOOGLE_MAPS_ERROR` - Google Maps API failed
- `AIRBNB_ERROR` - Airbnb MCP failed
- `AUTH_ERROR` - Not authenticated
- `INTERNAL_ERROR` - Server error

---

### POST /api/save-trip

Save a generated trip plan to the database.

**Request:**
```json
{
  "destination": "Paris, France",
  "startDate": "2025-06-15",
  "endDate": "2025-06-22",
  "budgetUsd": 2000,
  "pointsOfInterest": [...],
  "dailyItinerary": [...],
  "routeInformation": {...},
  "airbnbRecommendations": [...]
}
```

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "tripId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Response (400 - Missing Fields):**
```json
{
  "success": false,
  "error": "Missing required fields: pointsOfInterest, dailyItinerary",
  "code": "VALIDATION_ERROR"
}
```

**Response (500 - Database Error):**
```json
{
  "success": false,
  "error": "Failed to save trip. Please try again later.",
  "code": "DATABASE_ERROR"
}
```

---

### GET /api/saved-trips

Retrieve user's saved trips with pagination.

**Query Parameters:**
- `limit` (optional, default: 50, max: 100) - Items per page
- `offset` (optional, default: 0) - Pagination offset
- `sortBy` (optional, default: "created_at") - Sort by "created_at" or "is_favorite"

**Example:**
```
GET /api/saved-trips?limit=12&offset=0&sortBy=created_at
```

**Response (200 - Success):**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "user-123",
        "destination": "Paris, France",
        "startDate": "2025-06-15",
        "endDate": "2025-06-22",
        "budgetUsd": 2000,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z",
        "isFavorite": false,
        "pointsOfInterest": [...],
        "dailyItinerary": [...],
        "routeInformation": {...},
        "airbnbRecommendations": [...]
      }
    ],
    "total": 5,
    "hasMore": false
  }
}
```

**Response (400 - Invalid sortBy):**
```json
{
  "success": false,
  "error": "sortBy must be \"created_at\" or \"is_favorite\"",
  "code": "VALIDATION_ERROR"
}
```

---

### DELETE /api/trips/[tripId]

Delete a saved trip.

**Example:**
```
DELETE /api/trips/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 - Success):**
```json
{
  "success": true
}
```

**Response (400 - Missing ID):**
```json
{
  "success": false,
  "error": "Trip ID is required",
  "code": "VALIDATION_ERROR"
}
```

**Response (500 - Delete Failed):**
```json
{
  "success": false,
  "error": "An unexpected error occurred while deleting the trip",
  "code": "INTERNAL_ERROR"
}
```

---

## Data Types

### POI (Point of Interest)
```typescript
{
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: "museum" | "landmark" | "park" | "restaurant" | "market" | "historical" | "natural" | "entertainment";
}
```

### DaySchedule
```typescript
{
  day: number;
  date: string; // YYYY-MM-DD
  pois: DayPOI[];
  totalDuration: string; // e.g., "4 hours"
}
```

### DayPOI (extends POI)
```typescript
{
  ...POI;
  timeWindow: string; // e.g., "09:00-11:00"
  duration: number; // minutes
  travelTimeFromPrevious: number; // minutes
}
```

### RouteData
```typescript
{
  totalDistance: string; // e.g., "45.2 km"
  totalDuration: string; // e.g., "5 hours 30 minutes"
  routes: Array<{
    day: number;
    legs: Array<{
      startLocation: string;
      endLocation: string;
      distance: string;
      duration: string;
    }>;
  }>;
}
```

### AirbnbListing
```typescript
{
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
```

### SavedTrip
```typescript
{
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
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isFavorite: boolean;
}
```

---

## Status Codes

- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (not authenticated)
- `500` - Server error
- `504` - Gateway timeout (agent execution timeout)

---

## Rate Limiting

- 10 concurrent requests per user (default)
- Agent timeout: 60 seconds
- API calls to Gemini, Maps, Airbnb count toward rate limit

---

## CORS

The API allows requests from:
- `http://localhost:3000` (development)
- `https://yourdomain.com` (production)

All requests should include `Content-Type: application/json` header.

---

## Examples

### cURL - Plan a Trip
```bash
curl -X POST http://localhost:3000/api/plan-trip \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris, France",
    "startDate": "2025-06-15",
    "endDate": "2025-06-22",
    "budgetUsd": 2000
  }'
```

### cURL - Get Saved Trips
```bash
curl -X GET "http://localhost:3000/api/saved-trips?limit=10&offset=0" \
  -H "Cookie: your-session-cookie"
```

### JavaScript - Plan a Trip
```javascript
const response = await fetch('/api/plan-trip', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    destination: 'Paris, France',
    startDate: '2025-06-15',
    endDate: '2025-06-22',
    budgetUsd: 2000,
  }),
});
const data = await response.json();
```

---

## Monitoring

Monitor these metrics in production:
- Average response time per endpoint
- Error rate by error code
- Agent execution time distribution
- API rate limit usage
- Database query performance
