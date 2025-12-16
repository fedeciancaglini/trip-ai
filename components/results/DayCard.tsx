"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { TimelineItem } from "./TimelineItem";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { DaySchedule, DayRoutePolylines } from "@/lib/types";
import { Calendar, Map } from "lucide-react";

const DayRouteMap = dynamic(() => import("./DayRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

interface DayCardProps {
  day: DaySchedule;
  routePolylines?: DayRoutePolylines;
}

export function DayCard({ day, routePolylines }: DayCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-3">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Day {day.day}</h3>
            <p className="text-sm text-gray-600">{day.date}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-gray-700">
              {day.totalDuration}
            </p>
            <p className="text-xs text-gray-500">
              {day.pois.length} locations
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-2 border-t">
        {day.pois.map((poi, idx) => (
          <TimelineItem key={`${day.day}-${idx}`} poi={poi} isLast={idx === day.pois.length - 1} />
        ))}
      </div>

      <Accordion type="single" collapsible className="border-none">
        <AccordionItem value={`day-${day.day}`} className="border-none">
          <AccordionTrigger className="px-6 py-4 border-t hover:bg-gray-50">
            <div className="flex items-center gap-2 text-left">
              <Map className="w-4 h-4 text-blue-600" />
              <span className="font-medium">View Route</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 py-0 border-t">
            <div className="p-6">
              <DayRouteMap day={day} routePolylines={routePolylines} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
