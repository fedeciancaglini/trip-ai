import { Button } from "@/components/ui/button";
import { TripsListContainer } from "@/components/saved-trips/TripsListContainer";
import Link from "next/link";

export default function SavedTripsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My trips</h1>
        <Button asChild>
          <Link href="/">Plan new trip</Link>
        </Button>
      </div>

      <TripsListContainer />
    </div>
  );
}


