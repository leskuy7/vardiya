"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Center, Loader, Table, Text } from "@mantine/core";
import { useWeeklySchedule } from "@/hooks/useShifts";
import { getMonday, getWeekDates, formatTime, getShiftDuration } from "@/lib/utils";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function PrintContent() {
  const params = useSearchParams();
  const weekParam = params.get("week") ?? getMonday(new Date());
  const weekDays = getWeekDates(weekParam);

  const { data: schedule, isLoading } = useWeeklySchedule(weekParam);

  useEffect(() => {
    if (!isLoading && schedule) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, schedule]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="md" />
      </Center>
    );
  }

  const startDate = new Date(weekDays[0] + "T00:00:00+03:00");
  const endDate = new Date(weekDays[6] + "T00:00:00+03:00");

  return (
    <div style={{ margin: "0 auto", maxWidth: 1100, padding: 24, fontSize: "10pt" }}>
      <style>
        {`
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: landscape; margin: 10mm; }
          }
        `}
      </style>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>
        <Text fw={700}>Vardiya Programı</Text>
        <Text size="sm" c="dimmed">
          {startDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} – {" "}
          {endDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </Text>
      </div>

      <Table withTableBorder withColumnBorders verticalSpacing="xs" style={{ fontSize: "9pt" }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Çalışan</Table.Th>
            {weekDays.map((day, i) => {
              const d = new Date(day + "T00:00:00+03:00");
              return (
                <Table.Th key={day} style={{ textAlign: "center" }}>
                  <div>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: "8pt", color: "#6b7280" }}>
                    {d.toLocaleDateString("tr-TR", { day: "numeric", month: "numeric" })}
                  </div>
                </Table.Th>
              );
            })}
            <Table.Th style={{ textAlign: "center" }}>Toplam</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {schedule?.employees.map((empRow) => {
            const days = Array.isArray(empRow.days) ? empRow.days : [];
            const totalHours = days
              .flatMap((d) => (Array.isArray(d.shifts) ? d.shifts : []))
              .reduce((sum, s) => sum + getShiftDuration(s.startTime, s.endTime), 0);

            return (
              <Table.Tr key={empRow.employee.id}>
                <Table.Td>
                  <div>{empRow.employee.user.name}</div>
                  {empRow.employee.position && (
                    <div style={{ fontSize: "8pt", color: "#6b7280" }}>{empRow.employee.position}</div>
                  )}
                </Table.Td>
                {days.map((day) => (
                  <Table.Td key={day.date} style={{ verticalAlign: "top" }}>
                    {day.shifts.length === 0 ? (
                      <span style={{ color: "#cbd5f5" }}>—</span>
                    ) : (
                      day.shifts.map((shift) => (
                        <div key={shift.id} style={{ marginBottom: 4 }}>
                          <div style={{ fontWeight: 600 }}>
                            {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                          </div>
                          {shift.note && (
                            <div style={{ fontSize: "8pt", color: "#6b7280" }}>{shift.note}</div>
                          )}
                        </div>
                      ))
                    )}
                  </Table.Td>
                ))}
                <Table.Td style={{ textAlign: "center", fontWeight: 600 }}>{totalHours.toFixed(1)}s</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "8pt" }}>
        <span>Vardiya Planlayıcı Sistemi</span>
        <span>Basım: {new Date().toLocaleDateString("tr-TR", { dateStyle: "long" })}</span>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense
      fallback={
        <Center h="100vh">
          <Loader size="md" />
        </Center>
      }
    >
      <PrintContent />
    </Suspense>
  );
}
