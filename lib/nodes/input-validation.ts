/**
 * LangGraph Node: Input Validation
 * Validates and normalizes user input
 */

import type { TripPlannerState } from "../types";
import { ValidationError } from "../types";

/**
 * Validate user input for trip planning
 */
export async function validateInput(
  state: TripPlannerState,
): Promise<TripPlannerState> {
  const errors: string[] = [];

  // Validate destination
  if (!state.destination || state.destination.trim() === "") {
    errors.push("Destination is required");
  } else if (state.destination.length > 255) {
    errors.push("Destination must be 255 characters or less");
  }

  // Validate dates
  if (!state.startDate) {
    errors.push("Start date is required");
  }
  if (!state.endDate) {
    errors.push("End date is required");
  }

  if (state.startDate && state.endDate) {
    if (state.startDate > state.endDate) {
      errors.push("Start date must be before end date");
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (state.startDate < now) {
      errors.push("Start date must be in the future");
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (state.startDate > maxDate) {
      errors.push("Start date must be within 2 years");
    }
  }

  // Validate budget
  if (!state.budgetUsd || state.budgetUsd <= 0) {
    errors.push("Budget must be greater than 0");
  } else if (state.budgetUsd > 1000000) {
    errors.push("Budget must be less than $1,000,000");
  }

  // Calculate days
  let daysCount = 1;
  if (state.startDate && state.endDate) {
    daysCount = Math.ceil(
      (state.endDate.getTime() - state.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysCount < 1) {
      errors.push("Trip must be at least 1 day");
    }
    if (daysCount > 365) {
      errors.push("Trip must be less than 365 days");
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(`Input validation failed: ${errors.join("; ")}`);
  }

  return {
    ...state,
    daysCount,
  };
}
