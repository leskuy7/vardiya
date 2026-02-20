"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMonday, getWeekDates, formatDate } from "@/lib/utils";

interface WeekPickerProps {
  currentMonday: string; // YYYY-MM-DD
  onChange: (monday: string) => void;
}

export function WeekPicker({ currentMonday, onChange }: WeekPickerProps) {
  const days = getWeekDates(currentMonday);
  const start = days[0];
  const end = days[6];

  const goToToday = () => onChange(getMonday(new Date()));

  const prevWeek = () => {
    const d = new Date(currentMonday + "T12:00:00Z");
    d.setDate(d.getDate() - 7);
    onChange(d.toISOString().split("T")[0]);
  };

  const nextWeek = () => {
    const d = new Date(currentMonday + "T12:00:00Z");
    d.setDate(d.getDate() + 7);
    onChange(d.toISOString().split("T")[0]);
  };

  const startLabel = new Date(start + "T00:00:00+03:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });
  const endLabel = new Date(end + "T00:00:00+03:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={prevWeek} aria-label="Önceki hafta" className="h-9 w-9">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[220px] text-center">
        <span className="text-sm font-semibold tracking-tight">
          {startLabel} – {endLabel}
        </span>
      </div>
      <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Sonraki hafta" className="h-9 w-9">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="sm" onClick={goToToday} className="ml-1">
        Bugün
      </Button>
    </div>
  );
}
