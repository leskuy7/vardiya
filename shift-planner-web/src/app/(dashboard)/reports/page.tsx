"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { WeekPicker } from "@/components/schedule/WeekPicker";
import { useWeeklyReport } from "@/hooks/useReports";
import { getMonday } from "@/lib/utils";

export default function ReportsPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const { data: report, isLoading } = useWeeklyReport(currentMonday);

  const totalRegular = report?.employees.reduce((s, e) => s + e.regularHours, 0) ?? 0;
  const totalOvertime = report?.employees.reduce((s, e) => s + e.overtimeHours, 0) ?? 0;
  const totalCost = report?.employees.reduce((s, e) => s + e.totalCost, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Week Picker */}
      <WeekPicker currentMonday={currentMonday} onChange={setCurrentMonday} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label="Normal Çalışma"
          value={`${totalRegular.toFixed(1)} saat`}
          bg="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          label="Fazla Mesai"
          value={`${totalOvertime.toFixed(1)} saat`}
          bg="bg-amber-50 dark:bg-amber-500/10"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          label="Toplam Maliyet"
          value={`₺${totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
          bg="bg-emerald-50 dark:bg-emerald-500/10"
        />
      </div>

      {/* Detail table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !report?.employees.length ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p>Bu hafta için rapor verisi bulunamadı.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Çalışan</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vardiya</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Normal</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fazla Mesai</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saatlik Ücret</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Toplam</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.employees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {emp.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <span className="font-medium text-[13px]">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">{emp.shiftCount}</td>
                  <td className="px-4 py-3.5 text-right font-medium">{emp.regularHours.toFixed(1)}s</td>
                  <td className="px-4 py-3.5 text-right">
                    {emp.overtimeHours > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{emp.overtimeHours.toFixed(1)}s</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-muted-foreground">
                    {emp.hourlyRate ? `₺${emp.hourlyRate}/sa` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold">
                    {emp.totalCost > 0
                      ? `₺${emp.totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {emp.totalHours >= 45 ? (
                      <Badge variant="warning">Yüksek</Badge>
                    ) : emp.totalHours >= 40 ? (
                      <Badge variant="info">Normal</Badge>
                    ) : (
                      <Badge variant="secondary">Az</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="px-4 py-3.5 font-semibold text-[13px]" colSpan={2}>Toplam</td>
                <td className="px-4 py-3.5 text-right font-semibold">{totalRegular.toFixed(1)}s</td>
                <td className="px-4 py-3.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                  {totalOvertime > 0 ? `${totalOvertime.toFixed(1)}s` : "—"}
                </td>
                <td className="px-4 py-3.5" />
                <td className="px-4 py-3.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                  ₺{totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}
