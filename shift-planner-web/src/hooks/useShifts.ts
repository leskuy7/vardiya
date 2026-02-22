"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { WeeklySchedule, CreateShiftData, UpdateShiftData, Shift } from "@/types";

function decodeWarnings(rawHeader: unknown): string[] | undefined {
  if (typeof rawHeader !== "string" || !rawHeader) return undefined;
  try {
    const decoded = JSON.parse(atob(rawHeader));
    if (Array.isArray(decoded)) {
      return decoded.map((item) => String(item));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function useWeeklySchedule(weekStart: string) {
  return useQuery<WeeklySchedule>({
    queryKey: ["schedule", weekStart],
    queryFn: async () => {
      const { data } = await api.get(`/schedule/week?start=${weekStart}`);
      // Defensive normalization for API responses that may return non-array shapes
      if (data?.employees && Array.isArray(data.employees)) {
        data.employees = data.employees.map((employee: any) => {
          const days = Array.isArray(employee?.days) ? employee.days : [];
          return {
            ...employee,
            days: days.map((day: any) => ({
              ...day,
              shifts: Array.isArray(day?.shifts) ? day.shifts : [],
            })),
          };
        });
      }
      return data;
    },
    enabled: !!weekStart,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShiftData) => {
      const res = await api.post<Shift>("/shifts", data);
      const warnings = decodeWarnings(res.headers?.["x-warnings"]);
      return warnings?.length ? { ...res.data, warnings } : res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateShiftData }) => {
      const res = await api.patch<Shift>(`/shifts/${id}`, data);
      const warnings = decodeWarnings(res.headers?.["x-warnings"]);
      return warnings?.length ? { ...res.data, warnings } : res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useCopyWeek() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sourceWeekStart: string; targetWeekStart: string }) => {
      const res = await api.post("/shifts/copy-week", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useAcknowledgeShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/shifts/${id}/acknowledge`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}
