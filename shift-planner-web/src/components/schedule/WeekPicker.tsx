"use client";

import { ActionIcon, Button, Paper, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { getMonday, getWeekDates, formatDate } from "@/lib/utils";

interface WeekPickerProps {
  currentMonday: string; // YYYY-MM-DD
  onChange: (monday: string) => void;
}

export function WeekPicker({ currentMonday, onChange }: WeekPickerProps) {
  const days = getWeekDates(currentMonday);
  const start = days[0];
  const end = days[6];

  const goToToday = () => onChange(getMonday(new Date()));

  const prevWeek = () => {
    const d = new Date(currentMonday + "T12:00:00Z");
    d.setDate(d.getDate() - 7);
    onChange(d.toISOString().split("T")[0]);
  };

  const nextWeek = () => {
    const d = new Date(currentMonday + "T12:00:00Z");
    d.setDate(d.getDate() + 7);
    onChange(d.toISOString().split("T")[0]);
  };

  const startLabel = new Date(start + "T00:00:00+03:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });
  const endLabel = new Date(end + "T00:00:00+03:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <ActionIcon variant="default" size="lg" onClick={prevWeek} aria-label="Onceki hafta">
        <IconChevronLeft size={16} />
      </ActionIcon>
      <Paper withBorder px="md" py={6} radius="md" style={{ minWidth: 220, textAlign: "center" }}>
        <Text size="sm" fw={600}>
          {startLabel} – {endLabel}
        </Text>
      </Paper>
      <ActionIcon variant="default" size="lg" onClick={nextWeek} aria-label="Sonraki hafta">
        <IconChevronRight size={16} />
      </ActionIcon>
      <Button variant="default" size="xs" onClick={goToToday}>
        Bugun
      </Button>
    </div>
  );
}
