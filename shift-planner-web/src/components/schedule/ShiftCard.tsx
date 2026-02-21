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
        "group relative rounded-xl border border-border/50 bg-card/60 backdrop-blur-md p-3 text-xs shadow-sm shadow-black/5 transition-all duration-300 hover:shadow-[0_4px_20px_-3px_var(--color-primary)] hover:-translate-y-0.5 hover:border-primary/50",
        isDragging && "opacity-60 shadow-2xl shadow-primary/20 ring-2 ring-primary scale-[1.02] z-50",
        isDraggable && canManage && "cursor-grab active:cursor-grabbing",
        shift.status === "CANCELLED" && "opacity-50 line-through"
      )}
    >
      {/* Time row */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="font-semibold text-foreground tracking-tight flex items-center gap-1">
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
          {isOvernight && " 🌙"}
        </span>
        <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 font-medium">
          {status.label}
        </Badge>
      </div>

      {/* Hours */}
      <p className="mt-1 text-muted-foreground leading-relaxed">
        {duration.toFixed(1)} saat
        {shift.note && <span className="ml-1 text-foreground/60">· {shift.note}</span>}
      </p>

      {/* Actions - visible on hover */}
      <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex backdrop-blur-md bg-card/80 p-1 rounded-lg border border-border/50 shadow-sm animate-fade-in translate-y-[-50%] translate-x-[20%]">
        {canManage && onEdit && (
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
            onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
            title="Düzenle"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
        {canManage && onDelete && (
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(shift); }}
            title="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
