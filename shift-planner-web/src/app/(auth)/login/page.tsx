"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
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
    <div className="flex min-h-screen font-sans bg-gray-50 dark:bg-[#0A0A0B] text-foreground selection:bg-blue-500/30">
      {/* Left side - Branding/Hero (Visible on md+) */}
      <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-900/20 mix-blend-multiply" />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <CalendarDays className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Vardiya Planlayıcı</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-6">
            Ekibinizin Mesaisini <br />
            <span className="text-blue-400">Akıllıca Yönetin.</span>
          </h2>
          <p className="text-lg text-zinc-400">
            Vardiya Planlayıcı ile çalışanlarınızın mesai saatlerini, izinlerini ve uygunluk durumlarını tek bir merkezden kolayca organize edin.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-zinc-500">
          <Globe2 className="h-4 w-4" />
          <span>tr-TR / en-US</span>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-[400px]">

          {/* Header */}
          <div className="mb-8">
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <CalendarDays className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">Vardiya Planlayıcı</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {mode === "login" ? t.titleLogin : t.titleRegister}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "login" ? t.subtitleLogin : t.subtitleRegister}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleLang}
                  className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {lang.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Form container */}
          <div className="mt-8 rounded-xl bg-background border shadow-sm p-6 sm:p-8">
            {mode === "login" ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ornek@sirket.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    {...register("email")}
                  />
                  {errors.email?.message && <p className="text-[13px] text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        toast("info", t.supportToast);
                        if (typeof window !== "undefined") {
                          window.open("mailto:destek@vardiya.app?subject=Sifre%20Sifirlama", "_blank");
                        }
                      }}
                      className="text-[13px] font-medium text-primary hover:underline"
                    >
                      {t.forgot}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 transition-all"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password?.message && <p className="text-[13px] text-destructive">{errors.password.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      t.login
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.firstName}
                    </label>
                    <input
                      id="firstName"
                      placeholder="Ali"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                      {...registerField("firstName")}
                    />
                    {registerErrors.firstName?.message && <p className="text-[13px] text-destructive">{registerErrors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t.lastName}
                    </label>
                    <input
                      id="lastName"
                      placeholder="Yılmaz"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                      {...registerField("lastName")}
                    />
                    {registerErrors.lastName?.message && <p className="text-[13px] text-destructive">{registerErrors.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="registerEmail" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.email}
                  </label>
                  <input
                    id="registerEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="ornek@sirket.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    {...registerField("email")}
                  />
                  {registerErrors.email?.message && <p className="text-[13px] text-destructive">{registerErrors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="registerPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.password}
                  </label>
                  <div className="relative">
                    <input
                      id="registerPassword"
                      type={showRegisterPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="En az 8 karakter"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 transition-all"
                      {...registerField("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerErrors.password?.message && <p className="text-[13px] text-destructive">{registerErrors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.passwordAgain}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showRegisterPassword2 ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Şifrenizi tekrar girin"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 transition-all"
                      {...registerField("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword2((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showRegisterPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword?.message && <p className="text-[13px] text-destructive">{registerErrors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegisterSubmitting}
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isRegisterSubmitting ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      t.register
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Veya
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {mode === "login" ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
              </button>
            </div>
          </div>

          {/* Demo Accounts Panel */}
          <div className="mt-8 overflow-hidden rounded-xl border bg-muted/30">
            <div className="border-b bg-muted/50 px-4 py-3">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t.demoTitle}
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {[
                  { role: "Admin", email: "admin@shiftplanner.com", pass: "Admin1234!" },
                  { role: "Müdür", email: "manager@shiftplanner.com", pass: "Manager1234!" },
                  { role: "Çalışan", email: "ali@shiftplanner.com", pass: "Employee1234!" },
                ].map((d) => (
                  <div key={d.role} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <span className="text-[13px] font-medium text-foreground">{d.role}</span>
                    <span className="text-[12px] text-muted-foreground font-mono select-all">
                      {d.email} <span className="mx-1 text-border">/</span> {d.pass}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
  );
}
