"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Vardiyayı Düzenle" : "Yeni Vardiya Ekle"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Employee */}
        <div className="space-y-1.5">
          <Label>Çalışan</Label>
          <Select error={errors.employeeId?.message} {...register("employeeId")}>
            <option value="">Çalışan seçin...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.user.name} — {emp.position ?? emp.department ?? ""}
              </option>
            ))}
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label>Tarih</Label>
          <Input type="date" error={errors.date?.message} {...register("date")} />
        </div>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Başlangıç Saati</Label>
            <Input type="time" error={errors.startTime?.message} {...register("startTime")} />
          </div>
          <div className="space-y-1.5">
            <Label>Bitiş Saati</Label>
            <Input type="time" error={errors.endTime?.message} {...register("endTime")} />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Durum</Label>
          <Select {...register("status")}>
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayında</option>
          </Select>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label>Not (opsiyonel)</Label>
          <Input type="text" placeholder="Açıklama..." {...register("note")} />
        </div>

        {/* Force override */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="forceOverride"
            className="h-4 w-4"
            {...register("forceOverride")}
          />
          <Label htmlFor="forceOverride" className="cursor-pointer text-muted-foreground">
            Müsaitlik çakışmasını görmezden gel
          </Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
