"use client";

import { useState } from "react";
import { Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { WeekPicker } from "@/components/schedule/WeekPicker";
import { WeeklyGrid } from "@/components/schedule/WeeklyGrid";
import { ShiftModal } from "@/components/schedule/ShiftModal";
import { CopyWeekModal } from "@/components/schedule/CopyWeekModal";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklySchedule, useDeleteShift, useAcknowledgeShift, useUpdateShift } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/components/ui/toast";
import { getMonday, getWeekDates } from "@/lib/utils";
import type { Shift } from "@/types";

export default function SchedulePage() {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const { toast } = useToast();

  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const weekDays = getWeekDates(currentMonday);

  const { data: schedule, isLoading } = useWeeklySchedule(currentMonday);
  const { data: employees = [] } = useEmployees(true);

  const deleteShift = useDeleteShift();
  const acknowledgeShift = useAcknowledgeShift();
  const updateShift = useUpdateShift();

  const canManage = isAdmin || isManager;

  // Modal states
  const [shiftModal, setShiftModal] = useState<{
    open: boolean;
    shift?: Shift | null;
    prefillDate?: string;
    prefillEmployee?: string;
  }>({ open: false });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; shift?: Shift }>({
    open: false,
  });

  const [copyModal, setCopyModal] = useState(false);

  const handleAddShift = (employeeId: string, date: string) => {
    setShiftModal({ open: true, prefillDate: date, prefillEmployee: employeeId });
  };

  const handleEditShift = (shift: Shift) => {
    setShiftModal({ open: true, shift });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.shift) return;
    try {
      await deleteShift.mutateAsync(deleteDialog.shift.id);
      toast("success", "Vardiya silindi.");
    } catch {
      toast("error", "Silme işlemi başarısız.");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const handleAcknowledge = async (shift: Shift) => {
    try {
      await acknowledgeShift.mutateAsync(shift.id);
      toast("success", "Vardiya onaylandı.");
    } catch {
      toast("error", "Onaylama başarısız.");
    }
  };

  const handleMoveShift = async (shiftId: string, newEmployeeId: string, newDate: string) => {
    try {
      // Find the shift to calculate the time offset
      const allShifts = schedule?.employees.flatMap((e) =>
        e.days.flatMap((d) => d.shifts)
      ) ?? [];
      const shift = allShifts.find((s) => s.id === shiftId);
      if (!shift) return;

      const origStart = new Date(shift.startTime);
      const origEnd = new Date(shift.endTime);
      const duration = origEnd.getTime() - origStart.getTime();

      // Build new start time on newDate with the same hour
      const [year, month, day] = newDate.split("-").map(Number);
      const newStart = new Date(origStart);
      newStart.setFullYear(year, month - 1, day);
      const newEnd = new Date(newStart.getTime() + duration);

      await updateShift.mutateAsync({
        id: shiftId,
        data: {
          employeeId: newEmployeeId,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        },
      });
      toast("success", "Vardiya taşındı.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Taşıma başarısız.";
      toast("error", msg);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <WeekPicker currentMonday={currentMonday} onChange={setCurrentMonday} />
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCopyModal(true)}
            >
              <Copy className="h-4 w-4" />
              Haftayı Kopyala
            </Button>
            <Button size="sm" onClick={() => setShiftModal({ open: true })}>
              <Plus className="h-4 w-4" />
              Vardiya Ekle
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <WeeklyGrid
        schedule={schedule}
        isLoading={isLoading}
        weekDays={weekDays}
        canManage={canManage}
        isEmployee={isEmployee}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        onDeleteShift={(shift) => setDeleteDialog({ open: true, shift })}
        onAcknowledgeShift={handleAcknowledge}
        onMoveShift={handleMoveShift}
      />

      {/* Modals */}
      <ShiftModal
        open={shiftModal.open}
        onClose={() => setShiftModal({ open: false })}
        shift={shiftModal.shift}
        employees={employees}
        preselectedDate={shiftModal.prefillDate}
        preselectedEmployeeId={shiftModal.prefillEmployee}
      />

      <CopyWeekModal
        open={copyModal}
        onClose={() => setCopyModal(false)}
        currentWeek={currentMonday}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        title="Vardiyayı Sil"
        description="Bu vardiyayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        loading={deleteShift.isPending}
      />
    </div>
  );
}
