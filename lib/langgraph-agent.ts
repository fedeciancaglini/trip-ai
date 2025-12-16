/**
 * LangGraph Agent for Trip Planning
 * Orchestrates the multi-step workflow for generating complete trip plans
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { TripPlannerStateAnnotation, type TripPlannerState } from "./types";
import { validateInput } from "./nodes/input-validation";
import { geocodeLocations } from "./nodes/geocoding";
import { discoverInterestPoints } from "./nodes/interest-points";
import { planRoutes } from "./nodes/route-planning";
import { searchAccommodation } from "./nodes/accommodation";

// Trip planner node names
const TripPlannerNodeNames = {
  validateInput: "validate_input",
  geocodeLocations: "geocode_locations",
  discoverPois: "discover_pois",
  planRoutes: "plan_routes",
  searchAccommodation: "search_accommodation",
} as const;

/**
 * Create and compile the trip planner graph
 * This is done once at startup and reused for multiple invocations
 */
function createTripPlannerGraph() {
  const workflow = new StateGraph(TripPlannerStateAnnotation)
    // Add nodes
    .addNode(TripPlannerNodeNames.validateInput, validateInput)
    .addNode(TripPlannerNodeNames.geocodeLocations, geocodeLocations)
    .addNode(TripPlannerNodeNames.discoverPois, discoverInterestPoints)
    // .addNode(TripPlannerNodeNames.planRoutes, planRoutes)
    .addNode(TripPlannerNodeNames.searchAccommodation, searchAccommodation)
    // Add edges for sequential execution
    .addEdge(START, TripPlannerNodeNames.validateInput)
    .addEdge(TripPlannerNodeNames.validateInput, TripPlannerNodeNames.geocodeLocations)
    .addEdge(TripPlannerNodeNames.geocodeLocations, TripPlannerNodeNames.discoverPois)
    .addEdge(TripPlannerNodeNames.discoverPois, TripPlannerNodeNames.searchAccommodation)
    // .addEdge(TripPlannerNodeNames.discoverPois, TripPlannerNodeNames.planRoutes)
    // .addEdge(TripPlannerNodeNames.planRoutes, TripPlannerNodeNames.searchAccommodation)
    .addEdge(TripPlannerNodeNames.searchAccommodation, END);

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
    endTime: undefined,
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
