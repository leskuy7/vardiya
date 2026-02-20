"use client";

import { Printer, Moon, Sun, Globe2, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("tr-TR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {showPrint && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/schedule/print", "_blank")}
            className="no-print"
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Tema değiştir"
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </Button>
      </div>
    </header>
  );
}
