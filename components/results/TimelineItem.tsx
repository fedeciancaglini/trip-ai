"use client";

import type { DayPOI } from "@/lib/types";
import { MapPin, Clock } from "lucide-react";

interface TimelineItemProps {
  poi: DayPOI;
  isFirst: boolean;
}

export function TimelineItem({ poi, isFirst }: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-blue-500 mt-2" />
        {!isFirst && <div className="w-0.5 h-20 bg-gray-300 mt-2" />}
      </div>

      {/* Content */}
      <div className="pb-8 flex-1">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-lg">{poi.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{poi.description}</p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{poi.timeWindow}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>
                {poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {poi.travelTimeFromPrevious > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              ⏱️ {poi.travelTimeFromPrevious} min travel time from previous
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
