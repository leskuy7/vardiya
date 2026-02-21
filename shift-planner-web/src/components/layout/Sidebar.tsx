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
  LayoutDashboard,
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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col bg-sidebar/95 backdrop-blur-3xl text-sidebar-foreground transition-all duration-300 ease-in-out z-20",
        collapsed ? "w-[68px]" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center gap-3 px-4 border-b border-white/[0.06]",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-blue-400 text-white shadow-md shadow-primary/20">
          <CalendarDays className="h-[18px] w-[18px]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="block truncate text-sm font-semibold tracking-tight">Vardiya Planlayıcı</span>
            <span className="block truncate text-[11px] text-sidebar-foreground/50">Ekip Yönetimi</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className={cn("space-y-1", collapsed && "space-y-2")}>
          {visibleItems.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  collapsed && "justify-center px-0 py-2.5",
                  active
                    ? "bg-sidebar-primary/15 text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-white/[0.06] hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed && user && (
          <div className="mb-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{user?.name}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/45">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title="Çıkış Yap"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-sidebar-foreground/60 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-150 hover:bg-accent hover:text-foreground hover:shadow-md"
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
