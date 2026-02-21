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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[480px] animate-[slide-up_0.4s_ease-out]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Vardiya Planlayıcı</h1>
          <p className="mt-1 text-sm text-blue-200/60">Ekip Yönetim Platformu</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {/* Top Controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Tab Switcher */}
            <div className="flex gap-1 rounded-xl bg-white/[0.06] p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {t.titleLogin}
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {t.titleRegister}
              </button>
            </div>

            {/* Lang + Theme */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
              >
                <Globe2 className="h-3.5 w-3.5" />
                {lang === "tr" ? "TR" : "EN"}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
              >
                {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {mode === "login" ? t.titleLogin : t.titleRegister}
            </h2>
            <p className="mt-1 text-sm text-white/40">
              {mode === "login" ? t.subtitleLogin : t.subtitleRegister}
            </p>
          </div>

          {/* Login Form */}
          {mode === "login" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-white/70">{t.email}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  {...register("email")}
                />
                {errors.email?.message && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-white/70">{t.password}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 pr-10 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password?.message && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    toast("info", t.supportToast);
                    if (typeof window !== "undefined") {
                      window.open("mailto:destek@vardiya.app?subject=Sifre%20Sifirlama", "_blank");
                    }
                  }}
                  className="text-xs text-blue-400/80 hover:text-blue-300 transition-colors font-medium"
                >
                  {t.forgot}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {t.login}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium text-white/70">{t.firstName}</label>
                  <input
                    id="firstName"
                    placeholder="Ali"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    {...registerField("firstName")}
                  />
                  {registerErrors.firstName?.message && <p className="text-xs text-red-400">{registerErrors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium text-white/70">{t.lastName}</label>
                  <input
                    id="lastName"
                    placeholder="Yılmaz"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    {...registerField("lastName")}
                  />
                  {registerErrors.lastName?.message && <p className="text-xs text-red-400">{registerErrors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="registerEmail" className="text-sm font-medium text-white/70">{t.email}</label>
                <input
                  id="registerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  {...registerField("email")}
                />
                {registerErrors.email?.message && <p className="text-xs text-red-400">{registerErrors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="registerPassword" className="text-sm font-medium text-white/70">{t.password}</label>
                <div className="relative">
                  <input
                    id="registerPassword"
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="En az 8 karakter"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 pr-10 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerErrors.password?.message && <p className="text-xs text-red-400">{registerErrors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/70">{t.passwordAgain}</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showRegisterPassword2 ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Şifrenizi tekrar girin"
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 pr-10 text-sm text-white placeholder:text-white/25 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    {...registerField("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword2((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showRegisterPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerErrors.confirmPassword?.message && <p className="text-xs text-red-400">{registerErrors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRegisterSubmitting ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {t.register}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts */}
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">{t.demoTitle}</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { role: "Admin", email: "admin@shiftplanner.com", pass: "Admin1234!" },
              { role: "Yönetici", email: "manager@shiftplanner.com", pass: "Manager1234!" },
              { role: "Çalışan", email: "ali@shiftplanner.com", pass: "Employee1234!" },
            ].map((d) => (
              <div key={d.role} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 rounded-lg bg-white/[0.03] px-3 py-2">
                <span className="text-xs font-medium text-blue-300/70">{d.role}</span>
                <span className="text-xs text-white/30 font-mono break-all">{d.email} / {d.pass}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/25">
          <Shield className="h-3.5 w-3.5" />
          <span>{t.noGoogle}</span>
        </div>
      </div>
    </div>
  );
}
