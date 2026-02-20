"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { ShiftCard } from "./ShiftCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { WeeklySchedule, EmployeeSchedule, Shift } from "@/types";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface WeeklyGridProps {
  schedule: WeeklySchedule | undefined;
  isLoading: boolean;
  weekDays: string[]; // YYYY-MM-DD x7
  canManage: boolean;
  isEmployee: boolean;
  onAddShift: (employeeId: string, date: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
  onAcknowledgeShift: (shift: Shift) => void;
  onMoveShift: (shiftId: string, newEmployeeId: string, newDate: string) => void;
}

export function WeeklyGrid({
  schedule,
  isLoading,
  weekDays,
  canManage,
  isEmployee,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onAcknowledgeShift,
  onMoveShift,
}: WeeklyGridProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!schedule || schedule.employees.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Bu hafta için program bulunamadı.</p>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // over.id format: "cell-{employeeId}-{dateStr}"
    const overId = String(over.id);
    if (overId.startsWith("cell-")) {
      const [, empId, dateStr] = overId.split("-");
      onMoveShift(String(active.id), empId, dateStr);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto print:overflow-visible">
        <div
          className="grid min-w-[900px] border rounded-lg overflow-hidden"
          style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}
        >
          {/* Header row */}
          <div className="border-b border-r bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
            Çalışan
          </div>
          {weekDays.map((day, i) => {
            const d = new Date(day + "T00:00:00+03:00");
            const isToday = day === new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
            return (
              <div
                key={day}
                className={cn(
                  "border-b border-r last:border-r-0 px-2 py-2 text-center text-xs font-semibold",
                  isToday ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                <div>{DAY_NAMES[i]}</div>
                <div className={cn("text-base font-bold", isToday && "text-primary")}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}

          {/* Employee rows */}
          {schedule.employees.map((empRow) => (
            <EmployeeRow
              key={empRow.employee.id}
              empRow={empRow}
              weekDays={weekDays}
              canManage={canManage}
              isEmployee={isEmployee}
              onAddShift={onAddShift}
              onEditShift={onEditShift}
              onDeleteShift={onDeleteShift}
              onAcknowledgeShift={onAcknowledgeShift}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

interface EmployeeRowProps {
  empRow: EmployeeSchedule;
  weekDays: string[];
  canManage: boolean;
  isEmployee: boolean;
  onAddShift: (employeeId: string, date: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
  onAcknowledgeShift: (shift: Shift) => void;
}

function EmployeeRow({
  empRow,
  weekDays,
  canManage,
  isEmployee,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onAcknowledgeShift,
}: EmployeeRowProps) {
  const totalHours = empRow.days
    .flatMap((d) => d.shifts)
    .reduce((sum, s) => {
      const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
      return sum + duration;
    }, 0);

  return (
    <>
      {/* Employee label cell */}
      <div className="border-b border-r bg-card px-3 py-2">
        <p className="text-sm font-medium truncate">{empRow.employee.user.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {empRow.employee.position ?? empRow.employee.department ?? ""}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{totalHours.toFixed(1)}s</p>
      </div>

      {/* Day cells */}
      {empRow.days.map((daySchedule) => {
        const cellId = `cell-${empRow.employee.id}-${daySchedule.date}`;
        const shifts = daySchedule.shifts;

        return (
          <SortableContext
            key={daySchedule.date}
            id={cellId}
            items={shifts.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              id={cellId}
              className={cn(
                "group/cell border-b border-r last:border-r-0 min-h-[80px] p-1.5 space-y-1.5",
                daySchedule.hasConflict && "bg-red-50/50"
              )}
            >
              {shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onEdit={canManage ? onEditShift : undefined}
                  onDelete={canManage ? onDeleteShift : undefined}
                  onAcknowledge={isEmployee ? onAcknowledgeShift : undefined}
                  canManage={canManage}
                  isEmployee={isEmployee}
                  isDraggable={canManage}
                />
              ))}

              {/* Add button */}
              {canManage && (
                <button
                  className="hidden group-hover/cell:flex w-full items-center justify-center rounded border border-dashed border-primary/30 py-1 text-xs text-primary/60 hover:border-primary hover:text-primary transition-colors"
                  onClick={() => onAddShift(empRow.employee.id, daySchedule.date)}
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  Ekle
                </button>
              )}
            </div>
          </SortableContext>
        );
      })}
    </>
  );
}
