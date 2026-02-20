"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useWeeklySchedule } from "@/hooks/useShifts";
import { getMonday, getWeekDates, formatTime, getShiftDuration } from "@/lib/utils";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function PrintContent() {
  const params = useSearchParams();
  const weekParam = params.get("week") ?? getMonday(new Date());
  const weekDays = getWeekDates(weekParam);

  const { data: schedule, isLoading } = useWeeklySchedule(weekParam);

  useEffect(() => {
    if (!isLoading && schedule) {
      // Small delay for styles to render before printing
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, schedule]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const startDate = new Date(weekDays[0] + "T00:00:00+03:00");
  const endDate = new Date(weekDays[6] + "T00:00:00+03:00");

  return (
    <div className="mx-auto max-w-[1100px] p-6 font-sans text-[10pt]">
      {/* Title */}
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <h1 className="text-lg font-bold">Vardiya Programı</h1>
        <p className="text-sm text-gray-500">
          {startDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} –{" "}
          {endDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Grid */}
      <table className="w-full border-collapse text-[9pt]">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1 text-left font-semibold w-32">Çalışan</th>
            {weekDays.map((day, i) => {
              const d = new Date(day + "T00:00:00+03:00");
              return (
                <th key={day} className="border px-2 py-1 text-center font-semibold">
                  <div>{DAY_NAMES[i]}</div>
                  <div className="font-normal text-[8pt] text-gray-500">
                    {d.toLocaleDateString("tr-TR", { day: "numeric", month: "numeric" })}
                  </div>
                </th>
              );
            })}
            <th className="border px-2 py-1 text-center font-semibold w-16">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {schedule?.employees.map((empRow) => {
            const totalHours = empRow.days
              .flatMap((d) => d.shifts)
              .reduce((sum, s) => sum + getShiftDuration(s.startTime, s.endTime), 0);

            return (
              <tr key={empRow.employee.id}>
                <td className="border px-2 py-1 font-medium">
                  <div>{empRow.employee.user.name}</div>
                  {empRow.employee.position && (
                    <div className="text-[8pt] text-gray-500">{empRow.employee.position}</div>
                  )}
                </td>
                {empRow.days.map((day) => (
                  <td key={day.date} className="border px-2 py-1 align-top">
                    {day.shifts.length === 0 ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      day.shifts.map((shift) => (
                        <div key={shift.id} className="mb-0.5">
                          <div className="font-medium">
                            {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                          </div>
                          {shift.note && (
                            <div className="text-[8pt] text-gray-500">{shift.note}</div>
                          )}
                        </div>
                      ))
                    )}
                  </td>
                ))}
                <td className="border px-2 py-1 text-center font-semibold">
                  {totalHours.toFixed(1)}s
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[8pt] text-gray-400">
        <span>Vardiya Planlayıcı Sistemi</span>
        <span>Basım: {new Date().toLocaleDateString("tr-TR", { dateStyle: "long" })}</span>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
      <PrintContent />
    </Suspense>
  );
}
