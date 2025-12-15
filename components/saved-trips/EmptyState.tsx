"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="bg-blue-100 rounded-full p-4">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">No trips yet</h2>
      <p className="text-gray-600 mb-6">
        Start planning your next adventure by creating a new trip.
      </p>

      <Button onClick={() => (window.location.href = "/")} size="lg">
        Plan Your First Trip
      </Button>
    </Card>
  );
}
