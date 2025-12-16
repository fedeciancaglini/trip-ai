"use client";

import { useMemo, useEffect, useState } from "react";
import { Icon } from "leaflet";
import type { POI } from "@/lib/types";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

interface LeafletMapProps {
  pois: POI[];
}

export default function LeafletMap({ pois }: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const center: [number, number] = [pois[0].lat, pois[0].lng];

  const defaultIcon = useMemo(
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

  if (!isClient) {
    return <div style={{ height: 400, width: "100%", background: "#f0f0f0" }} />;
  }

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: 400, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pois.map((poi, idx) => (
        <Marker key={idx} position={[poi.lat, poi.lng]} icon={defaultIcon}>
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{poi.name}</div>
              <div className="text-xs text-gray-600">{poi.category}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


