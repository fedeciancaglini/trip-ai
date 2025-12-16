/**
 * LangGraph Agent for Trip Planning
 * Orchestrates the multi-step workflow for generating complete trip plans
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { TripPlannerStateAnnotation, type TripPlannerState } from "./types";
import { validateInput } from "./nodes/input-validation";
import { geocodeLocations } from "./nodes/geocoding";
import { determineTransportationMode } from "./nodes/transportation-mode";
import { discoverInterestPoints } from "./nodes/interest-points";
import { planRoutes } from "./nodes/route-planning";
import { searchAccommodation } from "./nodes/accommodation";

// Trip planner node names
const TripPlannerNodeNames = {
  validateInput: "validate_input",
  geocodeLocations: "geocode_locations",
  determineTransportationMode: "determine_transportation_mode",
  discoverPois: "discover_pois",
  planRoutes: "plan_routes",
  searchAccommodation: "search_accommodation",
} as const;

/**
 * Routing function to determine if transportation mode node should run
 * Returns the next node based on whether both coordinates are available
 */
function routeAfterGeocoding(state: TripPlannerState): string {
  // If both origin and destination coordinates exist, determine transportation mode
  if (state.originCoordinates && state.destinationCoordinates) {
    return TripPlannerNodeNames.determineTransportationMode;
  }
  // Otherwise, skip to END
  return END;
}

/**
 * Create and compile the trip planner graph
 * This is done once at startup and reused for multiple invocations
 */
function createTripPlannerGraph() {
  const workflow = new StateGraph(TripPlannerStateAnnotation)
    // Add nodes
    .addNode(TripPlannerNodeNames.validateInput, validateInput)
    .addNode(TripPlannerNodeNames.geocodeLocations, geocodeLocations)
    .addNode(
      TripPlannerNodeNames.determineTransportationMode,
      determineTransportationMode
    )
    .addNode(TripPlannerNodeNames.discoverPois, discoverInterestPoints)
    .addNode(TripPlannerNodeNames.searchAccommodation, searchAccommodation)
    // Add edges: start with validation
    .addEdge(START, TripPlannerNodeNames.validateInput)
    // After validation, run all three nodes in parallel
    .addEdge(
      TripPlannerNodeNames.validateInput,
      TripPlannerNodeNames.geocodeLocations
    )
    .addEdge(
      TripPlannerNodeNames.validateInput,
      TripPlannerNodeNames.discoverPois
    )
    .addEdge(
      TripPlannerNodeNames.validateInput,
      TripPlannerNodeNames.searchAccommodation
    )
    // Conditional edge from geocodeLocations: determine transportation mode if both coordinates exist
    .addConditionalEdges(
      TripPlannerNodeNames.geocodeLocations,
      routeAfterGeocoding,
      {
        [TripPlannerNodeNames.determineTransportationMode]:
          TripPlannerNodeNames.determineTransportationMode,
        [END]: END,
      }
    )
    // After transportation mode determination, continue to END
    .addEdge(TripPlannerNodeNames.determineTransportationMode, END)
    // Other parallel nodes complete and merge at END
    .addEdge(TripPlannerNodeNames.discoverPois, END)
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
  timeout?: number
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
