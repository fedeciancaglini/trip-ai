# Testing Guide - Trip Planner Application

## End-to-End Testing Checklist

### 1. Authentication Flow
- [ ] Sign up with new email
- [ ] Receive confirmation email (check spam folder)
- [ ] Confirm email and verify account is activated
- [ ] Log in with credentials
- [ ] Session persists after page refresh
- [ ] Log out and verify redirect to login page
- [ ] Cannot access protected routes without auth

### 2. Trip Planning Form
- [ ] **Destination Input**
  - [ ] Accept valid city/country inputs
  - [ ] Reject empty destination
  - [ ] Show error for empty input
  - [ ] Clear previous errors when user types

- [ ] **Date Selection**
  - [ ] Start date picker works
  - [ ] End date picker works
  - [ ] Cannot select past dates
  - [ ] End date cannot be before start date
  - [ ] Show error if start > end

- [ ] **Budget Input**
  - [ ] Accept positive numbers
  - [ ] Reject zero or negative numbers
  - [ ] Show error message for invalid budget
  - [ ] Budget up to $1,000,000 accepted

- [ ] **Form Submission**
  - [ ] Submit button disabled while loading
  - [ ] Loading state shows "Planning your trip..."
  - [ ] Form validation passes for valid inputs
  - [ ] Form submission fails with error message for invalid inputs

### 3. Trip Planning Agent (API)
- [ ] Agent executes within timeout (60 seconds)
- [ ] POIs are discovered for destination
- [ ] Daily itinerary is generated
- [ ] Route information includes distances and durations
- [ ] Airbnb recommendations are returned
- [ ] Agent handles API failures gracefully
- [ ] Timeout error returns 504 with message
- [ ] Network errors show user-friendly messages

### 4. Results Display

#### Itinerary Section
- [ ] Shows all days of trip
- [ ] Each day displays correct date
- [ ] POIs are listed with descriptions
- [ ] Travel times shown between locations
- [ ] Summary stats display (total distance, duration, locations)
- [ ] Responsive on mobile/tablet/desktop

#### Map Section
- [ ] Google Maps embeds correctly
- [ ] Map shows trip destination
- [ ] POI legend displays with numbered locations
- [ ] Map is interactive (zoom, pan)
- [ ] Mobile: Map is responsive

#### Accommodations Section
- [ ] Shows Airbnb listings
- [ ] Lists prices within budget
- [ ] "View on Airbnb" links work
- [ ] Star ratings display if available
- [ ] Images load correctly
- [ ] Empty state shows if no listings found

### 5. Save Trip Functionality
- [ ] Save button visible on results page
- [ ] Clicking Save shows loading state
- [ ] Successfully saved trip shows "Trip Saved!" message
- [ ] Redirects to saved trips page after 2 seconds
- [ ] Duplicate detection works (same destination + dates)
- [ ] Error message shown if save fails
- [ ] Trip data persisted in database
- [ ] Correct user_id associated with trip

### 6. Saved Trips Page
- [ ] Page loads with user's saved trips
- [ ] Empty state shown when no trips
- [ ] Each trip card shows:
  - [ ] Destination
  - [ ] Dates
  - [ ] Budget
  - [ ] Created date
  - [ ] View button
  - [ ] Delete button

- [ ] **Pagination**
  - [ ] "Load More" button appears if > 12 trips
  - [ ] Loading state while fetching
  - [ ] New trips load correctly

- [ ] **Delete Trip**
  - [ ] Confirmation dialog appears
  - [ ] Trip deleted from database on confirm
  - [ ] Trip removed from UI
  - [ ] Error message if delete fails

- [ ] **View Trip**
  - [ ] Clicking "View" shows full trip details
  - [ ] Same data as when first planned
  - [ ] Cannot edit (read-only)
  - [ ] Cannot re-save

### 7. Error Scenarios

#### Network Errors
- [ ] Handles offline gracefully
- [ ] Shows retry option
- [ ] No infinite loading spinners

#### API Errors
- [ ] Missing API keys triggers warning
- [ ] API timeouts show 504 error
- [ ] Gemini API errors handled
- [ ] Google Maps API errors handled
- [ ] Airbnb MCP errors handled

#### Database Errors
- [ ] Supabase connection failures handled
- [ ] RLS policy violations handled
- [ ] Duplicate key errors handled
- [ ] User sees appropriate error message

#### Invalid Input
- [ ] Very long destination names rejected
- [ ] Special characters in destination handled
- [ ] Invalid date formats rejected
- [ ] Negative budgets rejected
- [ ] Missing required fields caught

### 8. Security Testing
- [ ] RLS policies enforce user isolation
- [ ] User can only see own trips
- [ ] User cannot view other user's trips via API
- [ ] User cannot delete other user's trips
- [ ] Session tokens not exposed in browser
- [ ] No sensitive data in URL params
- [ ] API key not exposed to client
- [ ] CORS headers properly set

### 9. Performance Testing
- [ ] Results page loads within 3 seconds
- [ ] Saved trips page loads within 2 seconds
- [ ] Maps lazy-load (don't block initial render)
- [ ] Images are optimized
- [ ] No unnecessary re-renders on tab switches
- [ ] Pagination doesn't re-fetch existing data

### 10. Mobile Responsiveness
- [ ] Form layout on mobile (single column)
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Results tabs stack on small screens
- [ ] Map displays correctly on mobile
- [ ] Accommodation cards responsive
- [ ] No horizontal scrolling needed

## Manual Testing Script

```bash
# Start the development server
bun run dev

# Test flow:
# 1. Navigate to http://localhost:3000
# 2. Click "Sign Up"
# 3. Fill form with test email/password
# 4. Verify confirmation email
# 5. Log in
# 6. Navigate to "Plan Trip"
# 7. Fill trip planner form:
#    - Destination: "Paris, France"
#    - Start: 2 weeks from today
#    - End: 9 days later
#    - Budget: 2000
# 8. Wait for results
# 9. Review all three tabs
# 10. Click "Save Trip"
# 11. Verify redirect to saved trips
# 12. View saved trip
# 13. Return to planning
# 14. Test delete trip
```

## Automated Testing (Future)

- Unit tests for service layers (Gemini, Maps, Airbnb)
- Integration tests for API routes
- E2E tests with Playwright/Cypress
- Component tests with React Testing Library

## Known Limitations

- Map uses basic embed (no custom styling of markers)
- Airbnb MCP requires mock server in development
- Agent timeout is 60 seconds (may need increase for slow networks)
- No real-time trip updates
- No offline mode

## Deployment Checklist

- [ ] All env vars set in production
- [ ] Database backups configured
- [ ] RLS policies verified
- [ ] Error logging configured (Sentry)
- [ ] Performance monitoring setup (Vercel Analytics)
- [ ] Email service tested
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CSP headers configured
