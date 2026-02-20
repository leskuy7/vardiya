"use client";

import { useState } from "react";
import { CheckCircle, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { WeekPicker } from "@/components/schedule/WeekPicker";
import { useToast } from "@/components/ui/toast";
import { useWeeklySchedule, useAcknowledgeShift } from "@/hooks/useShifts";
import { useAuth } from "@/hooks/useAuth";
import { getMonday, getWeekDates, formatTime, getShiftDuration, getDayName } from "@/lib/utils";
import type { Shift } from "@/types";

const statusLabels: Record<string, { label: string; variant: "secondary" | "success" | "info" | "destructive" }> = {
  DRAFT: { label: "Taslak", variant: "secondary" },
  PUBLISHED: { label: "Yayında", variant: "success" },
  ACKNOWLEDGED: { label: "Onaylandı", variant: "info" },
  CANCELLED: { label: "İptal", variant: "destructive" },
};

export default function MyShiftsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));

  const { data: schedule, isLoading } = useWeeklySchedule(currentMonday);
  const acknowledgeShift = useAcknowledgeShift();

  // Find the current user's employee row
  const myRow = schedule?.employees.find((e) => e.employee.user.id === user?.id || e.employee.userId === user?.id);
  const myShifts: { shift: Shift; date: string }[] =
    myRow?.days.flatMap((d) => d.shifts.map((s) => ({ shift: s, date: d.date }))) ?? [];

  const totalHours = myShifts.reduce((sum, { shift }) => sum + getShiftDuration(shift.startTime, shift.endTime), 0);

  const handleAcknowledge = async (shift: Shift) => {
    try {
      await acknowledgeShift.mutateAsync(shift.id);
      toast("success", "Vardiya onaylandı.");
    } catch {
      toast("error", "Onaylama başarısız.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Week picker + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekPicker currentMonday={currentMonday} onChange={setCurrentMonday} />
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Toplam: <strong className="text-foreground">{totalHours.toFixed(1)} saat</strong>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Vardiya Sayısı: <strong className="text-foreground">{myShifts.length}</strong>
          </span>
        </div>
      </div>

      {/* Shifts list */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : myShifts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
          <CalendarDays className="h-10 w-10 opacity-30" />
          <p>Bu hafta için vardiya bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myShifts.map(({ shift, date }) => {
            const status = statusLabels[shift.status] ?? statusLabels.DRAFT;
            const hours = getShiftDuration(shift.startTime, shift.endTime);

            return (
              <div
                key={shift.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Day */}
                  <div className="w-28 shrink-0">
                    <p className="text-xs text-muted-foreground capitalize">{getDayName(date)}</p>
                    <p className="text-sm font-semibold">
                      {new Date(date + "T00:00:00+03:00").toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-sm font-medium">
                      {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">{hours.toFixed(1)} saat</p>
                  </div>

                  {/* Note */}
                  {shift.note && (
                    <p className="hidden text-xs text-muted-foreground sm:block">{shift.note}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {shift.status === "PUBLISHED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcknowledge(shift)}
                      loading={acknowledgeShift.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Onayla
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
