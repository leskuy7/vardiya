"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { IconPencil, IconTrash, IconCircleCheck } from "@tabler/icons-react";
import { formatTime, getShiftDuration } from "@/lib/utils";
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

const statusConfig: Record<string, { label: string; color: string; border: string }> = {
  DRAFT: { label: "Taslak", color: "gray", border: "var(--mantine-color-gray-6)" },
  PUBLISHED: { label: "Yayinda", color: "teal", border: "var(--mantine-color-teal-6)" },
  ACKNOWLEDGED: { label: "Onaylandi", color: "blue", border: "var(--mantine-color-blue-6)" },
  CANCELLED: { label: "Iptal", color: "red", border: "var(--mantine-color-red-6)" },
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
    <Paper
      ref={setNodeRef}
      style={{
        ...style,
        borderLeftWidth: 3,
        borderLeftStyle: "solid",
        borderLeftColor: status.border,
        opacity: isDragging ? 0.6 : shift.status === "CANCELLED" ? 0.55 : 1,
        textDecoration: shift.status === "CANCELLED" ? "line-through" : "none",
        cursor: isDraggable && canManage ? "grab" : "default",
      }}
      {...(isDraggable && canManage ? { ...attributes, ...listeners } : {})}
      p="sm"
      radius="md"
      withBorder
    >
      <Stack gap={4}>
        <Group justify="space-between" gap={6}>
          <Text size="xs" fw={700} style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}{isOvernight ? " \uD83C\uDF19" : ""}
          </Text>
          <Badge size="xs" color={status.color} variant="light">
            {status.label}
          </Badge>
        </Group>

        <Text size="xs" c="dimmed">
          {duration.toFixed(1)} saat
          {shift.note ? ` · ${shift.note}` : ""}
        </Text>

        {(canManage || (isEmployee && shift.status === "PUBLISHED")) && (
          <Group gap={6} justify="flex-end" mt={4}>
            {canManage && onEdit && (
              <ActionIcon size="sm" variant="subtle" color="blue" onClick={(e) => { e.stopPropagation(); onEdit(shift); }}>
                <IconPencil size={14} />
              </ActionIcon>
            )}
            {canManage && onDelete && (
              <ActionIcon size="sm" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onDelete(shift); }}>
                <IconTrash size={14} />
              </ActionIcon>
            )}
            {isEmployee && shift.status === "PUBLISHED" && onAcknowledge && (
              <ActionIcon size="sm" variant="light" color="teal" onClick={(e) => { e.stopPropagation(); onAcknowledge(shift); }}>
                <IconCircleCheck size={14} />
              </ActionIcon>
            )}
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
