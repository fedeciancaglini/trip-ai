import { Button } from "@/components/ui/button";
import { TripsListContainer } from "@/components/saved-trips/TripsListContainer";

export default function SavedTripsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Trips</h1>
        <Button onClick={() => (window.location.href = "/protected/plan")}>
          Plan New Trip
        </Button>
      </div>

      <TripsListContainer />
    </div>
  );
}
