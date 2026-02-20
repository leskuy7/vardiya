"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AvailabilityBlock, CreateAvailabilityData } from "@/types";

export function useAvailability(employeeId?: string) {
  return useQuery<AvailabilityBlock[]>({
    queryKey: ["availability", employeeId],
    queryFn: async () => {
      const params = employeeId ? `?employeeId=${employeeId}` : "";
      const { data } = await api.get(`/availability${params}`);
      return data;
    },
  });
}

export function useCreateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvailabilityData) => {
      const res = await api.post<AvailabilityBlock>("/availability", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
