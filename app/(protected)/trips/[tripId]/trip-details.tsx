"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { SavedTrip } from "@/lib/types";

export function TripDetails() {
  const params = useParams();
  const tripId = params.tripId as string;
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/trips/${tripId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || "Failed to load trip");
          return;
        }

        setTrip(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border border-red-200 p-6">
          <p className="text-red-700 font-semibold">Error loading trip</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-gray-50 border border-gray-200 p-6">
          <p className="text-gray-700 font-semibold">Trip not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ResultsContainer
        destination={trip.destination}
        origin={trip.origin}
        startDate={trip.startDate}
        endDate={trip.endDate}
        budgetUsd={trip.budgetUsd}
        pointsOfInterest={trip.pointsOfInterest}
        dailyItinerary={trip.dailyItinerary}
        routeInformation={trip.routeInformation}
        airbnbRecommendations={trip.airbnbRecommendations}
        isAlreadySaved={true}
      />
    </div>
  );
}
