"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { IconCalendarEvent, IconPlus, IconTrash } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import { useAvailability, useCreateAvailability, useDeleteAvailability } from "@/hooks/useAvailability";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import type { AvailabilityBlock } from "@/types";

const DAY_LABELS = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];

const BLOCK_TYPE_LABELS: Record<string, string> = {
  UNAVAILABLE: "Musait Degil",
  PREFER_NOT: "Tercih Degil",
  AVAILABLE_ONLY: "Sadece Bu Saatler",
};

const availSchema = z.object({
  employeeId: z.string().min(1, "Calisan secin"),
  type: z.enum(["UNAVAILABLE", "PREFER_NOT", "AVAILABLE_ONLY"]),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type AvailFormValues = z.infer<typeof availSchema>;

const TYPE_OPTIONS = [
  { value: "UNAVAILABLE", label: "Musait Degil" },
  { value: "PREFER_NOT", label: "Tercih Degil" },
  { value: "AVAILABLE_ONLY", label: "Sadece Bu Saatler" },
];

export default function AvailabilityPage() {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const { toast } = useToast();

  const canManageAll = isAdmin || isManager;
  const { data: employees } = useEmployees(true);
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
    control,
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
      await createAvail.mutateAsync(values);
      toast("success", "Musaitlik blogu eklendi.");
      setModal(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Bir hata olustu.";
      toast("error", msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.block) return;
    try {
      await deleteAvail.mutateAsync(deleteDialog.block.id);
      toast("success", "Silindi.");
    } catch {
      toast("error", "Silme basarisiz.");
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  return (
    <Stack gap="lg">
      <Paper
        withBorder
        p="md"
        radius="lg"
        style={{
          background: "linear-gradient(135deg, rgba(20, 83, 45, 0.2), rgba(15, 23, 42, 0.2))",
          borderColor: "var(--mantine-color-dark-4)",
        }}
      >
        <Group justify="space-between" wrap="wrap">
          <Group gap="sm">
            <Paper radius="md" p={8} style={{ background: "rgba(16, 185, 129, 0.2)" }}>
              <IconCalendarEvent size={18} />
            </Paper>
            <Box>
              <Text fw={700}>Musaitlik Engelleri</Text>
              <Text size="xs" c="dimmed">Takvim kisitlarini yonetin</Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="wrap">
            {canManageAll && (
              <Select
                placeholder="Calisan secin"
                data={[{ value: "", label: "Tumu" }, ...(employees ?? []).map((emp) => ({
                  value: emp.id,
                  label: emp.user.name,
                }))]}
                value={filterEmployeeId ?? ""}
                onChange={(value) => setFilterEmployeeId(value || undefined)}
                searchable
                nothingFoundMessage="Sonuc yok"
              />
            )}
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              Engel Ekle
            </Button>
          </Group>
        </Group>
      </Paper>

      {isLoading ? (
        <Center h={220}>
          <Loader size="md" />
        </Center>
      ) : !blocks?.length ? (
        <Paper withBorder radius="lg" p="xl">
          <Center h={160}>
            <Stack gap={6} align="center">
              <IconCalendarEvent size={28} color="#64748b" />
              <Text size="sm" c="dimmed">Henuz musaitlik engeli yok</Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Paper withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Calisan</Table.Th>
                <Table.Th>Gun</Table.Th>
                <Table.Th>Tur</Table.Th>
                <Table.Th>Saat Araligi</Table.Th>
                <Table.Th>Tarih Araligi</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Islem</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {blocks.map((block) => (
                <Table.Tr key={block.id}>
                  <Table.Td>
                    <Text size="sm" fw={600}>{block.employee?.user?.name ?? "—"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{DAY_LABELS[block.dayOfWeek]}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        block.type === "UNAVAILABLE"
                          ? "red"
                          : block.type === "PREFER_NOT"
                            ? "yellow"
                            : "blue"
                      }
                      variant="light"
                    >
                      {BLOCK_TYPE_LABELS[block.type] ?? block.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {block.startTime && block.endTime
                        ? `${block.startTime} – ${block.endTime}`
                        : "Tum gun"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {block.startDate
                        ? `${block.startDate}${block.endDate ? ` – ${block.endDate}` : "+"}`
                        : "Her hafta"}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => setDeleteDialog({ open: true, block })}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal opened={modal} onClose={() => setModal(false)} title="Musaitlik Engeli Ekle" size="lg" centered>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="sm">
            {canManageAll && (
              <Controller
                name="employeeId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Calisan"
                    placeholder="Secin..."
                    data={(employees ?? []).map((emp) => ({
                      value: emp.id,
                      label: emp.user.name,
                    }))}
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? "")}
                    error={errors.employeeId?.message}
                    searchable
                    nothingFoundMessage="Sonuc yok"
                  />
                )}
              />
            )}

            <Group grow>
              <Controller
                name="dayOfWeek"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Gun"
                    data={DAY_LABELS.map((d, i) => ({ value: String(i), label: d }))}
                    value={String(field.value)}
                    onChange={(value) => field.onChange(Number(value ?? 0))}
                  />
                )}
              />
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Engel Turu"
                    data={TYPE_OPTIONS}
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? "UNAVAILABLE")}
                  />
                )}
              />
            </Group>

            <Group grow>
              <TextInput label="Baslangic Saati (opsiyonel)" type="time" {...register("startTime")} />
              <TextInput label="Bitis Saati (opsiyonel)" type="time" {...register("endTime")} />
            </Group>

            <Group grow>
              <TextInput label="Baslangic Tarihi (opsiyonel)" type="date" {...register("startDate")} />
              <TextInput label="Bitis Tarihi (opsiyonel)" type="date" {...register("endDate")} />
            </Group>

            <Divider />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModal(false)} disabled={isSubmitting}>
                Iptal
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Ekle
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        title="Musaitlik Engelini Sil"
        size="sm"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Bu musaitlik engelini silmek istediginizden emin misiniz?
          </Text>
          <Divider />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteDialog({ open: false })}>
              Iptal
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={deleteAvail.isPending}>
              Sil
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
