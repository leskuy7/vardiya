"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ActionIcon,
  Box,
  Center,
  Drawer,
  Group,
  Menu,
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
  IconSettings,
  IconUser,
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

export function Sidebar({
  className,
  mobileOpened,
  onCloseMobile
}: {
  className?: string;
  mobileOpened?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const handleLogoutClick = () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      logout();
    }
  };

  const navContent = (
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
          <ActionIcon variant="subtle" size="sm" onClick={() => setCollapsed(true)} visibleFrom="md">
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
                onClick={onCloseMobile}
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
        {user && (
          <Menu shadow="md" width={collapsed ? 200 : "target"} position="top" offset={10}>
            <Menu.Target>
              <Paper
                withBorder
                p={collapsed ? "xs" : "sm"}
                radius="md"
                mb="sm"
                style={{
                  cursor: "pointer",
                  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.9)",
                  borderColor: isDark
                    ? "var(--mantine-color-dark-4)"
                    : "var(--mantine-color-gray-3)",
                }}
              >
                <Group gap="sm" wrap="nowrap" justify={collapsed ? "center" : "flex-start"}>
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
                  {!collapsed && (
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600} truncate>
                        {user?.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {user?.email}
                      </Text>
                    </Box>
                  )}
                </Group>
              </Paper>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Hesabım</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />}>
                Profilim
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={14} />}>
                Ayarlar
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={handleLogoutClick}
              >
                Çıkış Yap
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}

        {collapsed && (
          <Center>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => setCollapsed(false)}
              aria-label="Genislet"
              visibleFrom="md"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Center>
        )}
      </Box>
    </Stack>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Box
        className={`${className} no-print`}
        visibleFrom="md"
        style={{
          width: collapsed ? 76 : 270,
          transition: "width 180ms ease",
          background: "var(--mantine-color-body)",
          borderRight: "1px solid var(--mantine-color-default-border)",
          position: "relative",
        }}
      >
        {navContent}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        opened={!!mobileOpened}
        onClose={onCloseMobile || (() => { })}
        size="xs"
        padding={0}
        withCloseButton={false}
        hiddenFrom="md"
      >
        <Box style={{ width: 270, height: "100%" }}>
          {navContent}
        </Box>
      </Drawer>
    </>
  );
}
