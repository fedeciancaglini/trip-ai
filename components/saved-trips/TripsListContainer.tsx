"use client";

import { useState, useEffect } from "react";
import { TripCard } from "./TripCard";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { SavedTrip, SavedTripsListResponse } from "@/lib/types";

export function TripsListContainer() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 12,
    total: 0,
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async (offset: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(pagination.limit),
        offset: String(offset),
        sortBy: "created_at",
      });

      const response = await fetch(`/api/saved-trips?${params}`);
      const data = (await response.json()) as SavedTripsListResponse;

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to fetch trips");
        return;
      }

      if (data.data) {
        setTrips(data.data.trips);
        setPagination({
          offset,
          limit: pagination.limit,
          total: data.data.total,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trips");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (tripId: string) => {
    setTrips(trips.filter((t) => t.id !== tripId));
  };

  const hasMore = pagination.offset + pagination.limit < pagination.total;

  if (loading && trips.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() =>
              fetchTrips(pagination.offset + pagination.limit)
            }
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
