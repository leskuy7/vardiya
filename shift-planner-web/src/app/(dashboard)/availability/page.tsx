"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useAvailability, useCreateAvailability, useDeleteAvailability } from "@/hooks/useAvailability";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import type { AvailabilityBlock } from "@/types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const BLOCK_TYPE_LABELS: Record<string, string> = {
  UNAVAILABLE: "Müsait Değil",
  PREFER_NOT: "Tercih Değil",
  AVAILABLE_ONLY: "Sadece Bu Saatler",
};

const availSchema = z.object({
  employeeId: z.string().min(1, "Çalışan seçin"),
  type: z.enum(["UNAVAILABLE", "PREFER_NOT", "AVAILABLE_ONLY"]),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type AvailFormValues = z.infer<typeof availSchema>;

export default function AvailabilityPage() {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const { toast } = useToast();

  const canManageAll = isAdmin || isManager;

  const { data: employees } = useEmployees(true);

  // For employees, show their own availability
  // For managers/admins, show all
  const myEmployee = employees?.find((e) => e.user?.id === user?.id);

  const [filterEmployeeId, setFilterEmployeeId] = useState<string | undefined>(
    isEmployee ? myEmployee?.id : undefined
  );

  const { data: blocks, isLoading } = useAvailability(filterEmployeeId);
  const createAvail = useCreateAvailability();
  const deleteAvail = useDeleteAvailability();

  const [modal, setModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; block?: AvailabilityBlock }>({
    open: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AvailFormValues, unknown, AvailFormValues>({
    resolver: zodResolver(availSchema) as any,
    defaultValues: {
      type: "UNAVAILABLE",
      dayOfWeek: 1,
      employeeId: isEmployee ? myEmployee?.id ?? "" : "",
    },
  });

  const openCreate = () => {
    reset({
      type: "UNAVAILABLE",
      dayOfWeek: 1,
      employeeId: isEmployee ? myEmployee?.id ?? "" : "",
    });
    setModal(true);
  };

  const onSubmit = async (values: AvailFormValues) => {
    try {
      await createAvail.mutateAsync({
        employeeId: values.employeeId,
        type: values.type,
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      toast("success", "Müsaitlik bloğu eklendi.");
      setModal(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Bir hata oluştu.";
      toast("error", msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.block) return;
    try {
      await deleteAvail.mutateAsync(deleteDialog.block.id);
      toast("success", "Silindi.");
    } catch {
      toast("error", "Silme başarısız.");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {canManageAll && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Çalışan:</label>
            <select
              className="h-8 rounded border border-input text-sm px-2"
              value={filterEmployeeId ?? ""}
              onChange={(e) => setFilterEmployeeId(e.target.value || undefined)}
            >
              <option value="">Tümü</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Engel Ekle
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !blocks?.length ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
          <CalendarX className="h-8 w-8 opacity-40" />
          <p className="text-sm">Henüz müsaitlik engeli yok</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Çalışan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gün</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tür</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Saat Aralığı</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarih Aralığı</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blocks.map((block) => (
                <tr key={block.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{block.employee?.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">{DAY_LABELS[block.dayOfWeek]}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        block.type === "UNAVAILABLE"
                          ? "destructive"
                          : block.type === "PREFER_NOT"
                            ? "warning"
                            : "info"
                      }
                    >
                      {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {block.startTime && block.endTime
                      ? `${block.startTime} – ${block.endTime}`
                      : "Tüm gün"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {block.startDate
                      ? `${block.startDate}${block.endDate ? ` – ${block.endDate}` : "+"}`
                      : "Her hafta"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, block })}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Dialog
        open={modal}
        onClose={() => setModal(false)}
        title="Müsaitlik Engeli Ekle"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {canManageAll && (
            <div className="space-y-1.5">
              <Label>Çalışan</Label>
              <Select error={errors.employeeId?.message} {...register("employeeId")}>
                <option value="">Seçin...</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gün</Label>
              <Select {...register("dayOfWeek")}>
                {DAY_LABELS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Engellin Türü</Label>
              <Select {...register("type")}>
                <option value="UNAVAILABLE">Müsait Değil</option>
                <option value="PREFER_NOT">Tercih Değil</option>
                <option value="AVAILABLE_ONLY">Sadece Bu Saatler</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Başlangıç Saati (opsiyonel)</Label>
              <Input type="time" {...register("startTime")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bitiş Saati (opsiyonel)</Label>
              <Input type="time" {...register("endTime")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Başlangıç Tarihi (opsiyonel)</Label>
              <Input type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bitiş Tarihi (opsiyonel)</Label>
              <Input type="date" {...register("endDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModal(false)} disabled={isSubmitting}>
              İptal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Ekle
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title="Müsaitlik Engelini Sil"
        description="Bu müsaitlik engelini silmek istediğinizden emin misiniz?"
        confirmLabel="Sil"
        loading={deleteAvail.isPending}
      />
    </div>
  );
}
