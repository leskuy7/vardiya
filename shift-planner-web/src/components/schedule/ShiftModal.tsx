"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useToast } from "@/components/ui/toast";
import { useCreateShift, useUpdateShift } from "@/hooks/useShifts";
import type { Shift, Employee } from "@/types";

const shiftSchema = z.object({
  employeeId: z.string().min(1, "Çalışan seçiniz"),
  date: z.string().min(1, "Tarih giriniz"),
  startTime: z.string().min(1, "Başlangıç saati giriniz"),
  endTime: z.string().min(1, "Bitiş saati giriniz"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  note: z.string().optional(),
  forceOverride: z.boolean().optional(),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  shift?: Shift | null;
  employees: Employee[];
  preselectedDate?: string;
  preselectedEmployeeId?: string;
}

export function ShiftModal({
  open,
  onClose,
  shift,
  employees,
  preselectedDate,
  preselectedEmployeeId,
}: ShiftModalProps) {
  const { toast } = useToast();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();

  const isEdit = !!shift;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      status: "DRAFT",
      forceOverride: false,
    },
  });

  // Prefill form when opening
  useEffect(() => {
    if (open) {
      if (shift) {
        const startDate = new Date(shift.startTime);
        const dateStr = startDate.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
        const startStr = startDate.toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Istanbul",
        });
        const endDate = new Date(shift.endTime);
        const endStr = endDate.toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Istanbul",
        });
        reset({
          employeeId: shift.employeeId,
          date: dateStr,
          startTime: startStr,
          endTime: endStr,
          status: shift.status as "DRAFT" | "PUBLISHED",
          note: shift.note ?? "",
          forceOverride: false,
        });
      } else {
        reset({
          employeeId: preselectedEmployeeId ?? "",
          date: preselectedDate ?? "",
          startTime: "",
          endTime: "",
          status: "DRAFT",
          note: "",
          forceOverride: false,
        });
      }
    }
  }, [open, shift, preselectedDate, preselectedEmployeeId, reset]);

  const onSubmit = async (values: ShiftFormValues) => {
    try {
      // Build ISO datetimes using Istanbul offset (+03:00)
      const start = new Date(`${values.date}T${values.startTime}:00+03:00`).toISOString();
      const end = new Date(`${values.date}T${values.endTime}:00+03:00`).toISOString();

      const payload = {
        employeeId: values.employeeId,
        startTime: start,
        endTime: end,
        status: values.status,
        note: values.note,
        forceOverride: values.forceOverride,
      };

      if (isEdit && shift) {
        await updateShift.mutateAsync({ id: shift.id, data: payload });
        toast("success", "Vardiya güncellendi.");
      } else {
        const result = await createShift.mutateAsync(payload);
        const warnings = (result as { _warnings?: string[] })?._warnings;
        if (warnings?.length) {
          toast("warning", warnings.join(" | "));
        } else {
          toast("success", "Vardiya oluşturuldu.");
        }
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Bir hata oluştu.";
      toast("error", msg);
    }
  };

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp.id,
        label: `${emp.user.name} — ${emp.position ?? emp.department ?? ""}`.trim(),
      })),
    [employees]
  );

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={isEdit ? "Vardiyayi Duzenle" : "Yeni Vardiya Ekle"}
      size="md"
      centered
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="sm">
          <Controller
            name="employeeId"
            control={control}
            render={({ field }) => (
              <Select
                label="Calisan"
                placeholder="Calisan secin..."
                data={employeeOptions}
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
                error={errors.employeeId?.message}
                searchable
                nothingFoundMessage="Sonuc yok"
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextInput
                type="date"
                label="Tarih"
                value={field.value}
                onChange={field.onChange}
                error={errors.date?.message}
              />
            )}
          />

          <Group grow>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <TextInput
                  type="time"
                  label="Baslangic Saati"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.startTime?.message}
                />
              )}
            />
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <TextInput
                  type="time"
                  label="Bitis Saati"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.endTime?.message}
                />
              )}
            />
          </Group>

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Durum"
                data={[
                  { value: "DRAFT", label: "Taslak" },
                  { value: "PUBLISHED", label: "Yayinda" },
                ]}
                value={field.value}
                onChange={(value) => field.onChange(value ?? "DRAFT")}
              />
            )}
          />

          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Not (opsiyonel)"
                placeholder="Aciklama..."
                autosize
                minRows={2}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="forceOverride"
            control={control}
            render={({ field }) => (
              <Checkbox
                label="Musaitlik cakismasini gormezden gel"
                checked={!!field.value}
                onChange={(event) => field.onChange(event.currentTarget.checked)}
              />
            )}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Iptal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Guncelle" : "Olustur"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
