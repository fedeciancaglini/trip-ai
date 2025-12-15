# Development Guide

## Project Standards

### Code Style
- Use TypeScript for all code
- Follow ESLint configuration
- Use Prettier for formatting
- Max line length: 100 characters

### File Organization
```
lib/
  ├── services/     # External API clients
  ├── nodes/        # LangGraph nodes
  ├── supabase/     # Database clients
  ├── auth.ts       # Authentication
  ├── types.ts      # Type definitions
  └── utils.ts      # Utilities

components/
  ├── forms/        # Form components
  ├── results/      # Results display
  ├── saved-trips/  # Saved trips views
  ├── ui/           # shadcn/ui components
  └── shared/       # Shared components
```

## Common Tasks

### Adding a New Component

1. Create file in appropriate directory under `components/`
2. Use `"use client"` directive if it needs interactivity
3. Export named function component
4. Add TypeScript interfaces for props
5. Import shadcn/ui components as needed

```typescript
"use client";

import { Card } from "@/components/ui/card";
import type { MyType } from "@/lib/types";

interface MyComponentProps {
  data: MyType;
}

export function MyComponent({ data }: MyComponentProps) {
  return <Card>{data.name}</Card>;
}
```

### Adding a New API Endpoint

1. Create `app/api/[route]/route.ts`
2. Export `POST`, `GET`, `DELETE`, etc. functions
3. Validate authentication first with `requireAuth()`
4. Validate request data
5. Call service/database functions
6. Return typed response

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import type { MyRequest, MyResponse } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const body = (await request.json()) as MyRequest;
    
    // Validation, processing...
    
    return NextResponse.json({ success: true } as MyResponse);
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

### Adding a New Type

Add to `lib/types.ts`:

```typescript
export interface MyType {
  id: string;
  name: string;
  createdAt: string;
}
```

### Adding a New Service

Create `lib/services/my-service.ts`:

```typescript
import type { MyType } from "../types";
import { MyServiceError } from "../types";

export async function myServiceFunction(
  param: string,
): Promise<MyType> {
  try {
    // Implementation
  } catch (error) {
    throw new MyServiceError("Failed to do thing");
  }
}
```

### Adding a New LangGraph Node

Create `lib/nodes/my-node.ts`:

```typescript
import type { TripPlannerState } from "../types";

export async function myNode(state: TripPlannerState): Promise<TripPlannerState> {
  try {
    // Process state
    return {
      ...state,
      // Update fields
    };
  } catch (error) {
    return {
      ...state,
      errors: [...state.errors, "Node error message"],
    };
  }
}
```

## Testing During Development

### Manual Testing
```bash
# Start dev server
bun run dev

# In another terminal, run tests
bun run test
```

### Testing Specific Endpoint
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

### Debugging
- Use browser DevTools for frontend
- Use `console.log()` in API routes
- Check `.next` build output for issues
- Verify `schema.sql` was executed in Supabase

## Debugging Guide

### TypeScript Errors
```bash
# Check for type errors
bunx tsc --noEmit
```

### API Route Issues
- Check that route is in `app/api/[path]/route.ts`
- Verify exports are `POST`, `GET`, etc. (uppercase)
- Check authentication in `requireAuth()`
- Review response status codes

### Component Issues
- Check that client components have `"use client"` directive
- Verify props match interface
- Check imports use `@/` alias
- Ensure shadcn/ui components are installed

### Database Issues
- Check RLS policies in Supabase
- Verify user_id is properly set
- Check schema.sql execution in SQL Editor
- Use Supabase dashboard to inspect data

### LangGraph Issues
- Check all nodes are added to workflow
- Verify edges are correctly connected
- Check node error handling
- Review state mutations are returning new state

## Performance Considerations

### Database
- Use indexes on `user_id`, `created_at`
- Implement query pagination
- Cache results where appropriate
- Monitor slow queries

### API
- Use request timeouts (60s agent timeout)
- Implement rate limiting
- Cache external API responses
- Use streaming for large responses

### Frontend
- Lazy load heavy components
- Memoize expensive computations
- Use `React.memo()` for stable components
- Avoid unnecessary re-renders

## Security Checklist

- [ ] All user inputs validated on server
- [ ] RLS policies enforce user isolation
- [ ] API keys never exposed to client
- [ ] Session tokens in secure cookies
- [ ] CSRF tokens on state-changing operations
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't expose internals
- [ ] Database queries use prepared statements
- [ ] HTTPS enforced in production
- [ ] CORS headers properly configured

## Deployment

### Pre-deployment
```bash
# Type check
bunx tsc --noEmit

# Build
bun run build

# Test production build locally
bun run start
```

### Environment Variables
Ensure all required variables are set:
- `GEMINI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `AIRBNB_MCP_ENDPOINT`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Vercel Deployment
1. Push to GitHub
2. Connect repository in Vercel
3. Add environment variables in Settings
4. Trigger deploy
5. Monitor deployment logs

## Monitoring

### Error Tracking
- Set up error logging (Sentry)
- Monitor API error rates
- Track database errors
- Alert on timeouts

### Performance
- Use Vercel Analytics
- Monitor Core Web Vitals
- Track API response times
- Monitor database performance

### Usage
- Track feature usage
- Monitor active users
- Track plan trip completion rate
- Monitor save trip success rate

## Documentation

### Adding Comments
```typescript
/**
 * Fetches points of interest for a destination
 * @param destination - City, Country name
 * @param startDate - Trip start date
 * @returns Array of POI objects with coordinates
 * @throws GeminiError if API call fails
 */
export async function discoverPointsOfInterest(
  destination: string,
  startDate: Date,
): Promise<POI[]> {
  // Implementation
}
```

### API Documentation
Update `API_REFERENCE.md` when:
- Adding new endpoints
- Changing request/response format
- Adding new error codes
- Changing status codes

### Setup Documentation
Update `SETUP.md` when:
- Adding new environment variables
- Changing database schema
- Adding new dependencies
- Changing setup process

## Version Control

### Commit Messages
```
feat: add accommodation filtering
fix: resolve timeout in route planning
refactor: simplify POI discovery node
docs: update API reference
test: add integration test for plan-trip

[optional body]

[optional footer]
```

### Branches
- `main` - Production ready
- `develop` - Integration branch
- `feature/xyz` - Feature branches
- `bugfix/xyz` - Bug fix branches

## Useful Commands

```bash
# Development
bun run dev              # Start dev server
bun run build           # Build for production
bun run start           # Start production server
bun run lint            # Run ESLint

# Database
# Open Supabase SQL Editor to run queries

# Dependencies
bun add [package]       # Add package
bun remove [package]    # Remove package
bun update              # Update all packages
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.io/docs)
- [LangGraph Docs](https://langchain-ai.github.io/langgraphjs/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google Maps API](https://developers.google.com/maps/documentation)
