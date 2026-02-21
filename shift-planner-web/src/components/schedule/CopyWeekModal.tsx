"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useToast } from "@/components/ui/toast";
import { useCopyWeek } from "@/hooks/useShifts";

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
    <Modal opened={open} onClose={onClose} title="Haftayi Kopyala" size="sm" centered>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="sm">
          <TextInput
            type="date"
            label="Kaynak Hafta (Pazartesi)"
            error={errors.sourceWeek?.message}
            {...register("sourceWeek")}
          />
          <TextInput
            type="date"
            label="Hedef Hafta (Pazartesi)"
            error={errors.targetWeek?.message}
            {...register("targetWeek")}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Iptal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Kopyala
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
