# Trip Planner Setup Guide

## Prerequisites

- Node.js 18+ (or Bun)
- Supabase account
- Google API credentials
- Gemini API key
- Airbnb MCP server (or mock for development)

## 1. Database Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### Run Migration
1. Go to Supabase dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of `schema.sql` into the editor
4. Execute the query
5. Verify the `trips` table was created with RLS policies

## 2. Environment Variables

Copy the template and fill in your values:

```bash
cp .env.local .env.local
```

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from: Supabase Dashboard → Settings → API

### API Keys

**Gemini API:**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create a new project
4. Generate API key
5. Add to .env.local:
```
GEMINI_API_KEY=your-key-here
```

**Google Maps API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Maps API" and "Routes API"
4. Create an API key
5. Add to .env.local:
```
GOOGLE_MAPS_API_KEY=your-key-here
```

### Airbnb MCP Configuration
```
AIRBNB_MCP_ENDPOINT=http://localhost:8000
AIRBNB_MCP_AUTH_TOKEN=optional
```

**For Development (Mock):**
Create a simple mock server or use the real Airbnb MCP when available.

## 3. Dependencies

All dependencies are listed in `package.json`. Install with:

```bash
bun install
```

Key packages:
- `@langchain/langgraph` - Agent orchestration
- `@google/generative-ai` - Gemini API
- `@supabase/ssr` - Supabase client
- `next` - Framework
- `react` - UI library
- `tailwindcss` - Styling

## 4. Running Locally

```bash
bun run dev
```

Visit `http://localhost:3000`

### Default Routes
- `/` - Public home page
- `/auth/login` - Login page
- `/auth/sign-up` - Sign up page
- `/protected/plan` - Trip planner (protected)
- `/protected/saved-trips` - Saved trips (protected)

## 5. Testing the Application

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing checklist.

Quick start test:
1. Sign up with test email
2. Plan a trip (e.g., Paris, 2 weeks from now, $2000 budget)
3. Wait for results (60 second timeout)
4. Review itinerary, map, and accommodations
5. Save the trip
6. View in saved trips page

## 6. Project Structure

```
trip-ai/
├── app/                          # Next.js app directory
│   ├── api/
│   │   ├── plan-trip/           # Main planning endpoint
│   │   ├── save-trip/           # Save trip endpoint
│   │   ├── saved-trips/         # Get saved trips endpoint
│   │   └── trips/[tripId]/      # Delete trip endpoint
│   ├── auth/                     # Auth pages
│   ├── protected/                # Protected routes
│   │   ├── plan/                # Trip planner form
│   │   ├── saved-trips/         # Saved trips list
│   │   └── layout.tsx           # Protected layout
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
│
├── components/
│   ├── forms/
│   │   └── TripPlannerForm.tsx
│   ├── results/
│   │   ├── AccommodationCard.tsx
│   │   ├── AccommodationSection.tsx
│   │   ├── DayCard.tsx
│   │   ├── InteractiveMap.tsx
│   │   ├── ItinerarySection.tsx
│   │   ├── ResultsContainer.tsx
│   │   └── TimelineItem.tsx
│   ├── saved-trips/
│   │   ├── EmptyState.tsx
│   │   ├── TripCard.tsx
│   │   └── TripsListContainer.tsx
│   └── ui/                       # shadcn/ui components
│
├── lib/
│   ├── services/
│   │   ├── airbnb-mcp.ts        # Airbnb MCP client
│   │   ├── gemini.ts            # Gemini API wrapper
│   │   ├── google-maps.ts       # Google Maps wrapper
│   │   └── supabase.ts          # Database operations
│   ├── nodes/
│   │   ├── accommodation.ts     # Accommodation search node
│   │   ├── input-validation.ts  # Input validation node
│   │   ├── interest-points.ts   # POI discovery node
│   │   └── route-planning.ts    # Route planning node
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   └── server.ts            # Server client
│   ├── auth.ts                   # Auth utilities
│   ├── env-validation.ts        # Env var validation
│   ├── langgraph-agent.ts       # Main agent
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Utility functions
│
├── schema.sql                    # Database schema
├── .env.example                  # Environment template
└── IMPLEMENTATION_PLAN.md        # Architecture docs
```

## 7. Troubleshooting

### "Missing required environment variables"
- Ensure all keys from .env.example are in .env.local
- Restart dev server after adding env vars

### "Failed to plan trip"
- Check API key validity
- Verify internet connection
- Check agent timeout isn't exceeded
- Review server logs for specific error

### "Cannot view saved trips"
- Verify authentication session is active
- Check browser cookies are enabled
- Verify RLS policies in Supabase

### "Map not loading"
- Verify Google Maps API is enabled
- Check API key has correct restrictions
- Ensure Maps embed API is enabled

### "Airbnb MCP connection failed"
- Verify AIRBNB_MCP_ENDPOINT is correct
- Check MCP server is running (if local)
- Verify auth token if required

## 8. Production Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Settings
4. Deploy

### Self-hosted
1. Build: `bun run build`
2. Start: `bun run start`
3. Set NODE_ENV=production
4. Configure reverse proxy (nginx/caddy)
5. Enable HTTPS

## 9. Environment Variable Security

**Never commit .env.local to version control!**

Use .env.example as template. For CI/CD:
- Store secrets in secure environment
- Use provider's secret management
- Rotate keys regularly

## 10. Performance Optimization (Future)

- Image optimization with Next.js Image
- Database query caching
- API response caching
- Component code splitting
- Database indexing improvements

## Support

For issues:
1. Check TESTING_GUIDE.md
2. Review IMPLEMENTATION_PLAN.md
3. Check logs in browser console
4. Verify .env.local configuration

## References

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.io/docs)
- [LangGraph Docs](https://langchain-ai.github.io/langgraphjs/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google Maps API](https://developers.google.com/maps/documentation)
