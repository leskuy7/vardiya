"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { CalendarDays, KeyRound, UserPlus } from "lucide-react";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Şifre büyük/küçük harf ve rakam içermelidir"),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function getErrorMessage(err: unknown, fallback: string) {
  const responseData = (err as { response?: { data?: unknown } })?.response?.data;

  if (typeof responseData === "string") return responseData;

  if (responseData && typeof responseData === "object") {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

export default function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const {
    register: registerField,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      toast("error", getErrorMessage(err, "Giriş başarısız. E-posta veya şifre hatalı."));
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
      toast("success", "Hesabınız oluşturuldu. Giriş yapılıyor...");
    } catch (err: unknown) {
      toast("error", getErrorMessage(err, "Kayıt başarısız. Bilgilerinizi kontrol edin."));
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <section className="hidden rounded-2xl border bg-card p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Vardiya Planlayıcı</h1>
                <p className="text-sm text-muted-foreground">Ekip planlamayı tek ekrandan yönet</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>• Haftalık vardiya planlarını hızlıca oluştur.</p>
              <p>• Çalışan uygunluklarını tek panelde takip et.</p>
              <p>• Fazla mesai ve saat raporlarını otomatik hesapla.</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="mb-2 font-semibold">Demo hesaplar:</p>
            <p>Admin: admin@shiftplanner.com / Admin1234!</p>
            <p>Yönetici: manager@shiftplanner.com / Manager1234!</p>
            <p>Çalışan: ali@shiftplanner.com / Employee1234!</p>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login"
                  ? "Hesabınıza giriş yaparak devam edin"
                  : "Dakikalar içinde yeni hesap oluşturun"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Giriş
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Kayıt
              </button>
            </div>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                <KeyRound className="h-4 w-4" />
                Giriş Yap
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    placeholder="Ali"
                    error={registerErrors.firstName?.message}
                    {...registerField("firstName")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    placeholder="Yılmaz"
                    error={registerErrors.lastName?.message}
                    {...registerField("lastName")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registerEmail">E-posta</Label>
                <Input
                  id="registerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  error={registerErrors.email?.message}
                  {...registerField("email")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registerPassword">Şifre</Label>
                <Input
                  id="registerPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                  error={registerErrors.password?.message}
                  {...registerField("password")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Şifrenizi tekrar girin"
                  error={registerErrors.confirmPassword?.message}
                  {...registerField("confirmPassword")}
                />
              </div>

              <Button type="submit" className="w-full" loading={isRegisterSubmitting}>
                <UserPlus className="h-4 w-4" />
                Hesap Oluştur
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Google ile giriş yok. E-posta ve şifre ile güvenli giriş kullanılır.
          </p>
        </section>
      </div>
    </div>
  );
}
