"use client";

import { useState } from "react";
import { TripPlannerForm } from "@/components/forms/TripPlannerForm";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import type { POI, DaySchedule, RouteData, AirbnbListing } from "@/lib/types";

interface FormInputs {
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
}

interface Results {
  formInputs: FormInputs;
  pointsOfInterest: POI[];
  dailyItinerary: DaySchedule[];
  routeInformation: RouteData;
  airbnbRecommendations: AirbnbListing[];
}

export default function PlanPage() {
  const [results, setResults] = useState<Results | null>(null);

  const handlePlanTrip = (
    formInputs: FormInputs,
    data: {
      pointsOfInterest: POI[];
      dailyItinerary: DaySchedule[];
      routeInformation: RouteData;
      airbnbRecommendations: AirbnbListing[];
    },
  ) => {
    setResults({
      formInputs,
      ...data,
    });
  };

  if (results) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setResults(null)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Planning
        </button>

        <ResultsContainer
          destination={results.formInputs.destination}
          startDate={results.formInputs.startDate}
          endDate={results.formInputs.endDate}
          budgetUsd={results.formInputs.budgetUsd}
          pointsOfInterest={results.pointsOfInterest}
          dailyItinerary={results.dailyItinerary}
          routeInformation={results.routeInformation}
          airbnbRecommendations={results.airbnbRecommendations}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <TripPlannerForm onPlanTrip={handlePlanTrip} />
      </div>
    </div>
  );
}
