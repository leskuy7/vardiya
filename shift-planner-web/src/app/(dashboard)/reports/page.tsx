"use client";

import { useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChartBar,
  IconClock,
  IconTrendingUp,
  IconCurrencyLira,
} from "@tabler/icons-react";
import { useWeeklyReport } from "@/hooks/useReports";
import { getMonday, getWeekDates } from "@/lib/utils";

function shiftWeek(monday: string, direction: -1 | 1): string {
  const d = new Date(monday + "T12:00:00Z");
  d.setDate(d.getDate() + direction * 7);
  return d.toISOString().split("T")[0];
}

export default function ReportsPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const { data: report, isLoading } = useWeeklyReport(currentMonday);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const weekDays = getWeekDates(currentMonday);
  const weekLabel = useMemo(() => {
    const start = new Date(weekDays[0] + "T00:00:00+03:00");
    const end = new Date(weekDays[6] + "T00:00:00+03:00");
    const startLabel = start.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const endLabel = end.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }, [weekDays]);

  const totalRegular = report?.employees.reduce((s, e) => s + e.regularHours, 0) ?? 0;
  const totalOvertime = report?.employees.reduce((s, e) => s + e.overtimeHours, 0) ?? 0;
  const totalCost = report?.employees.reduce((s, e) => s + e.totalPay, 0) ?? 0;

  return (
    <Stack gap="lg">
      <Paper
        className="no-print"
        withBorder
        p="md"
        radius="lg"
        style={{
          background: isDark
            ? "linear-gradient(140deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.9))"
            : "#fff",
          borderColor: isDark
            ? "var(--mantine-color-dark-4)"
            : "#e2e8f0",
        }}
      >
        <Group justify="space-between" wrap="wrap">
          <Group gap="sm">
            <Paper radius="md" p={8} style={{ background: "rgba(59,130,246,0.2)" }}>
              <IconChartBar size={18} />
            </Paper>
            <Box>
              <Title order={4}>Raporlar</Title>
              <Text size="xs" c="dimmed">{weekLabel}</Text>
            </Box>
          </Group>
          <Group gap="xs">
            <ActionIcon variant="default" size="lg" onClick={() => setCurrentMonday((m) => shiftWeek(m, -1))}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Paper withBorder px="md" py={6} radius="md">
              <Text size="sm" fw={600}>{weekLabel}</Text>
            </Paper>
            <ActionIcon variant="default" size="lg" onClick={() => setCurrentMonday((m) => shiftWeek(m, 1))}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      <Grid gutter="md" className="no-print">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="lg">
            <Group justify="space-between">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Normal Calisma</Text>
              <IconClock size={18} />
            </Group>
            <Text fw={800} size="xl" mt={6}>{totalRegular.toFixed(1)} saat</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="lg">
            <Group justify="space-between">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Fazla Mesai</Text>
              <IconTrendingUp size={18} />
            </Group>
            <Text fw={800} size="xl" mt={6}>{totalOvertime.toFixed(1)} saat</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper withBorder p="md" radius="lg">
            <Group justify="space-between">
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Toplam Maliyet</Text>
              <IconCurrencyLira size={18} />
            </Group>
            <Text fw={800} size="xl" mt={6}>
              ₺{totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {isLoading ? (
        <Center h={220}>
          <Loader size="md" />
        </Center>
      ) : !report?.employees.length ? (
        <Paper withBorder radius="lg" p="xl">
          <Center h={160}>
            <Stack gap={6} align="center">
              <IconChartBar size={28} color="var(--mantine-color-dimmed)" />
              <Text size="sm" c="dimmed">Bu hafta icin rapor verisi bulunamadi.</Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Paper withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Calisan</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Vardiya</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Normal</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Fazla Mesai</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Saatlik Ucret</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Toplam</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>Durum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.employees.map((emp) => (
                <Table.Tr key={emp.employeeId}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Paper
                        radius="xl"
                        p={0}
                        style={{
                          width: 30,
                          height: 30,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isDark ? "rgba(59,130,246,0.15)" : "var(--mantine-color-blue-0)",
                          border: isDark ? "1px solid rgba(59,130,246,0.25)" : "1px solid var(--mantine-color-blue-2)",
                        }}
                      >
                        <Text size="xs" fw={700} c={isDark ? "blue.2" : "blue.7"}>
                          {emp.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </Text>
                      </Paper>
                      <Text size="sm" fw={600}>{emp.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" c="dimmed">{emp.shiftCount}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={600}>{emp.regularHours.toFixed(1)} saat</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    {emp.overtimeHours > 0 ? (
                      <Text size="sm" fw={700} c={isDark ? "yellow.4" : "yellow.7"}>{emp.overtimeHours.toFixed(1)} saat</Text>
                    ) : (
                      <Text size="sm" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" c="dimmed">{emp.hourlyRate ? `₺${emp.hourlyRate}/sa` : "—"}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text size="sm" fw={700}>
                      {emp.totalPay > 0
                        ? `₺${emp.totalPay.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    {emp.totalHours >= 45 ? (
                      <Badge color="yellow" variant="light">Yuksek</Badge>
                    ) : emp.totalHours >= 40 ? (
                      <Badge color="blue" variant="light">Normal</Badge>
                    ) : (
                      <Badge color="gray" variant="light">Az</Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
