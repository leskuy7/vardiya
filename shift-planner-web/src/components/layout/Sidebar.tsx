"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ActionIcon,
  Box,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconCalendarWeek,
  IconUsers,
  IconClock,
  IconChartBar,
  IconCalendarEvent,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  {
    label: "Haftalık Program",
    href: "/schedule",
    icon: IconCalendarWeek,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Çalışanlar",
    href: "/employees",
    icon: IconUsers,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Müsaitlik",
    href: "/availability",
    icon: IconCalendarEvent,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Vardiyalarım",
    href: "/my-shifts",
    icon: IconClock,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Raporlar",
    href: "/reports",
    icon: IconChartBar,
    roles: ["ADMIN", "MANAGER"],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  return (
    <Box
      className={className}
      style={{
        width: collapsed ? 76 : 270,
        transition: "width 180ms ease",
        background: "var(--mantine-color-body)",
        borderRight: "1px solid var(--mantine-color-default-border)",
        position: "relative",
      }}
    >
      <Stack gap={0} style={{ height: "100%" }}>
        {/* Logo */}
        <Group px="md" py="md" align="center" justify={collapsed ? "center" : "space-between"}>
          <Group gap="sm" align="center" wrap="nowrap">
            <Paper
              radius="md"
              p={8}
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.85))"
                  : "linear-gradient(135deg, #3b82f6, #6366f1)",
                boxShadow: isDark
                  ? "0 10px 30px rgba(59, 130, 246, 0.25)"
                  : "0 4px 12px rgba(59, 130, 246, 0.2)",
              }}
            >
              <IconLayoutDashboard size={18} color="white" />
            </Paper>
            {!collapsed && (
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={700} truncate>
                  Vardiya Planlayici
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  Ekip Yonetimi
                </Text>
              </Box>
            )}
          </Group>
          {!collapsed && (
            <ActionIcon variant="subtle" size="sm" onClick={() => setCollapsed(true)}>
              <IconChevronLeft size={14} />
            </ActionIcon>
          )}
        </Group>

        <ScrollArea style={{ flex: 1 }} px="sm" pb="sm">
          <Stack gap={6} mt="xs">
            {visibleItems.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <NavLink
                  key={href}
                  component={Link}
                  href={href}
                  label={collapsed ? undefined : label}
                  leftSection={<Icon size={18} />}
                  active={active}
                  variant="subtle"
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    paddingLeft: collapsed ? 12 : 14,
                    paddingRight: collapsed ? 12 : 14,
                  }}
                />
              );
            })}
          </Stack>
        </ScrollArea>

        <Box px="sm" pb="sm" pt={6} style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
          {!collapsed && user && (
            <Paper
              withBorder
              p="sm"
              radius="md"
              mb="sm"
              style={{
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.9)",
                borderColor: isDark
                  ? "var(--mantine-color-dark-4)"
                  : "var(--mantine-color-gray-3)",
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <Paper
                  radius="xl"
                  p={0}
                  style={{
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDark
                      ? "rgba(59, 130, 246, 0.2)"
                      : "#e0e7ff",
                    border: isDark
                      ? "1px solid rgba(59, 130, 246, 0.4)"
                      : "1px solid #bae6fd",
                  }}
                >
                  <Text size="xs" fw={700} c={isDark ? "blue.2" : "blue.7"}>
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </Text>
                </Paper>
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>
                    {user?.name}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {user?.email}
                  </Text>
                </Box>
              </Group>
            </Paper>
          )}

          <NavLink
            label={collapsed ? undefined : "Cikis Yap"}
            leftSection={<IconLogout size={18} />}
            onClick={logout}
            color="red"
            variant="subtle"
            style={{ borderRadius: "var(--mantine-radius-md)" }}
          />

          {collapsed && (
            <ActionIcon
              variant="default"
              size="lg"
              mt="sm"
              onClick={() => setCollapsed(false)}
              aria-label="Genislet"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
