"use client";

import { useState } from "react";
import {
  Grid,
  Paper,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  ActionIcon,
  Loader,
  ThemeIcon,
  Box,
  Center,
  Divider,
  Tooltip,
  rem,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconClock,
  IconCheck,
  IconSun,
  IconAlertCircle,
  IconCalendarStats,
  IconBolt,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import { useWeeklySchedule, useAcknowledgeShift } from "@/hooks/useShifts";
import { useAuth } from "@/hooks/useAuth";
import { getMonday, getWeekDates, formatTime, getShiftDuration } from "@/lib/utils";
import type { Shift } from "@/types";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: MantineColor; borderColor: string }> = {
  DRAFT:        { label: "Taslak",    color: "gray",  borderColor: "var(--mantine-color-gray-5)"    },
  PUBLISHED:    { label: "Yayında",   color: "teal",  borderColor: "var(--mantine-color-teal-5)"    },
  ACKNOWLEDGED: { label: "Onaylandı", color: "blue",  borderColor: "var(--mantine-color-blue-5)"    },
  CANCELLED:    { label: "Iptal",     color: "red",   borderColor: "var(--mantine-color-red-5)"     },
};

type MantineColor =
  | "gray" | "teal" | "blue" | "red" | "orange" | "violet" | "cyan" | "green" | "yellow" | "indigo" | "pink" | "lime";

const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// ─── Week nav helpers ─────────────────────────────────────────────────────────
function shiftWeek(monday: string, direction: -1 | 1): string {
  const d = new Date(monday + "T12:00:00Z");
  d.setDate(d.getDate() + direction * 7);
  return d.toISOString().split("T")[0];
}

function isoLabel(dateStr: string) {
  return new Date(dateStr + "T00:00:00+03:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });
}

function isToday(dateStr: string) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  return dateStr === today;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyShiftsPage() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const { toast } = useToast();
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const { data: schedule, isLoading } = useWeeklySchedule(currentMonday);
  const acknowledgeShift = useAcknowledgeShift();
  const weekDates = getWeekDates(currentMonday);

  const myRow = schedule?.employees.find((e) => {
    if (!e?.employee) return false;
    const emp = e.employee;
    return emp?.user?.id === user?.id || emp?.userId === user?.id;
  });

  const shiftsByDate = new Map<string, Shift[]>();
  myRow?.days.forEach((d) => {
    if (d?.shifts?.length) shiftsByDate.set(d.date, d.shifts);
  });

  const allShifts = [...shiftsByDate.values()].flat();
  const totalHours = allShifts.reduce((sum, s) => sum + getShiftDuration(s.startTime, s.endTime), 0);
  const pendingCount = allShifts.filter((s) => s.status === "PUBLISHED").length;
  const acknowledgedCount = allShifts.filter((s) => s.status === "ACKNOWLEDGED").length;

  const handleAcknowledge = async (shift: Shift) => {
    try {
      await acknowledgeShift.mutateAsync(shift.id);
      toast("success", "Vardiya onaylandı.");
    } catch {
      toast("error", "Onaylama başarısız.");
    }
  };

  const weekLabel = `${isoLabel(weekDates[0])} – ${new Date(
    weekDates[6] + "T00:00:00+03:00"
  ).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" })}`;

  return (
    <Stack gap="md">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Group justify="space-between" wrap="wrap">
        {/* Week nav */}
        <Group gap={6}>
          <ActionIcon variant="default" size="lg" onClick={() => setCurrentMonday((m) => shiftWeek(m, -1))} aria-label="Önceki hafta">
            <IconChevronLeft size={16} />
          </ActionIcon>

          <Paper withBorder px="md" py={6} miw={220} style={{ textAlign: "center" }}>
            <Text size="sm" fw={600}>{weekLabel}</Text>
          </Paper>

          <ActionIcon variant="default" size="lg" onClick={() => setCurrentMonday((m) => shiftWeek(m, 1))} aria-label="Sonraki hafta">
            <IconChevronRight size={16} />
          </ActionIcon>

          <Button variant="default" size="xs" onClick={() => setCurrentMonday(getMonday(new Date()))}>
            Bugün
          </Button>
        </Group>

        {/* Stats */}
        <Group gap="xs">
          <StatBadge icon={<IconClock size={13} />} label="Toplam" value={`${totalHours.toFixed(1)} saat`} color="violet" />
          <StatBadge icon={<IconCalendarStats size={13} />} label="Vardiya" value={String(allShifts.length)} color="teal" />
          {pendingCount > 0 && (
            <StatBadge icon={<IconAlertCircle size={13} />} label="Bekliyor" value={String(pendingCount)} color="orange" />
          )}
          {acknowledgedCount > 0 && (
            <StatBadge icon={<IconBolt size={13} />} label="Onaylı" value={String(acknowledgedCount)} color="blue" />
          )}
        </Group>
      </Group>

      {/* ── Calendar grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <Center h={280}>
          <Loader size="md" />
        </Center>
      ) : (
        <Grid columns={7} gutter="xs">
          {weekDates.map((date, idx) => {
            const shifts = shiftsByDate.get(date) ?? [];
            const today = isToday(date);
            const dayNum = new Date(date + "T00:00:00+03:00").getDate();

            return (
              <Grid.Col key={date} span={1}>
                <Paper
                  withBorder
                  h="100%"
                  mih={200}
                  style={{
                    borderColor: today ? "var(--mantine-color-blue-5)" : undefined,
                    boxShadow: today ? "0 0 0 1px var(--mantine-color-blue-9)" : undefined,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  p={0}
                >
                  <Box
                    px="xs"
                    py={6}
                    bg={today ? "blue.9" : isDark ? "dark.6" : "gray.1"}
                    style={{ borderRadius: "var(--mantine-radius-md) var(--mantine-radius-md) 0 0" }}
                  >
                    <Group justify="space-between">
                      <Text size="10px" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.06em" }}>
                        {DAY_SHORT[idx]}
                      </Text>
                      <ThemeIcon
                        size={22}
                        radius="xl"
                        color={today ? "blue" : isDark ? "dark" : "gray"}
                        variant={today ? "filled" : "subtle"}
                      >
                        <Text size="10px" fw={800}>{dayNum}</Text>
                      </ThemeIcon>
                    </Group>
                  </Box>

                  <Divider />

                  {/* Shifts */}
                  <Stack gap={4} p={6} style={{ flex: 1 }}>
                    {shifts.length === 0 ? (
                      <Center style={{ flex: 1, opacity: 0.15 }}>
                        <IconSun size={20} />
                      </Center>
                    ) : (
                      shifts.map((shift) => (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          onAcknowledge={handleAcknowledge}
                          isPending={acknowledgeShift.isPending}
                        />
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>
            );
          })}
        </Grid>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!isLoading && allShifts.length === 0 && (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <ThemeIcon size={56} radius="xl" color={isDark ? "dark" : "gray"} variant="light" style={{ opacity: 0.3 }}>
              <IconCalendar size={28} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">Bu hafta için henüz vardiya yok.</Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}

// ─── ShiftCard ────────────────────────────────────────────────────────────────
function ShiftCard({
  shift,
  onAcknowledge,
  isPending,
}: {
  shift: Shift;
  onAcknowledge: (shift: Shift) => void;
  isPending: boolean;
}) {
  const st = STATUS[shift.status] ?? STATUS.DRAFT;
  const hours = getShiftDuration(shift.startTime, shift.endTime);

  return (
    <Paper
      p={6}
      radius="sm"
      withBorder
      style={{
        borderLeftWidth: 3,
        borderLeftColor: st.borderColor,
        cursor: "default",
      }}
    >
      <Stack gap={3}>
        <Text size="11px" fw={700} style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatTime(shift.startTime)}
          <Text span size="11px" fw={400} c="dimmed"> – </Text>
          {formatTime(shift.endTime)}
        </Text>

        <Group justify="space-between" gap={4}>
          <Text size="10px" c="dimmed">{hours.toFixed(1)} saat</Text>
          <Badge size="xs" color={st.color} variant="light" radius="sm">
            {st.label}
          </Badge>
        </Group>

        {shift.note && (
          <Tooltip label={shift.note} withArrow>
            <Text size="10px" c="dimmed" fs="italic" truncate="end">{shift.note}</Text>
          </Tooltip>
        )}

        {shift.status === "PUBLISHED" && (
          <Button
            size="compact-xs"
            color="teal"
            variant="light"
            fullWidth
            leftSection={<IconCheck size={11} />}
            onClick={() => onAcknowledge(shift)}
            loading={isPending}
            mt={2}
          >
            Onayla
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

// ─── StatBadge ────────────────────────────────────────────────────────────────
function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: MantineColor;
}) {
  return (
    <Paper withBorder px="sm" py={5}>
      <Group gap={5}>
        <Text c={color as string}>{icon}</Text>
        <Text size="xs" c="dimmed">{label}:</Text>
        <Text size="xs" fw={700}>{value}</Text>
      </Group>
    </Paper>
  );
}
