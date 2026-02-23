"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconCalendarWeek,
  IconShieldLock,
  IconChartBar,
  IconUsers,
  IconArrowRight,
  IconSparkles,
} from "@tabler/icons-react";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "En az 6 karakter"),
});

const registerSchema = z
  .object({
    firstName: z.string().min(2, "En az 2 karakter"),
    lastName: z.string().min(2, "En az 2 karakter"),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z
      .string()
      .min(8, "En az 8 karakter")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Büyük/küçük harf + rakam"),
    confirmPassword: z.string().min(1, "Zorunlu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function getErr(err: unknown, fallback: string) {
  const d = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof d === "string") return d;
  if (d && typeof d === "object") {
    const m = (d as { message?: unknown }).message;
    if (Array.isArray(m) && m.length > 0) return String(m[0]);
    if (typeof m === "string") return m;
  }
  return fallback;
}

const DEMOS = [
  { role: "Admin", email: "admin@shiftplanner.com", pass: "Admin1234!" },
  { role: "Mudur", email: "manager@shiftplanner.com", pass: "Manager1234!" },
  { role: "Calisan", email: "ali@shiftplanner.com", pass: "Employee1234!" },
];

const FEATURES = [
  { icon: IconCalendarWeek, label: "Haftalik Planlama", desc: "Surukle-birak vardiya" },
  { icon: IconUsers, label: "Calisan Takibi", desc: "Uygunluk ve mesai kontrolu" },
  { icon: IconChartBar, label: "Raporlar", desc: "Maliyet ve fazla mesai" },
  { icon: IconShieldLock, label: "Guvenli Erisim", desc: "Rol tabanli yetkilendirme" },
];

export default function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const {
    register: reg,
    handleSubmit: handleReg,
    formState: { errors: rErr, isSubmitting: rSub },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onLogin = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      toast("error", getErr(err, "E-posta veya şifre hatalı."));
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      toast("success", "Hesabınız oluşturuldu!");
    } catch (err) {
      toast("error", getErr(err, "Kayıt başarısız."));
    }
  };

  // Doğrudan login() çağırır — form doldurmaz
  const handleDemoLogin = async (email: string, pass: string) => {
    setDemoLoading(email);
    try {
      await login(email, pass);
    } catch (err) {
      toast("error", getErr(err, "Demo giriş başarısız."));
      setDemoLoading(null);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg, #090c16 0%, #0f1424 50%, #151a2e 100%)"
          : "linear-gradient(135deg, #f0f4ff 0%, #e8effd 50%, #f5f3ff 100%)",
      }}
    >
      {/* Ambient shapes */}
      <Box
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: isDark
            ? "radial-gradient(500px 240px at 5% 10%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(400px 260px at 90% 20%, rgba(14,165,233,0.2), transparent 60%), radial-gradient(420px 260px at 80% 85%, rgba(236,72,153,0.18), transparent 60%)"
            : "radial-gradient(500px 240px at 5% 10%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(400px 260px at 90% 20%, rgba(14,165,233,0.06), transparent 60%)",
        }}
      />
      <Box
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(120deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)",
          opacity: isDark ? 0.4 : 0.15,
        }}
      />

      <Box style={{ position: "relative", zIndex: 1, width: "100%", padding: "32px" }}>
        <Grid gutter="xl" align="center">
          {/* Left panel */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg">
              <Group gap="sm">
                <Paper
                  radius="md"
                  p={8}
                  style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(99,102,241,0.85))",
                    boxShadow: "0 12px 30px rgba(59,130,246,0.3)",
                  }}
                >
                  <IconCalendarWeek size={18} color="white" />
                </Paper>
                <Box>
                  <Text fw={700} size="lg">Vardiya Planlayici</Text>
                  <Text size="xs" c="dimmed">Ekip Yonetim Platformu</Text>
                </Box>
              </Group>

              <Title order={1} style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05 }}>
                Ekibinizi <br />
                <Text span c={isDark ? "blue.2" : "blue.7"} fw={800}>
                  Akillica
                </Text>{" "}
                yonetin.
              </Title>
              <Text c="dimmed" size="sm">
                Surukle-birak ile vardiya planla, mesaileri takip et, raporlari aninda gor.
              </Text>

              <Stack gap="sm">
                {FEATURES.map(({ icon: Icon, label, desc }) => (
                  <Group key={label} gap="sm" wrap="nowrap">
                    <Paper
                      radius="md"
                      p={8}
                      style={{
                        background: isDark
                          ? "rgba(99,102,241,0.12)"
                          : "rgba(99,102,241,0.08)",
                        border: isDark
                          ? "1px solid rgba(99,102,241,0.3)"
                          : "1px solid rgba(99,102,241,0.15)",
                      }}
                    >
                      <Icon size={16} color={isDark ? "#a5b4fc" : "#6366f1"} />
                    </Paper>
                    <Box>
                      <Text fw={600} size="sm">{label}</Text>
                      <Text size="xs" c="dimmed">{desc}</Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Right panel */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              radius="xl"
              p="xl"
              withBorder
              style={{
                background: isDark
                  ? "rgba(12, 18, 28, 0.85)"
                  : "#fff",
                borderColor: isDark
                  ? "var(--mantine-color-dark-4)"
                  : "#e2e8f0",
                boxShadow: isDark
                  ? "0 24px 60px rgba(0,0,0,0.45)"
                  : "0 24px 60px rgba(37,99,235,0.1)",
              }}
            >
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconSparkles size={18} />
                  <Text fw={700}>Hizli Giris</Text>
                </Group>
                <Badge variant="light" color="blue">Beta</Badge>
              </Group>

              <Tabs value={mode} onChange={(v) => setMode((v as "login" | "register") ?? "login")}>
                <Tabs.List grow>
                  <Tabs.Tab value="login">Giris</Tabs.Tab>
                  <Tabs.Tab value="register">Kayit</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="login" pt="md">
                  <form onSubmit={handleSubmit(onLogin)}>
                    <Stack gap="sm">
                      <TextInput
                        label="E-posta"
                        placeholder="ornek@firma.com"
                        error={errors.email?.message}
                        {...register("email")}
                      />
                      <PasswordInput
                        label="Sifre"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register("password")}
                      />
                      <Button type="submit" rightSection={<IconArrowRight size={16} />} loading={isSubmitting}>
                        Giris Yap
                      </Button>
                    </Stack>
                  </form>

                  <Divider my="md" label="Demo" labelPosition="center" />
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                    {DEMOS.map((demo) => (
                      <Button
                        key={demo.email}
                        variant="light"
                        onClick={() => handleDemoLogin(demo.email, demo.pass)}
                        loading={demoLoading === demo.email}
                      >
                        {demo.role}
                      </Button>
                    ))}
                  </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="register" pt="md">
                  <form onSubmit={handleReg(onRegister)}>
                    <Stack gap="sm">
                      <Group grow>
                        <TextInput
                          label="Ad"
                          error={rErr.firstName?.message}
                          {...reg("firstName")}
                        />
                        <TextInput
                          label="Soyad"
                          error={rErr.lastName?.message}
                          {...reg("lastName")}
                        />
                      </Group>
                      <TextInput
                        label="E-posta"
                        error={rErr.email?.message}
                        {...reg("email")}
                      />
                      <PasswordInput
                        label="Sifre"
                        error={rErr.password?.message}
                        {...reg("password")}
                      />
                      <PasswordInput
                        label="Sifre Tekrar"
                        error={rErr.confirmPassword?.message}
                        {...reg("confirmPassword")}
                      />
                      <Button type="submit" rightSection={<IconArrowRight size={16} />} loading={rSub}>
                        Kayit Ol
                      </Button>
                    </Stack>
                  </form>
                </Tabs.Panel>
              </Tabs>
            </Paper>
          </Grid.Col>
        </Grid>
      </Box>
    </Box>
  );
}
