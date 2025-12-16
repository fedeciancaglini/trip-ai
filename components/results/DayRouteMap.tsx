"use client";

import { useMemo, useEffect, useState } from "react";
import { Icon } from "leaflet";
import type { DaySchedule, DayRoutePolylines } from "@/lib/types";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

interface DayRouteMapProps {
  day: DaySchedule;
  routePolylines?: DayRoutePolylines;
}

export default function DayRouteMap({ day, routePolylines }: DayRouteMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const pois = day.pois;

  if (!pois || pois.length === 0) {
    return (
      <div style={{ height: 400, width: "100%", background: "#f0f0f0" }} className="flex items-center justify-center">
        <p className="text-gray-600">No POIs for this day</p>
      </div>
    );
  }

  const center: [number, number] = [pois[0].lat, pois[0].lng];

  const poiIcon = useMemo(
    () =>
      new Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    [],
  );

  // Create polyline connecting all POIs in order
  const routeCoordinates: [number, number][] = pois.map((poi) => [poi.lat, poi.lng]);

  if (!isClient) {
    return <div style={{ height: 400, width: "100%", background: "#f0f0f0" }} />;
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: 400, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route polylines from Google Maps API */}
      {routePolylines?.polylines && routePolylines.polylines.length > 0 ? (
        routePolylines.polylines.map((polyline, idx) => (
          <Polyline
            key={`route-${idx}`}
            positions={polyline.points.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: "#3b82f6",
              weight: 3,
              opacity: 0.8,
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{polyline.startLocation} → {polyline.endLocation}</div>
                <div>{polyline.distance}</div>
                <div>{polyline.duration}</div>
              </div>
            </Popup>
          </Polyline>
        ))
      ) : (
        // Fallback to straight line if no polylines available
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: "#9ca3af",
            weight: 2,
            opacity: 0.5,
            dashArray: "5, 5",
          }}
        />
      )}

      {/* POI markers with order numbers */}
      {pois.map((poi, idx) => (
        <Marker key={`poi-${idx}`} position={[poi.lat, poi.lng]} icon={poiIcon}>
          <Popup>
            <div className="space-y-2 max-w-xs">
              <div className="font-semibold text-sm">
                <span className="inline-block bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                  {idx + 1}
                </span>
                {poi.name}
              </div>
              <div className="text-xs text-gray-600">{poi.category}</div>
              <div className="text-xs text-gray-600">{poi.description}</div>
              <div className="text-xs font-medium text-gray-700">
                {poi.timeWindow}
              </div>
              {poi.travelTimeFromPrevious > 0 && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  ⏱️ {poi.travelTimeFromPrevious} min from previous
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
