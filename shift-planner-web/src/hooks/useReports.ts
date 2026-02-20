"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { WeeklyReport } from "@/types";

export function useWeeklyReport(weekStart: string) {
  return useQuery<WeeklyReport>({
    queryKey: ["reports", "weekly", weekStart],
    queryFn: async () => {
      const { data } = await api.get(`/reports/weekly-hours?weekStart=${weekStart}`);
      return data;
    },
    enabled: !!weekStart,
  });
}
