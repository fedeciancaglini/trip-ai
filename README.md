# Trip Planner AI - Travel Planning with LangGraph

An intelligent trip planning application built with Next.js, LangGraph, and AI services (Gemini, Google Maps, Airbnb MCP).

## Features

- **AI-Powered Trip Planning** - Uses LangGraph to orchestrate multi-step workflow
  - POI Discovery with Gemini API
  - Route Optimization with Google Maps
  - Accommodation Search via Airbnb MCP
  - Intelligent daily itinerary generation

- **User Authentication** - Secure cookie-based auth with Supabase
  - Email/password authentication
  - Protected routes
  - Session management

- **Trip Management**
  - Generate complete trip plans with itineraries
  - View points of interest with descriptions
  - Interactive map with route visualization
  - Airbnb accommodation recommendations
  - Save trips for later reference
  - View trip history

- **Tech Stack**
  - **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS, shadcn/ui
  - **Backend**: Next.js API routes
  - **Database**: Supabase (PostgreSQL) with Row-Level Security
  - **AI/ML**: LangGraph for agent orchestration
  - **APIs**: Gemini, Google Maps, Airbnb MCP

## Quick Start

### Prerequisites
- Node.js 18+ (or Bun)
- Supabase account
- Google Cloud API keys (Gemini, Maps)
- (Optional) Airbnb MCP server

### 1. Clone and Install
```bash
git clone <your-repo>
cd trip-ai
bun install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
GOOGLE_MAPS_API_KEY=your-maps-key
AIRBNB_MCP_ENDPOINT=http://localhost:8000
```

### 3. Setup Database
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `schema.sql`
3. Verify the `trips` table was created with RLS policies

### 4. Run Development Server
```bash
bun run dev
```

Open [localhost:3000](http://localhost:3000)

### 5. Test the App
1. Sign up with test email
2. Plan a trip (e.g., Paris, 2 weeks from now, $2000)
3. Wait for results (~30-60 seconds)
4. Review itinerary, map, and accommodations
5. Save the trip
6. View in saved trips page

## Project Structure

```
trip-ai/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── plan-trip/        # Trip planning endpoint
│   │   ├── save-trip/        # Save trip endpoint
│   │   ├── saved-trips/      # Get trips endpoint
│   │   └── trips/[tripId]/   # Delete trip endpoint
│   ├── auth/                 # Auth pages
│   └── protected/            # Protected routes
│       ├── plan/             # Trip planner
│       └── saved-trips/      # Saved trips list
│
├── components/               # React components
│   ├── forms/                # Input forms
│   ├── results/              # Results display
│   ├── saved-trips/          # Saved trips UI
│   └── ui/                   # shadcn/ui components
│
├── lib/                      # Core logic
│   ├── services/             # External APIs
│   │   ├── gemini.ts         # Gemini wrapper
│   │   ├── google-maps.ts    # Maps wrapper
│   │   ├── airbnb-mcp.ts     # Airbnb client
│   │   └── supabase.ts       # Database ops
│   ├── nodes/                # LangGraph nodes
│   ├── langgraph-agent.ts    # Agent orchestration
│   ├── auth.ts               # Auth helpers
│   └── types.ts              # TypeScript types
│
├── schema.sql                # Database schema
├── SETUP.md                  # Setup instructions
├── API_REFERENCE.md          # API documentation
├── TESTING_GUIDE.md          # Testing checklist
└── DEVELOPMENT.md            # Dev guidelines
```

## API Endpoints

### POST /api/plan-trip
Generate a complete trip plan.

**Request:**
```json
{
  "destination": "Paris, France",
  "startDate": "2025-06-15",
  "endDate": "2025-06-22",
  "budgetUsd": 2000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pointsOfInterest": [...],
    "dailyItinerary": [...],
    "routeInformation": {...},
    "airbnbRecommendations": [...]
  }
}
```

### POST /api/save-trip
Save a generated trip plan.

### GET /api/saved-trips?limit=12&offset=0
Retrieve user's saved trips.

### DELETE /api/trips/[tripId]
Delete a saved trip.

See [API_REFERENCE.md](./API_REFERENCE.md) for full documentation.

## Agent Workflow

The LangGraph agent executes sequentially:

1. **Input Validation** - Validate destination, dates, budget
2. **POI Discovery** - Use Gemini to find 10-12 points of interest
3. **Route Planning** - Use Google Maps to plan daily routes
4. **Accommodation Search** - Use Airbnb MCP to find lodging options

```
User Input → Validation → POI Discovery → Route Planning → Accommodation Search → Results
```

## Configuration

### Environment Variables
See `.env.example` for all required variables:
- Supabase credentials (already configured)
- Gemini API key
- Google Maps API key
- Airbnb MCP endpoint
- Agent timeout (default 60s)

### Database Schema
Automatically created from `schema.sql`:
- `trips` table with user isolation via RLS
- Indexes for performance
- JSONB columns for flexible data storage

### Authentication
Uses Supabase with cookie-based sessions:
- Email/password auth
- Protected routes via middleware
- Session persists across page reloads

## Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing checklist.

Quick test:
```bash
# 1. Start dev server
bun run dev

# 2. Sign up at http://localhost:3000/auth/sign-up
# 3. Plan a trip
# 4. Save and view results
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:
- Code standards
- Adding components
- Adding API endpoints
- Database migrations
- Testing practices
- Debugging tips

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Self-Hosted
```bash
bun run build
bun run start
```

Requires:
- Node.js 18+
- All environment variables set
- HTTPS certificate
- Reverse proxy (nginx/caddy)

## Performance

- Agent execution: ~30-60 seconds
- Form submission: <1 second
- Results page load: <3 seconds
- Saved trips page: <2 seconds
- Concurrent API requests: 10/user

## Security

- Row-Level Security (RLS) enforces user data isolation
- API keys never exposed to client
- Session tokens in secure cookies
- CSRF protection via Next.js
- Input validation on all endpoints
- Rate limiting on API routes

## Troubleshooting

### "Missing environment variables"
Ensure all required keys are in `.env.local`. Restart dev server after adding.

### "Failed to plan trip"
- Check API key validity
- Verify internet connection
- Review server logs for specific error
- Agent timeout may need increase

### "Cannot view saved trips"
- Verify authentication is active
- Check browser cookies enabled
- Verify database schema executed

See [SETUP.md](./SETUP.md) for more troubleshooting.

## Key Files

- `lib/langgraph-agent.ts` - Agent orchestration
- `lib/nodes/*.ts` - Agent nodes
- `lib/services/*.ts` - External API clients
- `app/api/*.ts` - API routes
- `components/results/*.tsx` - Results display
- `schema.sql` - Database schema

## Future Enhancements

- Trip editing and cloning
- Collaborative trip planning
- Real-time price tracking
- User preferences and favorites
- Mobile app
- Email notifications
- Expense tracking
- Social sharing

## Support

- Check [SETUP.md](./SETUP.md) for setup issues
- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing help
- Check [API_REFERENCE.md](./API_REFERENCE.md) for API issues
- Review browser console for client-side errors
- Check server logs for API errors

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.io/docs)
- [LangGraph Docs](https://langchain-ai.github.io/langgraphjs/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google Maps API](https://developers.google.com/maps/documentation)
- [shadcn/ui](https://ui.shadcn.com)

## License

MIT

## Author

Built with ❤️ for intelligent trip planning
