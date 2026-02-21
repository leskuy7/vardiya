"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiftCard } from "./ShiftCard";
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

  const findCellIdByShiftId = (shiftId: string): string | null => {
    for (const employeeRow of schedule.employees) {
      for (const daySchedule of employeeRow.days) {
        if (daySchedule.shifts?.some((shift) => shift?.id === shiftId)) {
          return `cell-${employeeRow.employee?.id}-${daySchedule.date}`;
        }
      }
    }

    return null;
  };

  const parseCellId = (cellId: string): { employeeId: string; date: string } | null => {
    if (!cellId.startsWith("cell-") || cellId.length <= 16) {
      return null;
    }

    const date = cellId.slice(-10);
    const employeeId = cellId.slice(5, -11);

    if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return null;
    }

    return { employeeId, date };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    const targetCellId = overId.startsWith("cell-") ? overId : findCellIdByShiftId(overId);
    if (!targetCellId) return;

    const parsed = parseCellId(targetCellId);
    if (!parsed) return;

    onMoveShift(String(active.id), parsed.employeeId, parsed.date);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto print:overflow-visible">
        <div
          className="grid min-w-[900px] rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5"
          style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}
        >
          {/* Header row */}
          <div className="border-b border-border/40 border-r bg-muted/30 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider backdrop-blur-md">
            Çalışan
          </div>
          {weekDays.map((day, i) => {
            const d = parseISO(day);
            const isToday = day === format(new Date(), "yyyy-MM-dd");
            return (
              <div
                key={day}
                className={cn(
                  "border-b border-r border-border/40 last:border-r-0 px-2 py-3 text-center text-xs font-medium transition-colors",
                  isToday ? "bg-primary/10 text-primary shadow-[inset_0_-2px_0_var(--color-primary)]" : "bg-muted/30 text-muted-foreground hover:bg-muted/40"
                )}
              >
                <div className="text-[11px] uppercase tracking-wider">{DAY_NAMES[i]}</div>
                <div className={cn("text-lg font-bold mt-0.5", isToday && "text-primary")}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}

          {/* Employee rows */}
          {schedule.employees.map((empRow, idx) => (
            <EmployeeRow
              key={empRow.employee?.id || idx}
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
      <div className="border-b border-border/40 border-r bg-card/40 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary shadow-[0_0_10px_-2px_var(--color-primary)] text-xs font-bold">
            {empRow.employee?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate">{empRow.employee?.user?.name || "Bilinmiyor"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {empRow.employee?.position ?? empRow.employee?.department ?? ""}
            </p>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground font-medium">{totalHours.toFixed(1)} saat</p>
      </div>

      {/* Day cells */}
      {empRow.days?.map((daySchedule) => {
        const cellId = `cell-${empRow.employee?.id}-${daySchedule.date}`;
        // Filter out any null/undefined shifts that might come from the API
        const shifts = Array.isArray(daySchedule.shifts) ? daySchedule.shifts.filter(Boolean) : [];

        return (
          <SortableContext
            key={daySchedule.date}
            id={cellId}
            items={shifts.map((s) => s?.id || Math.random().toString())}
            strategy={rectSortingStrategy}
          >
            <div
              id={cellId}
              className={cn(
                "group/cell border-b border-r border-border/40 last:border-r-0 min-h-[100px] p-2 space-y-2 transition-colors",
                daySchedule.hasConflict ? "bg-destructive/10" : "hover:bg-muted/20"
              )}
            >
              {shifts.map((shift, i) => (
                <ShiftCard
                  key={shift?.id || i}
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
                  className="hidden group-hover/cell:flex w-full items-center justify-center rounded-lg border border-dashed border-primary/40 py-2 text-[11px] text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/10 transition-all hover:shadow-[0_0_10px_-2px_var(--color-primary)]"
                  onClick={() => onAddShift(empRow.employee?.id || "", daySchedule.date)}
                >
                  <Plus className="h-4 w-4 mr-0.5" />
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
