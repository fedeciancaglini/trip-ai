"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SavedTrip } from "@/lib/types";
import { Calendar, MapPin, DollarSign, Trash2 } from "lucide-react";
import { useState } from "react";

interface TripCardProps {
  trip: SavedTrip;
  onDelete?: (tripId: string) => void;
}

export function TripCard({ trip, onDelete }: TripCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || !confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(trip.id);
      }
    } catch (error) {
      console.error("Failed to delete trip:", error);
    } finally {
      setDeleting(false);
    }
  };

  const numDays = Math.ceil(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold">{trip.destination}</h3>
          {trip.isFavorite && <Badge className="bg-yellow-500">★ Favorite</Badge>}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {trip.startDate} to {trip.endDate}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{numDays} days</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Budget: ${trip.budgetUsd}</span>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-between">
          <div className="text-xs text-gray-500">
            Saved {new Date(trip.createdAt).toLocaleDateString()}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/trips/${trip.id}`;
              }}
            >
              View
            </Button>

            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
