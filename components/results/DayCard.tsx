"use client";

import { Card } from "@/components/ui/card";
import { TimelineItem } from "./TimelineItem";
import type { DaySchedule } from "@/lib/types";
import { Calendar } from "lucide-react";

interface DayCardProps {
  day: DaySchedule;
}

export function DayCard({ day }: DayCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
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

      <div className="space-y-2">
        {day.pois.map((poi, idx) => (
          <TimelineItem key={`${day.day}-${idx}`} poi={poi} isFirst={idx === 0} />
        ))}
      </div>
    </Card>
  );
}
