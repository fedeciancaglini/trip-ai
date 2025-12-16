 "use client";

import { useState } from "react";
import { TripPlannerForm } from "@/components/forms/TripPlannerForm";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import type { POI, DaySchedule, RouteData, AirbnbListing, DayRoutePolylines } from "@/lib/types";
import { mockResultsData } from "@/lib/mockTripData";

interface FormInputs {
  destination: string;
  origin?: string;
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
  routePolylines?: DayRoutePolylines[];
}

export default function PlanPage() {
  const [results, setResults] = useState<Results | null>(null);
  // const [results, setResults] = useState<Results | null>({
  //   formInputs: {
  //     destination: "Pilar Buenos Aires",
  //     origin: "Bariloche",
  //     startDate: "2026-01-02T00:00:00.000Z",
  //     endDate: "2026-01-16T00:00:00.000Z",
  //     budgetUsd: 1000,
  //   },
  //   pointsOfInterest: mockResultsData?.pointsOfInterest ?? [],
  //   dailyItinerary: mockResultsData?.dailyItinerary ?? [],
  //   routeInformation:
  //     mockResultsData?.routeInformation ?? {
  //       totalDistance: "",
  //       totalDuration: "",
  //       routes: [],
  //     },
  //   airbnbRecommendations: mockResultsData?.airbnbRecommendations ?? [],
  // });

  const handlePlanTrip = (
    formInputs: FormInputs,
    data: {
      pointsOfInterest: POI[];
      dailyItinerary: DaySchedule[];
      routeInformation: RouteData;
      airbnbRecommendations: AirbnbListing[];
      routePolylines?: DayRoutePolylines[];
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
          ← Back to planning
        </button>

        <ResultsContainer
          destination={results.formInputs.destination}
          origin={results.formInputs.origin}
          startDate={results.formInputs.startDate}
          endDate={results.formInputs.endDate}
          budgetUsd={results.formInputs.budgetUsd}
          pointsOfInterest={results.pointsOfInterest}
          dailyItinerary={results.dailyItinerary}
          routeInformation={results.routeInformation}
          airbnbRecommendations={results.airbnbRecommendations}
          routePolylines={results.routePolylines}
        />
      </div>
    );
  }

  return (
    <div>
      <TripPlannerForm onPlanTrip={handlePlanTrip} />
    </div>
  );
}


