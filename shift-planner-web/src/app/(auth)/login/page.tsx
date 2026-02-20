"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  CalendarDays,
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Globe2,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/* ─── Schemas ─── */
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
type Lang = "tr" | "en";

/* ─── i18n ─── */
const copy: Record<Lang, Record<string, string>> = {
  tr: {
    titleLogin: "Giriş Yap",
    titleRegister: "Kayıt Ol",
    subtitleLogin: "Hesabınıza giriş yaparak devam edin",
    subtitleRegister: "Dakikalar içinde yeni hesap oluşturun",
    email: "E-posta",
    password: "Şifre",
    passwordAgain: "Şifre (Tekrar)",
    firstName: "Ad",
    lastName: "Soyad",
    login: "Giriş Yap",
    register: "Hesap Oluştur",
    forgot: "Şifremi Unuttum",
    noGoogle: "Güvenli e-posta ve şifre ile giriş yapılır.",
    supportToast: "Şifre sıfırlama için yöneticinize veya destek mailine yazın.",
    feature1: "Haftalık Planlama",
    feature1Desc: "Sürükle-bırak ile kolay vardiya oluşturma",
    feature2: "Gerçek Zamanlı Takip",
    feature2Desc: "Çalışan mesai ve uygunluk kontrolü",
    feature3: "Detaylı Raporlar",
    feature3Desc: "Maliyet ve fazla mesai analizi",
    demoTitle: "Demo Hesaplar",
  },
  en: {
    titleLogin: "Sign In",
    titleRegister: "Create Account",
    subtitleLogin: "Continue with your account",
    subtitleRegister: "Create a new account in minutes",
    email: "Email",
    password: "Password",
    passwordAgain: "Password (Repeat)",
    firstName: "First name",
    lastName: "Last name",
    login: "Sign In",
    register: "Create Account",
    forgot: "Forgot password",
    noGoogle: "Secure email & password authentication.",
    supportToast: "Contact your admin or support to reset password.",
    feature1: "Weekly Planning",
    feature1Desc: "Easy shift creation with drag & drop",
    feature2: "Real-time Tracking",
    feature2Desc: "Employee overtime & availability control",
    feature3: "Detailed Reports",
    feature3Desc: "Cost and overtime analysis",
    demoTitle: "Demo Accounts",
  },
};

function getErrorMessage(err: unknown, fallback: string) {
  const responseData = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData && typeof responseData === "object") {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message) && message.length > 0) return String(message[0]);
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<Lang>("tr");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPassword2, setShowRegisterPassword2] = useState(false);

  const t = useMemo(() => copy[lang], [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    const savedLang = (localStorage.getItem("lang") as Lang | null) ?? "tr";
    setLang(savedLang);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const toggleLang = () => {
    const next = lang === "tr" ? "en" : "tr";
    setLang(next);
    localStorage.setItem("lang", next);
  };

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
    <div className="flex min-h-screen bg-background">
      {/* ── Left: Branding Panel ── */}
      <section className="hidden w-[480px] shrink-0 bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-blue-400 text-white shadow-lg shadow-primary/20">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Vardiya Planlayıcı</h1>
              <p className="text-xs text-sidebar-foreground/50">Ekip Yönetim Platformu</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { icon: CalendarDays, title: t.feature1, desc: t.feature1Desc },
              { icon: Clock, title: t.feature2, desc: t.feature2Desc },
              { icon: BarChart3, title: t.feature3, desc: t.feature3Desc },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <Icon className="h-5 w-5 text-sidebar-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-sidebar-foreground/50 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-5">
          <p className="text-xs font-semibold text-sidebar-foreground/70 mb-3 uppercase tracking-wider">{t.demoTitle}</p>
          <div className="space-y-1.5 text-xs text-sidebar-foreground/50 font-mono">
            <p>admin@shiftplanner.com / Admin1234!</p>
            <p>manager@shiftplanner.com / Manager1234!</p>
            <p>ali@shiftplanner.com / Employee1234!</p>
          </div>
        </div>
      </section>

      {/* ── Right: Auth Form ── */}
      <section className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center justify-end gap-2 mb-8">
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:border-foreground/20"
            >
              <Globe2 className="h-3.5 w-3.5" />
              {lang === "tr" ? "TR" : "EN"}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-lg border p-1.5 text-muted-foreground transition hover:text-foreground hover:border-foreground/20"
            >
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? t.titleLogin : t.titleRegister}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "login" ? t.subtitleLogin : t.subtitleRegister}
            </p>
          </div>

          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.titleLogin}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.titleRegister}
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.email}</Label>
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
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    toast("info", t.supportToast);
                    if (typeof window !== "undefined") {
                      window.open("mailto:destek@vardiya.app?subject=Sifre%20Sifirlama", "_blank");
                    }
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  {t.forgot}
                </button>
              </div>

              <Button type="submit" className="w-full h-11" loading={isSubmitting}>
                <KeyRound className="h-4 w-4" />
                {t.login}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">{t.firstName}</Label>
                  <Input
                    id="firstName"
                    placeholder="Ali"
                    error={registerErrors.firstName?.message}
                    {...registerField("firstName")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">{t.lastName}</Label>
                  <Input
                    id="lastName"
                    placeholder="Yılmaz"
                    error={registerErrors.lastName?.message}
                    {...registerField("lastName")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registerEmail">{t.email}</Label>
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
                <Label htmlFor="registerPassword">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="registerPassword"
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="En az 8 karakter"
                    error={registerErrors.password?.message}
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">{t.passwordAgain}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showRegisterPassword2 ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Şifrenizi tekrar girin"
                    error={registerErrors.confirmPassword?.message}
                    {...registerField("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword2((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showRegisterPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" loading={isRegisterSubmitting}>
                <UserPlus className="h-4 w-4" />
                {t.register}
              </Button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>{t.noGoogle}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
