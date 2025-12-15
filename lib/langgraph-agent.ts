/**
 * LangGraph Agent for Trip Planning
 * Orchestrates the multi-step workflow for generating complete trip plans
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import type { TripPlannerState } from "./types";
import { validateInput } from "./nodes/input-validation";
import { discoverInterestPoints } from "./nodes/interest-points";
import { planRoutes } from "./nodes/route-planning";
import { searchAccommodation } from "./nodes/accommodation";

/**
 * Create and compile the trip planner graph
 * This is done once at startup and reused for multiple invocations
 */
function createTripPlannerGraph() {
  const workflow = new StateGraph<TripPlannerState>({
    channels: {
      destination: { value: (x?: string) => x || "" },
      startDate: { value: (x?: Date) => x || new Date() },
      endDate: { value: (x?: Date) => x || new Date() },
      budgetUsd: { value: (x?: number) => x || 0 },
      daysCount: { value: (x?: number) => x || 1 },
      pointsOfInterest: { value: (x?) => x || [] },
      dailyItinerary: { value: (x?) => x || [] },
      routeInformation: { value: (x?) => x || { totalDistance: "", totalDuration: "", routes: [] } },
      airbnbRecommendations: { value: (x?) => x || [] },
      errors: { value: (x?: string[]) => x || [] },
      startTime: { value: (x?: Date) => x || new Date() },
      endTime: { value: (x?: Date) => x },
    },
  });

  // Add nodes
  workflow.addNode("validate_input", validateInput);
  workflow.addNode("discover_pois", discoverInterestPoints);
  workflow.addNode("plan_routes", planRoutes);
  workflow.addNode("search_accommodation", searchAccommodation);

  // Add edges for sequential execution
  workflow.addEdge(START, "validate_input");
  workflow.addEdge("validate_input", "discover_pois");
  workflow.addEdge("discover_pois", "plan_routes");
  workflow.addEdge("plan_routes", "search_accommodation");
  workflow.addEdge("search_accommodation", END);

  return workflow.compile();
}

// Compile once at module load
let compiledGraph: ReturnType<typeof createTripPlannerGraph> | null = null;

function getCompiledGraph() {
  if (!compiledGraph) {
    compiledGraph = createTripPlannerGraph();
  }
  return compiledGraph;
}

/**
 * Execute the trip planner agent
 * @param input - Initial state with user inputs
 * @param timeout - Optional timeout in milliseconds
 * @returns Final state with generated trip plan
 */
export async function executeTripPlanner(
  input: Omit<TripPlannerState, "errors" | "startTime" | "endTime">,
  timeout?: number,
): Promise<TripPlannerState> {
  const graph = getCompiledGraph();

  const initialState: TripPlannerState = {
    ...input,
    errors: [],
    startTime: new Date(),
  };

  // Use timeout if specified
  if (timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Trip planning timeout after ${timeout}ms`));
      }, timeout);

      graph.invoke(initialState).then((result) => {
        clearTimeout(timeoutId);
        resolve(result as TripPlannerState);
      });
    });
  } else {
    const result = await graph.invoke(initialState);
    return result as TripPlannerState;
  }
}

/**
 * Get the compiled graph for inspection/testing
 */
export function getGraph() {
  return getCompiledGraph();
}
