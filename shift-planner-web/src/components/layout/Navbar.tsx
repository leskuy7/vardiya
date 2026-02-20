"use client";

import { Printer } from "lucide-react";
import { usePathname } from "next/navigation";
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

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
