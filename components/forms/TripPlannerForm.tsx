"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PlanTripResponse } from "@/lib/types";

interface TripFormState {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  loading: boolean;
  errors: Record<string, string>;
  submitted: boolean;
}

interface TripPlannerFormProps {
  onPlanTrip: (
    formInputs: {
      destination: string;
      origin?: string;
      startDate: string;
      endDate: string;
      budgetUsd: number;
    },
    data: {
      pointsOfInterest: any;
      dailyItinerary: any;
      routeInformation: any;
      airbnbRecommendations: any;
    },
  ) => void;
}

export function TripPlannerForm({ onPlanTrip }: TripPlannerFormProps) {
  const [state, setState] = useState<TripFormState>({
    destination: "",
    origin: "",
    startDate: "",
    endDate: "",
    budgetUsd: 0,
    loading: false,
    errors: {},
    submitted: false,
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!state.destination.trim()) {
      errors.destination = "Destination is required";
    }

    if (!state.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!state.endDate) {
      errors.endDate = "End date is required";
    }

    if (state.startDate && state.endDate) {
      if (new Date(state.startDate) > new Date(state.endDate)) {
        errors.dates = "Start date must be before end date";
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(state.startDate) < today) {
        errors.startDate = "Start date must be in the future";
      }
    }

    if (state.budgetUsd <= 0) {
      errors.budgetUsd = "Budget must be greater than 0";
    }

    setState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, submitted: true }));

    try {
      const response = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: state.destination,
          origin: state.origin || undefined,
          startDate: state.startDate,
          endDate: state.endDate,
          budgetUsd: Number(state.budgetUsd),
        }),
      });

      const data = (await response.json()) as PlanTripResponse;

      if (!response.ok || !data.success) {
        setState((prev) => ({
          ...prev,
          errors: { submit: data.error || "Failed to plan trip" },
          loading: false,
        }));
        return;
      }

      if (data.data) {
        onPlanTrip(
          {
            destination: state.destination,
            origin: state.origin || undefined,
            startDate: state.startDate,
            endDate: state.endDate,
            budgetUsd: state.budgetUsd,
          },
          data.data,
        );
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errors: {
          submit: error instanceof Error ? error.message : "An error occurred",
        },
        loading: false,
      }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Plan Your Trip</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium mb-2">
            Destination
          </label>
          <Input
            id="destination"
            type="text"
            placeholder="e.g., Paris, France"
            value={state.destination}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                destination: e.target.value,
              }))
            }
            disabled={state.loading}
          />
          {state.errors.destination && (
            <p className="text-red-500 text-sm mt-1">{state.errors.destination}</p>
          )}
        </div>

        {/* Origin */}
        <div>
          <label htmlFor="origin" className="block text-sm font-medium mb-2">
            Origin (optional)
          </label>
          <Input
            id="origin"
            type="text"
            placeholder="e.g., New York, USA"
            value={state.origin}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                origin: e.target.value,
              }))
            }
            disabled={state.loading}
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Start date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between font-normal",
                  !state.startDate && "text-muted-foreground",
                )}
                disabled={state.loading}
              >
                <span>
                  {state.startDate
                    ? format(new Date(state.startDate), "PPP")
                    : "Select start date"}
                </span>
                <CalendarIcon className="h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={state.startDate ? new Date(state.startDate) : undefined}
                onSelect={(date) => {
                  setState((prev) => ({
                    ...prev,
                    startDate: date ? format(date, "yyyy-MM-dd") : "",
                  }));
                }}
              />
            </PopoverContent>
          </Popover>
          {state.errors.startDate && (
            <p className="text-red-500 text-sm mt-1">{state.errors.startDate}</p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium mb-2">
            End date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between font-normal",
                  !state.endDate && "text-muted-foreground",
                )}
                disabled={state.loading}
              >
                <span>
                  {state.endDate
                    ? format(new Date(state.endDate), "PPP")
                    : "Select end date"}
                </span>
                <CalendarIcon className="h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={state.endDate ? new Date(state.endDate) : undefined}
                onSelect={(date) => {
                  setState((prev) => ({
                    ...prev,
                    endDate: date ? format(date, "yyyy-MM-dd") : "",
                  }));
                }}
              />
            </PopoverContent>
          </Popover>
          {state.errors.endDate && (
            <p className="text-red-500 text-sm mt-1">{state.errors.endDate}</p>
          )}
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium mb-2">
            Budget (USD) - for accommodation
          </label>
          <Input
            id="budget"
            type="number"
            placeholder="1000"
            value={state.budgetUsd || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                budgetUsd: Number(e.target.value),
              }))
            }
            disabled={state.loading}
            min="1"
          />
          {state.errors.budgetUsd && (
            <p className="text-red-500 text-sm mt-1">{state.errors.budgetUsd}</p>
          )}
        </div>

        {/* Date Range Error */}
        {state.errors.dates && (
          <p className="text-red-500 text-sm">{state.errors.dates}</p>
        )}

        {/* Submit Error */}
        {state.errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">{state.errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={state.loading}
          className="w-full"
        >
          {state.loading ? "Planning your trip..." : "Plan My Trip"}
        </Button>
      </form>
    </Card>
  );
}
