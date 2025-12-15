"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { POI } from "@/lib/types";

interface InteractiveMapProps {
  pois: POI[];
  destination: string;
}

export function InteractiveMap({ pois, destination }: InteractiveMapProps) {
  const mapEmbedUrl = useMemo(() => {
    if (!pois || pois.length === 0) return null;

    // Create a simple Google Maps embed URL with markers
    const firstPoi = pois[0];
    const markers = pois
      .map((poi) => `markers=${poi.lat},${poi.lng}`)
      .join("&");

    return `https://maps.google.com/maps?q=${encodeURIComponent(
      destination,
    )}&z=13&output=embed&${markers}`;
  }, [pois, destination]);

  if (!mapEmbedUrl) {
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
        <iframe
          width="100%"
          height="400"
          frameBorder="0"
          src={mapEmbedUrl}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Trip route map"
        />
      </Card>

      {/* POI legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {pois.slice(0, 12).map((poi, idx) => (
          <div
            key={idx}
            className="text-sm p-2 bg-gray-50 rounded border border-gray-200"
          >
            <p className="font-medium text-gray-900">{idx + 1}. {poi.name}</p>
            <p className="text-xs text-gray-500">{poi.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
