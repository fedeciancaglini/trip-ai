"use client";

import { AccommodationCard } from "./AccommodationCard";
import type { AirbnbListing } from "@/lib/types";

interface AccommodationSectionProps {
  listings: AirbnbListing[];
}

export function AccommodationSection({ listings }: AccommodationSectionProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No accommodations found matching your budget.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Accommodation Options</h2>
      <p className="text-gray-600">
        {listings.length} listings found within your budget
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <AccommodationCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
