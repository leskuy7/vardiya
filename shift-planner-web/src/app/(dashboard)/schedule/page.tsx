"use client";

import { useMemo, useState } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconPlus,
  IconCalendarWeek,
  IconUsers,
  IconClock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { WeeklyGrid } from "@/components/schedule/WeeklyGrid";
import { ShiftModal } from "@/components/schedule/ShiftModal";
import { CopyWeekModal } from "@/components/schedule/CopyWeekModal";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklySchedule, useDeleteShift, useAcknowledgeShift, useUpdateShift } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/components/ui/toast";
import { getMonday, getWeekDates } from "@/lib/utils";
import type { Shift } from "@/types";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export default function SchedulePage() {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const { toast } = useToast();

  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const weekDays = getWeekDates(currentMonday);

  const { data: schedule, isLoading } = useWeeklySchedule(currentMonday);
  const { data: employees = [] } = useEmployees(true);

  const deleteShift = useDeleteShift();
  const acknowledgeShift = useAcknowledgeShift();
  const updateShift = useUpdateShift();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const canManage = isAdmin || isManager;

  // Modal states
  const [shiftModal, setShiftModal] = useState<{
    open: boolean;
    shift?: Shift | null;
    prefillDate?: string;
    prefillEmployee?: string;
  }>({ open: false });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; shift?: Shift }>({
    open: false,
  });

  const [copyModal, setCopyModal] = useState(false);

  const handleAddShift = (employeeId: string, date: string) => {
    setShiftModal({ open: true, prefillDate: date, prefillEmployee: employeeId });
  };

  const handleEditShift = (shift: Shift) => {
    setShiftModal({ open: true, shift });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.shift) return;
    try {
      await deleteShift.mutateAsync(deleteDialog.shift.id);
      toast("success", "Vardiya silindi.");
    } catch {
      toast("error", "Silme işlemi başarısız.");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const handleAcknowledge = async (shift: Shift) => {
    try {
      await acknowledgeShift.mutateAsync(shift.id);
      toast("success", "Vardiya onaylandı.");
    } catch {
      toast("error", "Onaylama başarısız.");
    }
  };

  const handleMoveShift = async (shiftId: string, newEmployeeId: string, newDate: string) => {
    try {
      // Find the shift to calculate the time offset
      const allShifts =
        schedule?.employees.flatMap((e) => {
          const days = Array.isArray(e.days) ? e.days : [];
          return days.flatMap((d) => (Array.isArray(d.shifts) ? d.shifts : []));
        }) ?? [];
      const shift = allShifts.find((s) => s.id === shiftId);
      if (!shift) return;

      const origStart = new Date(shift.startTime);
      const origEnd = new Date(shift.endTime);
      const duration = origEnd.getTime() - origStart.getTime();
      const timeStr = formatInTimeZone(origStart, "Europe/Istanbul", "HH:mm");
      const newStart = fromZonedTime(
        `${newDate}T${timeStr}:00`,
        "Europe/Istanbul"
      );
      const newEnd = new Date(newStart.getTime() + duration);

      await updateShift.mutateAsync({
        id: shiftId,
        data: {
          employeeId: newEmployeeId,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        },
      });
      toast("success", "Vardiya taşındı.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Taşıma başarısız.";
      toast("error", msg);
    }
  };

  const weekLabel = useMemo(() => {
    const start = new Date(weekDays[0] + "T00:00:00+03:00");
    const end = new Date(weekDays[6] + "T00:00:00+03:00");
    const startLabel = start.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const endLabel = end.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }, [weekDays]);

  const summary = useMemo(() => {
    const employees = schedule?.employees ?? [];
    const shifts = employees.flatMap((e) => {
      const days = Array.isArray(e.days) ? e.days : [];
      return days.flatMap((d) => (Array.isArray(d.shifts) ? d.shifts : []));
    });
    const totalHours = shifts.reduce((sum, s) => {
      const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000;
      return sum + duration;
    }, 0);
    const conflicts = employees.flatMap((e) => (Array.isArray(e.days) ? e.days : [])).filter((d) => d.hasConflict).length;
    return {
      totalShifts: shifts.length,
      totalHours,
      totalEmployees: employees.length,
      conflictDays: conflicts,
    };
  }, [schedule]);

  return (
    <Stack gap="lg" style={{ height: "100%" }}>
      {/* Header */}
      <Paper
        className="no-print"
        withBorder
        p="md"
        radius="lg"
        style={{
          position: "relative",
          overflow: "hidden",
          background: isDark
            ? "linear-gradient(140deg, rgba(14, 22, 36, 0.95) 0%, rgba(12, 18, 28, 0.95) 55%, rgba(9, 15, 25, 0.95) 100%)"
            : "#fff",
          borderColor: isDark
            ? "var(--mantine-color-dark-4)"
            : "#e2e8f0",
          boxShadow: isDark
            ? "0 16px 60px rgba(0, 0, 0, 0.35)"
            : "0 16px 50px rgba(37, 99, 235, 0.08)",
        }}
      >
        <Box
          style={{
            position: "absolute",
            inset: -120,
            background:
              "radial-gradient(600px 240px at 10% 0%, rgba(59, 130, 246, 0.4), transparent 60%), radial-gradient(500px 260px at 90% 20%, rgba(244, 63, 94, 0.3), transparent 60%)",
            opacity: isDark ? 0.9 : 0.18,
          }}
        />
        <Box
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(120deg, rgba(150,150,150,0.1) 0, rgba(150,150,150,0.1) 1px, transparent 1px, transparent 12px)",
            opacity: isDark ? 0.5 : 0.2,
          }}
        />

        <Stack gap="md" style={{ position: "relative" }}>
          <Group justify="space-between" wrap="wrap">
            <Group gap={6}>
              <ActionIcon variant="default" size="lg" onClick={() => setCurrentMonday((m) => shiftWeek(m, -1))} aria-label="Önceki hafta">
                <IconChevronLeft size={16} />
              </ActionIcon>
              <Paper withBorder px="md" py={6} radius="md">
                <Text size="sm" fw={600}>{weekLabel}</Text>
              </Paper>
              <ActionIcon variant="default" size="lg" onClick={() => setCurrentMonday((m) => shiftWeek(m, 1))} aria-label="Sonraki hafta">
                <IconChevronRight size={16} />
              </ActionIcon>
              <Button variant="default" size="xs" onClick={() => setCurrentMonday(getMonday(new Date()))}>Bugün</Button>

              {canManage && (
                <>
                  <Divider orientation="vertical" mx="xs" />
                  <Button
                    variant="light"
                    leftSection={<IconCopy size={16} />}
                    onClick={() => setCopyModal(true)}
                  >
                    Haftayı Kopyala
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => setShiftModal({ open: true })}
                  >
                    Vardiya Ekle
                  </Button>
                </>
              )}
            </Group>

            <Group gap="xs">
              <StatChip icon={<IconUsers size={14} />} label="Çalışan" value={String(summary.totalEmployees)} isDark={isDark} />
              <StatChip icon={<IconCalendarWeek size={14} />} label="Vardiya" value={String(summary.totalShifts)} isDark={isDark} />
              <StatChip icon={<IconClock size={14} />} label="Saat" value={summary.totalHours.toFixed(1)} isDark={isDark} />
              {summary.conflictDays > 0 && (
                <StatChip
                  icon={<IconAlertTriangle size={14} />}
                  label="Çakışma"
                  value={String(summary.conflictDays)}
                  accent="red"
                  isDark={isDark}
                />
              )}
            </Group>
          </Group>
        </Stack>
      </Paper>

      {/* Grid */}
      <WeeklyGrid
        schedule={schedule}
        isLoading={isLoading}
        weekDays={weekDays}
        canManage={canManage}
        isEmployee={isEmployee}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        onDeleteShift={(shift) => setDeleteDialog({ open: true, shift })}
        onAcknowledgeShift={handleAcknowledge}
        onMoveShift={handleMoveShift}
      />

      {/* Modals */}
      <ShiftModal
        open={shiftModal.open}
        onClose={() => setShiftModal({ open: false })}
        shift={shiftModal.shift}
        employees={employees}
        preselectedDate={shiftModal.prefillDate}
        preselectedEmployeeId={shiftModal.prefillEmployee}
      />

      <CopyWeekModal
        open={copyModal}
        onClose={() => setCopyModal(false)}
        currentWeek={currentMonday}
      />

      <Modal opened={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })} title="Vardiyayı Sil" centered>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Bu vardiyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </Text>
          <Divider />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteDialog({ open: false })}>
              İptal
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={deleteShift.isPending}>
              Sil
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

function shiftWeek(monday: string, direction: -1 | 1): string {
  const d = new Date(monday + "T12:00:00Z");
  d.setDate(d.getDate() + direction * 7);
  return d.toISOString().split("T")[0];
}

function StatChip({
  icon,
  label,
  value,
  accent,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "red";
  isDark: boolean;
}) {
  return (
    <Paper
      withBorder
      px="sm"
      py={6}
      radius="md"
      style={{
        background: isDark ? "rgba(255,255,255,0.03)" : "#fff",
        borderColor: accent
          ? "var(--mantine-color-red-6)"
          : isDark
            ? "var(--mantine-color-dark-4)"
            : "#e2e8f0",
        boxShadow: isDark
          ? undefined
          : "0 2px 8px rgba(37, 99, 235, 0.04)",
      }}
    >
      <Group gap={6}>
        <Text c={accent ?? "dimmed"}>{icon}</Text>
        <Text size="xs" c="dimmed">{label}:</Text>
        <Text size="xs" fw={700}>{value}</Text>
      </Group>
    </Paper>
  );
}
