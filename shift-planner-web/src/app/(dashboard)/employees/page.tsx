"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks/useEmployees";
import type { Employee } from "@/types";

const employeeSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter"),
  email: z.string().email("Geçerli e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const { toast } = useToast();
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [modal, setModal] = useState<{ open: boolean; employee?: Employee }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee?: Employee }>({
    open: false,
  });

  const isEdit = !!modal.employee;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: { role: "EMPLOYEE" },
  });

  const openCreate = () => {
    reset({ role: "EMPLOYEE" });
    setModal({ open: true });
  };

  const openEdit = (emp: Employee) => {
    reset({
      name: emp.user.name,
      email: emp.user.email,
      role: emp.user.role as any,
      position: emp.position ?? "",
      department: emp.department ?? "",
      phone: emp.phone ?? "",
      hourlyRate: emp.hourlyRate ?? undefined,
      password: "",
    });
    setModal({ open: true, employee: emp });
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    try {
      if (isEdit && modal.employee) {
        await updateEmployee.mutateAsync({
          id: modal.employee.id,
          data: {
            name: values.name,
            position: values.position,
            department: values.department,
            phone: values.phone,
            hourlyRate: values.hourlyRate,
          },
        });
        toast("success", "Çalışan güncellendi.");
      } else {
        await createEmployee.mutateAsync({
          name: values.name,
          email: values.email,
          password: values.password ?? "",
          role: values.role,
          position: values.position,
          department: values.department,
          phone: values.phone,
          hourlyRate: values.hourlyRate,
        });
        toast("success", "Çalışan oluşturuldu.");
      }
      setModal({ open: false });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Bir hata oluştu.";
      toast("error", msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.employee) return;
    try {
      await deleteEmployee.mutateAsync(deleteDialog.employee.id);
      toast("success", "Çalışan pasife alındı.");
    } catch {
      toast("error", "İşlem başarısız.");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{employees?.length ?? 0} çalışan</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Yeni Çalışan
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ad</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-posta</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pozisyon</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Departman</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Durum</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees?.map((emp) => (
              <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{emp.user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{emp.user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{emp.position ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{emp.department ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      emp.user.role === "ADMIN"
                        ? "default"
                        : emp.user.role === "MANAGER"
                        ? "info"
                        : "secondary"
                    }
                  >
                    {emp.user.role === "ADMIN"
                      ? "Admin"
                      : emp.user.role === "MANAGER"
                      ? "Yönetici"
                      : "Çalışan"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {emp.isActive ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs">
                      <UserCheck className="h-3.5 w-3.5" /> Aktif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <UserX className="h-3.5 w-3.5" /> Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(emp)}
                      title="Düzenle"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {emp.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, employee: emp })}
                        title="Pasife Al"
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={isEdit ? "Çalışanı Düzenle" : "Yeni Çalışan Ekle"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ad Soyad</Label>
              <Input error={errors.name?.message} {...register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input
                type="email"
                disabled={isEdit}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Şifre</Label>
                <Input
                  type="password"
                  placeholder="En az 8 karakter"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select {...register("role")}>
                  <option value="EMPLOYEE">Çalışan</option>
                  <option value="MANAGER">Yönetici</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pozisyon</Label>
              <Input placeholder="Garson, Kasiyer..." {...register("position")} />
            </div>
            <div className="space-y-1.5">
              <Label>Departman</Label>
              <Input placeholder="Servis, Mutfak..." {...register("department")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input type="tel" placeholder="+90 555 000 0000" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Saatlik Ücret (₺)</Label>
              <Input type="number" min="0" step="0.01" {...register("hourlyRate")} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModal({ open: false })}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title="Çalışanı Pasife Al"
        description={`${deleteDialog.employee?.user.name} adlı çalışan pasife alınacak. Geçmiş vardiyaları silinmeyecek.`}
        confirmLabel="Pasife Al"
        loading={deleteEmployee.isPending}
      />
    </div>
  );
}
