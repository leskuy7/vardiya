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
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          label="Normal Çalışma"
          value={`${totalRegular.toFixed(1)} saat`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          label="Fazla Mesai"
          value={`${totalOvertime.toFixed(1)} saat`}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="Toplam Maliyet"
          value={`₺${totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
          bg="bg-green-50"
        />
      </div>

      {/* Detail table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !report?.employees.length ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          <p>Bu hafta için rapor verisi bulunamadı.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Çalışan</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vardiya</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Normal</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fazla Mesai</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Saatlik Ücret</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Toplam</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.employees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{emp.shiftCount}</td>
                  <td className="px-4 py-3 text-right">{emp.regularHours.toFixed(1)}s</td>
                  <td className="px-4 py-3 text-right">
                    {emp.overtimeHours > 0 ? (
                      <span className="text-orange-600 font-medium">{emp.overtimeHours.toFixed(1)}s</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {emp.hourlyRate ? `₺${emp.hourlyRate}/sa` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {emp.totalCost > 0
                      ? `₺${emp.totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
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
            <tfoot className="bg-muted/30">
              <tr>
                <td className="px-4 py-3 font-semibold" colSpan={2}>Toplam</td>
                <td className="px-4 py-3 text-right font-semibold">{totalRegular.toFixed(1)}s</td>
                <td className="px-4 py-3 text-right font-semibold text-orange-600">
                  {totalOvertime > 0 ? `${totalOvertime.toFixed(1)}s` : "—"}
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right font-bold text-green-700">
                  ₺{totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3" />
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
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
