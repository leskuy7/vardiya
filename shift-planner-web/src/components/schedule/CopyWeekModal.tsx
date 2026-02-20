"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useCopyWeek } from "@/hooks/useShifts";
import { getMonday } from "@/lib/utils";

const copySchema = z.object({
  sourceWeek: z.string().min(1, "Kaynak hafta seçin"),
  targetWeek: z.string().min(1, "Hedef hafta seçin"),
});

type CopyValues = z.infer<typeof copySchema>;

interface CopyWeekModalProps {
  open: boolean;
  onClose: () => void;
  currentWeek: string;
}

export function CopyWeekModal({ open, onClose, currentWeek }: CopyWeekModalProps) {
  const { toast } = useToast();
  const copyWeek = useCopyWeek();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CopyValues>({
    resolver: zodResolver(copySchema),
    defaultValues: {
      sourceWeek: currentWeek,
      targetWeek: (() => {
        const d = new Date(currentWeek + "T12:00:00Z");
        d.setDate(d.getDate() + 7);
        return d.toISOString().split("T")[0];
      })(),
    },
  });

  const onSubmit = async (values: CopyValues) => {
    try {
      await copyWeek.mutateAsync({
        sourceWeekStart: values.sourceWeek,
        targetWeekStart: values.targetWeek,
      });
      toast("success", "Hafta kopyalandı.");
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Kopyalama başarısız.";
      toast("error", msg);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Haftayı Kopyala" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Kaynak Hafta (Pazartesi)</Label>
          <Input type="date" error={errors.sourceWeek?.message} {...register("sourceWeek")} />
        </div>
        <div className="space-y-1.5">
          <Label>Hedef Hafta (Pazartesi)</Label>
          <Input type="date" error={errors.targetWeek?.message} {...register("targetWeek")} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Kopyala
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
