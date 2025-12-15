"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AirbnbListing } from "@/lib/types";
import { ExternalLink, Star } from "lucide-react";

interface AccommodationCardProps {
  listing: AirbnbListing;
}

export function AccommodationCard({ listing }: AccommodationCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {listing.image && (
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={listing.image}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{listing.name}</h3>
          <p className="text-sm text-gray-600">{listing.distanceToRoute}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">${listing.pricePerNight}</p>
            <p className="text-xs text-gray-500">per night</p>
          </div>

          {listing.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {listing.rating.toFixed(1)}
              </span>
              {listing.reviewCount && (
                <span className="text-xs text-gray-500">
                  ({listing.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        <a href={listing.link} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full" asChild>
            <span>
              View on Airbnb <ExternalLink className="w-4 h-4 ml-2" />
            </span>
          </Button>
        </a>
      </div>
    </Card>
  );
}
