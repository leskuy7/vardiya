"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ActionIcon, Badge, Button, Group, Paper, Text, Tooltip } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import {
  IconPrinter,
  IconMoonStars,
  IconSun,
  IconCalendarWeek,
} from "@tabler/icons-react";

const pageTitles: Record<string, string> = {
  "/schedule": "Haftalık Vardiya Programı",
  "/employees": "Çalışan Yönetimi",
  "/availability": "Müsaitlik Yönetimi",
  "/my-shifts": "Vardiyalarım",
  "/reports": "Raporlar",
};

export function Navbar() {
  const pathname = usePathname();
  const title = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? "Vardiya Planlayıcı";

  const showPrint = pathname.startsWith("/schedule");

  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const toggleTheme = () => setColorScheme(colorScheme === "dark" ? "light" : "dark");

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("tr-TR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <Paper
      withBorder
      radius={0}
      px="md"
      py={10}
      style={{
        background: "rgba(10, 15, 24, 0.7)",
        borderColor: "var(--mantine-color-dark-4)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Group justify="space-between" wrap="wrap">
        <Group gap="sm">
          <Badge size="lg" radius="sm" variant="light" leftSection={<IconCalendarWeek size={14} />}>
            {title}
          </Badge>
          <Text size="xs" c="dimmed">{todayLabel}</Text>
        </Group>

        <Group gap="xs">
          {showPrint && (
            <Button
              variant="light"
              leftSection={<IconPrinter size={16} />}
              onClick={() => window.open("/schedule/print", "_blank")}
              className="no-print"
            >
              Yazdir
            </Button>
          )}
          <Tooltip label={colorScheme === "dark" ? "Aydinlik" : "Koyu"}>
            <ActionIcon variant="default" size="lg" onClick={toggleTheme} aria-label="Tema degistir">
              {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Paper>
  );
}
