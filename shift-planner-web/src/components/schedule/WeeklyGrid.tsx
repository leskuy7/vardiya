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
import { Box, Button, Center, Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { ShiftCard } from "./ShiftCard";
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
      <Center h={260}>
        <Loader size="md" />
      </Center>
    );
  }

  if (!schedule || schedule.employees.length === 0) {
    return (
      <Paper withBorder p="xl" radius="lg">
        <Center h={180}>
          <Text size="sm" c="dimmed">Bu hafta için program bulunamadı.</Text>
        </Center>
      </Paper>
    );
  }

  const findCellIdByShiftId = (shiftId: string): string | null => {
    for (const employeeRow of schedule.employees) {
      const days = Array.isArray(employeeRow.days) ? employeeRow.days : [];
      for (const daySchedule of days) {
        if (Array.isArray(daySchedule.shifts) && daySchedule.shifts.some((shift) => shift?.id === shiftId)) {
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
      <Box style={{ overflowX: "auto" }}>
        <Box
          style={{
            minWidth: 980,
            display: "grid",
            gridTemplateColumns: "220px repeat(7, 1fr)",
            border: "1px solid var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-lg)",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.1)",
          }}
          className="bg-white dark:bg-[#0c121c]/60"
        >
          {/* Header row */}
          <Box
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--mantine-color-default-border)",
              borderRight: "1px solid var(--mantine-color-default-border)",
            }}
            className="bg-gray-50 dark:bg-[#0f172a]/75"
          >
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.12em" }}>
              Çalışan
            </Text>
          </Box>
          {weekDays.map((day, i) => {
            const d = parseISO(day);
            const isToday = day === format(new Date(), "yyyy-MM-dd");
            return (
              <Box
                key={day}
                style={{
                  padding: "10px 8px",
                  borderBottom: "1px solid var(--mantine-color-default-border)",
                  borderRight: "1px solid var(--mantine-color-default-border)",
                  textAlign: "center",
                }}
                className={isToday ? "bg-blue-50/50 dark:bg-blue-500/10" : "bg-gray-50 dark:bg-[#0f172a]/60"}
              >
                <Text size="10px" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: "0.1em" }}>
                  {DAY_NAMES[i]}
                </Text>
                <Text size="lg" fw={700} c={isToday ? "blue" : undefined}>
                  {d.getDate()}
                </Text>
              </Box>
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
        </Box>
      </Box>
    </DndContext >
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
  const days = Array.isArray(empRow.days) ? empRow.days : [];
  const totalHours = days
    .flatMap((d) => (Array.isArray(d.shifts) ? d.shifts : []))
    .reduce((sum, s) => {
      const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
      return sum + duration;
    }, 0);

  return (
    <>
      {/* Employee label cell */}
      <Box
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--mantine-color-default-border)",
          borderRight: "1px solid var(--mantine-color-default-border)",
        }}
        className="bg-gray-50 dark:bg-[#0c121c]/70"
      >
        <Group gap="sm" align="center">
          <Paper
            radius="xl"
            p={0}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.08))",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <Text size="sm" fw={700} c="blue">
              {empRow.employee?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </Paper>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={600} truncate>
              {empRow.employee?.user?.name || "Bilinmiyor"}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {empRow.employee?.position ?? empRow.employee?.department ?? ""}
            </Text>
          </Box>
        </Group>
        <Text size="xs" c="dimmed" mt={6} fw={600}>
          {totalHours.toFixed(1)} saat
        </Text>
      </Box>

      {/* Day cells */}
      {days.map((daySchedule) => {
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
            <Box
              id={cellId}
              style={{
                borderBottom: "1px solid var(--mantine-color-default-border)",
                borderRight: "1px solid var(--mantine-color-default-border)",
                minHeight: 110,
                padding: 8,
                transition: "background 120ms ease",
              }}
              className={daySchedule.hasConflict ? "bg-red-50 dark:bg-red-500/15" : "bg-white dark:bg-[#0c121c]/55"}
            >
              <Stack gap={6}>
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

                {canManage && (
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => onAddShift(empRow.employee?.id || "", daySchedule.date)}
                  >
                    Ekle
                  </Button>
                )}
              </Stack>
            </Box>
          </SortableContext>
        );
      })}
    </>
  );
}
