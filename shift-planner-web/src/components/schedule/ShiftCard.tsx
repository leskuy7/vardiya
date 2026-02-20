"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Trash2, CheckCircle } from "lucide-react";
import { cn, formatTime, getShiftDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/types";

interface ShiftCardProps {
  shift: Shift;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
  onAcknowledge?: (shift: Shift) => void;
  canManage?: boolean;
  isEmployee?: boolean;
  isDraggable?: boolean;
}

const statusConfig = {
  DRAFT: { label: "Taslak", variant: "secondary" as const },
  PUBLISHED: { label: "Yayında", variant: "success" as const },
  ACKNOWLEDGED: { label: "Onaylandı", variant: "info" as const },
  CANCELLED: { label: "İptal", variant: "destructive" as const },
};

export function ShiftCard({
  shift,
  onEdit,
  onDelete,
  onAcknowledge,
  canManage,
  isEmployee,
  isDraggable,
}: ShiftCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: shift.id,
      disabled: !isDraggable || !canManage,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const duration = getShiftDuration(shift.startTime, shift.endTime);
  const status = statusConfig[shift.status] ?? statusConfig.DRAFT;
  const isOvernight = duration > 12;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable && canManage ? { ...attributes, ...listeners } : {})}
      className={cn(
        "group relative rounded-lg border bg-card p-2.5 text-xs shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isDraggable && canManage && "cursor-grab active:cursor-grabbing",
        shift.status === "CANCELLED" && "opacity-60"
      )}
    >
      {/* Time row */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-foreground">
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
          {isOvernight && " 🌙"}
        </span>
        <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
          {status.label}
        </Badge>
      </div>

      {/* Hours */}
      <p className="mt-0.5 text-muted-foreground">
        {duration.toFixed(1)} saat
        {shift.note && ` · ${shift.note}`}
      </p>

      {/* Actions - visible on hover */}
      <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
        {canManage && onEdit && (
          <button
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
            title="Düzenle"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        )}
        {canManage && onDelete && (
          <button
            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(shift); }}
            title="Sil"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
        {isEmployee && shift.status === "PUBLISHED" && onAcknowledge && (
          <button
            className="rounded p-0.5 text-muted-foreground hover:bg-green-50 hover:text-green-600"
            onClick={(e) => { e.stopPropagation(); onAcknowledge(shift); }}
            title="Onayla"
          >
            <CheckCircle className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
