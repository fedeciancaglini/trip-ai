"use client";

import { DayCard } from "./DayCard";
import type { DaySchedule, RouteData, DayRoutePolylines } from "@/lib/types";
import { Map, Clock, Navigation } from "lucide-react";

interface ItinerarySectionProps {
  dailyItinerary: DaySchedule[];
  routeInfo: RouteData;
  routePolylines?: DayRoutePolylines[];
}

export function ItinerarySection({
  dailyItinerary,
  routeInfo,
  routePolylines,
}: ItinerarySectionProps) {
  const totalPois = dailyItinerary.reduce((sum, day) => sum + day.pois.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Itinerary</h2>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Map className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Total Distance</span>
            </div>
            <p className="text-xl font-bold text-blue-900">
              {routeInfo.totalDistance}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Total Time</span>
            </div>
            <p className="text-xl font-bold text-green-900">
              {routeInfo.totalDuration}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Locations</span>
            </div>
            <p className="text-xl font-bold text-purple-900">{totalPois}</p>
          </div>
        </div>
      </div>

      {/* Daily cards */}
      <div className="space-y-4">
        {dailyItinerary.map((day) => {
          const dayPolylines = routePolylines?.find((rp) => rp.day === day.day);
          return (
            <DayCard key={day.day} day={day} routePolylines={dayPolylines} />
          );
        })}
      </div>
    </div>
  );
}
