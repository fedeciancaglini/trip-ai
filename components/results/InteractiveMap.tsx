"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import type { POI, AirbnbListing } from "@/lib/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

interface InteractiveMapProps {
  pois: POI[];
  destination: string;
  airbnbListings?: AirbnbListing[];
}

export function InteractiveMap({ pois, airbnbListings }: InteractiveMapProps) {
  if (!pois || pois.length === 0) {
    return (
      <Card className="w-full h-96 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Map unavailable</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Route Map</h2>

      <Card className="overflow-hidden">
        <LeafletMap pois={pois} airbnbListings={airbnbListings} />
      </Card>

      {/* POI legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {pois.slice(0, 12).map((poi, idx) => (
          <div
            key={idx}
            className="text-sm p-2 bg-gray-50 rounded border border-gray-200"
          >
            <p className="font-medium text-gray-900">
              {idx + 1}. {poi.name}
            </p>
            <p className="text-xs text-gray-500">{poi.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
