"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItinerarySection } from "./ItinerarySection";
import { InteractiveMap } from "./InteractiveMap";
import { AccommodationSection } from "./AccommodationSection";
import type {
  POI,
  DaySchedule,
  RouteData,
  AirbnbListing,
  SaveTripRequest,
} from "@/lib/types";
import { Loader2, CheckCircle } from "lucide-react";

interface ResultsContainerProps {
  destination: string;
  origin?: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  pointsOfInterest: POI[];
  dailyItinerary: DaySchedule[];
  routeInformation: RouteData;
  airbnbRecommendations: AirbnbListing[];
}

export function ResultsContainer(props: ResultsContainerProps) {
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveTrip = async () => {
    setSaveInProgress(true);
    setSaveError(null);

    try {
      const payload: SaveTripRequest = {
        destination: props.destination,
        origin: props.origin,
        startDate: props.startDate,
        endDate: props.endDate,
        budgetUsd: props.budgetUsd,
        pointsOfInterest: props.pointsOfInterest,
        dailyItinerary: props.dailyItinerary,
        routeInformation: props.routeInformation,
        airbnbRecommendations: props.airbnbRecommendations,
      };

      const response = await fetch("/api/save-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { success: boolean; error?: string };

      if (!response.ok || !data.success) {
        setSaveError(data.error || "Failed to save trip");
        return;
      }

      setSaved(true);
      setTimeout(() => {
        window.location.href = "/saved-trips";
      }, 2000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save trip",
      );
    } finally {
      setSaveInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
        <h1 className="text-3xl font-bold mb-2">Your Trip Plan</h1>
        <p className="text-gray-700">
          {props.destination} • {props.startDate} to {props.endDate}
        </p>
      </div>

      {/* Save trip button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSaveTrip}
          disabled={saveInProgress || saved}
          size="lg"
          className="gap-2"
        >
          {saveInProgress && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved && <CheckCircle className="w-4 h-4" />}
          {saved ? "Trip Saved!" : "Save Trip"}
        </Button>

        {saveError && (
          <div className="flex-1 bg-red-50 border border-red-200 rounded px-4 py-2 flex items-center">
            <p className="text-red-700 text-sm">{saveError}</p>
          </div>
        )}
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="itinerary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="accommodation">Accommodations</TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary">
          <Card className="p-6">
            <ItinerarySection
              dailyItinerary={props.dailyItinerary}
              routeInfo={props.routeInformation}
            />
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card className="p-6">
            <InteractiveMap
              pois={props.pointsOfInterest}
              destination={props.destination}
              airbnbListings={props.airbnbRecommendations}
            />
          </Card>
        </TabsContent>

        <TabsContent value="accommodation">
          <Card className="p-6">
            <AccommodationSection listings={props.airbnbRecommendations} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
