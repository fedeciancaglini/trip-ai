# Ready for Testing Checklist

## Pre-Testing Setup

### Environment Variables ✅
- [ ] Copy `.env.local` exists with all variables
- [ ] `GEMINI_API_KEY` is set and valid
- [ ] `GOOGLE_MAPS_API_KEY` is set and valid
- [ ] `AIRBNB_MCP_ENDPOINT` is configured
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set

### Database ✅
- [ ] Supabase project created
- [ ] `schema.sql` executed in SQL Editor
- [ ] `trips` table exists with all columns
- [ ] RLS policies are enabled
- [ ] Can view table in Supabase dashboard

### Dependencies ✅
- [ ] `bun install` completed successfully
- [ ] `@langchain/langgraph` installed
- [ ] `@google/generative-ai` installed
- [ ] `@radix-ui/react-tabs` installed
- [ ] shadcn/ui Tabs component created

### Code Verification ✅
- [ ] No TypeScript errors: `bunx tsc --noEmit`
- [ ] All API routes created
- [ ] All components created
- [ ] LangGraph agent compiles
- [ ] No missing imports

---

## Files to Verify

### Created Files Count
- [ ] 4 API route files
- [ ] 2 protected pages
- [ ] 1 form component
- [ ] 7 result components
- [ ] 3 saved-trips components
- [ ] 4 LangGraph nodes
- [ ] 4 service files
- [ ] 3 type/auth files
- [ ] 1 database schema

### Documentation
- [ ] README.md exists
- [ ] SETUP.md exists
- [ ] API_REFERENCE.md exists
- [ ] TESTING_GUIDE.md exists
- [ ] DEVELOPMENT.md exists
- [ ] IMPLEMENTATION_PLAN.md exists
- [ ] PROJECT_SUMMARY.md exists

---

## Quick Functional Tests

### 1. Application Starts
```bash
bun run dev
```
- [ ] No errors in console
- [ ] App runs on localhost:3000
- [ ] Homepage loads

### 2. Authentication Works
- [ ] Can navigate to `/auth/sign-up`
- [ ] Sign up form works
- [ ] Can log in after signup
- [ ] Can access `/protected/plan` when logged in
- [ ] Redirected to login when not authenticated

### 3. Form Validation
- [ ] Empty destination shows error
- [ ] Past dates rejected
- [ ] Zero budget rejected
- [ ] Valid inputs accepted

### 4. Trip Planning (With Mock/Real APIs)
- [ ] Form submits successfully
- [ ] Loading state appears
- [ ] Results load (may take 30-60s)
- [ ] All three tabs work (Itinerary, Map, Accommodations)
- [ ] Back button returns to form

### 5. Saving Trips
- [ ] Save Trip button visible
- [ ] Clicking Save shows loading
- [ ] Success message appears
- [ ] Redirects to saved trips page
- [ ] Trip appears in list

### 6. Saved Trips Page
- [ ] Can view all saved trips
- [ ] Can load more if > 12 trips
- [ ] Can delete a trip
- [ ] Empty state shown when no trips
- [ ] Can navigate back to plan

### 7. Error Handling
- [ ] Invalid API key shows error
- [ ] Timeout shows appropriate message
- [ ] Network error handled gracefully
- [ ] Database error shows message

---

## Before Deploying

### Code Quality
- [ ] All files use TypeScript
- [ ] No `any` types (unless necessary)
- [ ] All error cases handled
- [ ] Proper loading states
- [ ] No console errors/warnings

### Security
- [ ] API keys in env vars (not hardcoded)
- [ ] Authentication required for protected routes
- [ ] RLS policies enabled in database
- [ ] No sensitive data in responses
- [ ] CORS configured

### Performance
- [ ] Form submits quickly (< 1s)
- [ ] Results page loads (< 3s after agent completes)
- [ ] No unnecessary re-renders
- [ ] Images lazy-loaded
- [ ] Maps lazy-loaded

### Mobile Responsiveness
- [ ] Form responsive on mobile
- [ ] Results tabs work on mobile
- [ ] Buttons touch-friendly
- [ ] No horizontal scroll needed

---

## Testing With Real APIs

### Setup Real Services

**Gemini API:**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Create API key
3. Add to `.env.local`
4. Test by planning a trip

**Google Maps API:**
1. Go to Google Cloud Console
2. Enable Maps API and Routes API
3. Create API key with restrictions
4. Add to `.env.local`
5. Verify map loads in results

**Airbnb MCP:**
- Mock server: implement locally or stub responses
- Real server: ensure endpoint is running

### Test Data

**Test Trip 1 (Paris):**
- Destination: Paris, France
- Start: 2 weeks from today
- End: 9 days later
- Budget: $2000

**Test Trip 2 (Tokyo):**
- Destination: Tokyo, Japan
- Start: 4 weeks from today
- End: 10 days later
- Budget: $3000

**Test Trip 3 (Rome):**
- Destination: Rome, Italy
- Start: 1 week from today
- End: 5 days later
- Budget: $1500

---

## Known Test Scenarios

### Happy Path
1. Sign up → Log in → Plan trip → Get results → Save → View saved trips ✓

### Validation Tests
- [ ] Invalid destination (too long) - rejected
- [ ] Past start date - rejected
- [ ] End before start - rejected
- [ ] Zero/negative budget - rejected
- [ ] Missing fields - rejected

### Error Scenarios
- [ ] Missing API key - graceful error
- [ ] API timeout - shows timeout message
- [ ] Invalid destination (no results) - empty state
- [ ] Database error - shows error message
- [ ] No accommodations found - empty state

### Edge Cases
- [ ] Very long trip (30+ days)
- [ ] Very short trip (1 day)
- [ ] Very high budget ($100K+)
- [ ] Very low budget ($100)
- [ ] Unusual destination (island, remote area)

---

## Monitoring During Testing

### Server Logs
Watch for:
- [ ] No stack traces
- [ ] No unhandled rejections
- [ ] Clean API responses
- [ ] Proper error logging

### Browser Console
Watch for:
- [ ] No JavaScript errors
- [ ] No network 404s
- [ ] No CORS errors
- [ ] No memory leaks

### Supabase Logs
Check:
- [ ] RLS policy enforcement
- [ ] Query performance
- [ ] Auth sessions
- [ ] Error logs

---

## Testing Spreadsheet Template

```
Test Case | Steps | Expected | Actual | Pass | Notes
----------|-------|----------|--------|------|-------
Sign Up | Navigate to /auth/sign-up, fill form, submit | Account created | ... | ... | ...
Log In | Enter credentials, submit | Redirected to /protected | ... | ... | ...
Plan Trip | Fill form, submit | Results appear | ... | ... | ...
... | ... | ... | ... | ... | ...
```

---

## Completion Sign-Off

When all tests pass, your application is ready for:
- [ ] Production deployment
- [ ] User testing
- [ ] Performance optimization
- [ ] Feature additions

---

## Getting Help

If you encounter issues:

1. **Check Logs**
   - Browser console (F12)
   - Server terminal
   - Supabase logs

2. **Review Docs**
   - SETUP.md (setup issues)
   - API_REFERENCE.md (API issues)
   - TESTING_GUIDE.md (test cases)

3. **Debug Steps**
   - Verify env vars
   - Check database connection
   - Verify API keys are valid
   - Check network requests in DevTools

4. **Common Issues**
   - See SETUP.md troubleshooting section
   - Check .env.local is correct
   - Verify schema.sql executed

---

**Ready to test! 🚀**

Start with `bun run dev` and work through the quick functional tests above.
