"use client";

import { useMemo, useEffect, useState } from "react";
import { Icon } from "leaflet";
import type { POI, AirbnbListing } from "@/lib/types";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

interface LeafletMapProps {
  pois: POI[];
  airbnbListings?: AirbnbListing[];
}

export default function LeafletMap({ pois, airbnbListings = [] }: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const airbnbIcon = useMemo(
    () =>
      new Icon({
        iconUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjZWY0NDQ0Ij48cG9seWdvbiBwb2ludHM9IjUwLDEwIDkwLDQwIDkwLDkwIDEwLDkwIDEwLDQwIi8+PHBvbHlnb24gcG9pbnRzPSI0MCw2MCA2MCw2MCA2MCw5MCA0MCw5MCIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4zIi8+PC9zdmc+",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
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
        <Marker key={`poi-${idx}`} position={[poi.lat, poi.lng]} icon={poiIcon}>
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">{poi.name}</div>
              <div className="text-xs text-gray-600">{poi.category}</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {airbnbListings.map((listing, idx) => (
        <Marker
          key={`airbnb-${idx}`}
          position={[listing.location.lat, listing.location.lng]}
          icon={airbnbIcon}
        >
          <Popup>
            <div className="space-y-2 max-w-xs">
              <div className="font-semibold">{listing.name}</div>
              <div className="text-sm text-gray-700 font-medium">Total ${listing.price}</div>
              <div className="text-xs text-gray-600">
                {listing.pricePerNight && <div>Per night: ${listing.pricePerNight}</div>}
              </div>
              {(listing.rating || listing.reviewCount) && (
                <div className="text-xs text-gray-600">
                  {listing.rating && <span>★ {listing.rating}</span>}
                  {listing.reviewCount && <span> ({listing.reviewCount} reviews)</span>}
                </div>
              )}
              <a
                href={listing.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline block"
              >
                View on Airbnb
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}


