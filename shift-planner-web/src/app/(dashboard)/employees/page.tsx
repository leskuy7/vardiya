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
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconUsers,
  IconPlus,
  IconPencil,
  IconTrash,
  IconUserCheck,
  IconUserX,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks/useEmployees";
import type { Employee } from "@/types";

const employeeSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter"),
  lastName: z.string().min(2, "Soyad en az 2 karakter"),
  email: z.string().email("Gecerli e-posta girin"),
  password: z.string()
    .min(8, "Şifre en az 8 karakter")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  position: z.string().optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Yönetici" },
  { value: "EMPLOYEE", label: "Çalışan" },
];

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "grape",
  MANAGER: "blue",
  EMPLOYEE: "gray",
};

export default function EmployeesPage() {
  const { toast } = useToast();
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const [modal, setModal] = useState<{ open: boolean; employee?: Employee }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee?: Employee }>({ open: false });

  const isEdit = !!modal.employee;

  const {
    control,
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
      firstName: emp.user?.firstName,
      lastName: emp.user?.lastName,
      email: emp.user?.email,
      role: emp.user.role as EmployeeFormValues["role"],
      position: emp.position ?? "",
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
            firstName: values.firstName,
            lastName: values.lastName,
            position: values.position,
            hourlyRate: values.hourlyRate,
          },
        });
        toast("success", "Çalışan güncellendi.");
      } else {
        await createEmployee.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password ?? "",
          role: values.role,
          position: values.position,
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
      <Center h={260}>
        <Loader size="md" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Paper
        withBorder
        p="md"
        radius="lg"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(14, 116, 144, 0.2), rgba(30, 64, 175, 0.2))"
            : "#fff",
          borderColor: isDark
            ? "var(--mantine-color-dark-4)"
            : "#e2e8f0",
        }}
      >
        <Group justify="space-between" wrap="wrap">
          <Group gap="sm">
            <Paper radius="md" p={8} style={{ background: "rgba(59,130,246,0.2)" }}>
              <IconUsers size={18} />
            </Paper>
            <Box>
              <Title order={4}>Çalışan Listesi</Title>
              <Text size="xs" c="dimmed">{employees?.length ?? 0} kayıtlı çalışan</Text>
            </Box>
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Yeni Çalışan
          </Button>
        </Group>
      </Paper>

      <Paper withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Ad Soyad</Table.Th>
              <Table.Th>E-posta</Table.Th>
              <Table.Th>Pozisyon</Table.Th>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Durum</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>İşlem</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees?.map((emp) => (
              <Table.Tr key={emp.id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <Paper
                      radius="xl"
                      p={0}
                      style={{
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(59,130,246,0.15)",
                        border: "1px solid rgba(59,130,246,0.25)",
                      }}
                    >
                      <Text size="xs" fw={700} c={isDark ? "blue.2" : "blue.7"}>
                        {emp.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </Text>
                    </Paper>
                    <Text size="sm" fw={600}>{emp.user?.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{emp.user?.email}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{emp.position ?? "—"}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={ROLE_COLOR[emp.user?.role ?? "EMPLOYEE"]} variant="light">
                    {emp.user?.role === "ADMIN"
                      ? "Admin"
                      : emp.user?.role === "MANAGER"
                        ? "Yönetici"
                        : "Çalışan"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {emp.isActive ? (
                    <Group gap={6}>
                      <IconUserCheck size={14} color="var(--mantine-color-green-6)" />
                      <Text size="xs" fw={600} c="green.4">Aktif</Text>
                    </Group>
                  ) : (
                    <Group gap={6}>
                      <IconUserX size={14} color="var(--mantine-color-dimmed)" />
                      <Text size="xs" fw={600} c="dimmed">Pasif</Text>
                    </Group>
                  )}
                </Table.Td>
                <Table.Td style={{ textAlign: "right" }}>
                  <Group gap={6} justify="flex-end">
                    <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(emp)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    {emp.isActive && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => setDeleteDialog({ open: true, employee: emp })}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal
        opened={modal.open}
        onClose={() => setModal({ open: false })}
        title={isEdit ? "Çalışanı Düzenle" : "Yeni Çalışan Ekle"}
        size="lg"
        centered
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="sm">
            <Group grow>
              <TextInput label="Ad" error={errors.firstName?.message} {...register("firstName")} />
              <TextInput label="Soyad" error={errors.lastName?.message} {...register("lastName")} />
            </Group>
            <Group grow>
              <TextInput
                label="E-posta"
                type="email"
                disabled={isEdit}
                error={errors.email?.message}
                {...register("email")}
              />
            </Group>

            {!isEdit && (
              <Group grow>
                <TextInput
                  label="Şifre"
                  type="password"
                  placeholder="En az 8 karakter"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Rol"
                      data={ROLE_OPTIONS}
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? "EMPLOYEE")}
                    />
                  )}
                />
              </Group>
            )}

            <Group grow>
              <TextInput label="Pozisyon" placeholder="Garson, Kasiyer..." {...register("position")} />
              <Controller
                name="hourlyRate"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label="Saatlik Ücret (₺)"
                    min={0}
                    step={0.5}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Group>

            <Divider />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModal({ open: false })} disabled={isSubmitting}>
                İptal
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEdit ? "Güncelle" : "Oluştur"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        title="Çalışanı Pasife Al"
        size="sm"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            {deleteDialog.employee?.user.name} adlı çalışan pasife alınacak. Geçmiş vardiyaları silinmeyecek.
          </Text>
          <Divider />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteDialog({ open: false })}>
              İptal
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={deleteEmployee.isPending}>
              Pasife Al
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
