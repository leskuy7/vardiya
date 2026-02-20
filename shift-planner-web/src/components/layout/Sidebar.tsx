"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  Clock,
  BarChart3,
  CalendarCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  {
    label: "Haftalık Program",
    href: "/schedule",
    icon: CalendarDays,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Çalışanlar",
    href: "/employees",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Müsaitlik",
    href: "/availability",
    icon: CalendarCheck,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Vardiyalarım",
    href: "/my-shifts",
    icon: Clock,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Raporlar",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-white">
          <CalendarDays className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="truncate font-semibold text-sm">Vardiya Planlayıcı</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2 pt-4">
        {visibleItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary/20 text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/10 p-2">
        {!collapsed && user && (
          <div className="mb-2 px-3 py-1">
            <p className="truncate text-xs font-medium">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          title="Çıkış Yap"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-foreground shadow-sm hover:bg-accent"
        aria-label={collapsed ? "Genişlet" : "Daralt"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
