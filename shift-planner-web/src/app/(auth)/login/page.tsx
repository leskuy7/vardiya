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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0D14] p-4 sm:p-8 font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-blue-500/5 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center animate-[slide-up_0.5s_ease-out]">

        {/* Logo / Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_40px_-5px_var(--tw-shadow-color)] shadow-blue-500/50 border border-white/10 relative">
            <div className="absolute inset-0 rounded-[20px] border border-white/20 blur-[2px]" />
            <CalendarDays className="h-8 w-8 relative z-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            Vardiya Planlayıcı
          </h1>
          <p className="mt-2 text-[15px] font-medium text-blue-200/50 tracking-wide">
            Ekip Yönetim Platformu
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full rounded-[24px] border border-white/[0.08] bg-[#111827]/60 p-6 sm:p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle noise inside the card */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

          {/* Top Header & Settings (Lang/Theme) */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white/90">
                {mode === "login" ? t.titleLogin : t.titleRegister}
              </h2>
              <p className="mt-1.5 text-sm text-white/40">
                {mode === "login" ? t.subtitleLogin : t.subtitleRegister}
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-black/40 p-1 border border-white/5">
              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center justify-center rounded-full h-8 w-12 text-[11px] font-bold text-white/50 transition-all hover:bg-white/10 hover:text-white"
              >
                {lang === "tr" ? "TR" : "EN"}
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center rounded-full h-8 w-8 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              >
                {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="relative z-10 flex w-full p-1 mb-8 rounded-[14px] bg-black/40 border border-white/5 shadow-inner">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-[10px] py-2.5 text-[14px] font-semibold transition-all duration-300 ${mode === "login"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
            >
              {t.titleLogin}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-[10px] py-2.5 text-[14px] font-semibold transition-all duration-300 ${mode === "register"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
            >
              {t.titleRegister}
            </button>
          </div>

          {/* Login Form */}
          {mode === "login" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-white/60 ml-1">{t.email}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                  {...register("email")}
                />
                {errors.email?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="password" className="text-[13px] font-semibold text-white/60">{t.password}</label>
                  <button
                    type="button"
                    onClick={() => {
                      toast("info", t.supportToast);
                      if (typeof window !== "undefined") {
                        window.open("mailto:destek@vardiya.app?subject=Sifre%20Sifirlama", "_blank");
                      }
                    }}
                    className="text-[12px] font-medium text-blue-400/80 hover:text-blue-300 transition-colors"
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
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 pr-11 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/80 transition-colors rounded-md"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-blue-600/40 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/50 hover:-translate-y-[1px] active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    {t.login}
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-[13px] font-semibold text-white/60 ml-1">{t.firstName}</label>
                  <input
                    id="firstName"
                    placeholder="Ali"
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    {...registerField("firstName")}
                  />
                  {registerErrors.firstName?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{registerErrors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-[13px] font-semibold text-white/60 ml-1">{t.lastName}</label>
                  <input
                    id="lastName"
                    placeholder="Yılmaz"
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    {...registerField("lastName")}
                  />
                  {registerErrors.lastName?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{registerErrors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="registerEmail" className="text-[13px] font-semibold text-white/60 ml-1">{t.email}</label>
                <input
                  id="registerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@sirket.com"
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                  {...registerField("email")}
                />
                {registerErrors.email?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{registerErrors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="registerPassword" className="text-[13px] font-semibold text-white/60 ml-1">{t.password}</label>
                <div className="relative">
                  <input
                    id="registerPassword"
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="En az 8 karakter"
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 pr-11 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/80 transition-colors rounded-md"
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerErrors.password?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{registerErrors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-[13px] font-semibold text-white/60 ml-1">{t.passwordAgain}</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showRegisterPassword2 ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Şifrenizi tekrar girin"
                    className="flex h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 pr-11 text-sm text-white placeholder:text-white/20 focus:border-blue-500/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    {...registerField("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword2((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/80 transition-colors rounded-md"
                  >
                    {showRegisterPassword2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {registerErrors.confirmPassword?.message && <p className="text-xs text-red-400 font-medium ml-1 mt-1">{registerErrors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_0_20px_-5px_var(--tw-shadow-color)] shadow-blue-600/40 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/50 hover:-translate-y-[1px] active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isRegisterSubmitting ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {t.register}
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts Panel */}
        <div className="mt-6 w-full max-w-[460px] rounded-2xl border border-white/[0.05] bg-[#111827]/40 p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500/50" />
            {t.demoTitle}
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { role: "Yönetici (Admin)", email: "admin@shiftplanner.com", pass: "Admin1234!" },
              { role: "Vardiya Müdürü", email: "manager@shiftplanner.com", pass: "Manager1234!" },
              { role: "Çalışan (Örn.)", email: "ali@shiftplanner.com", pass: "Employee1234!" },
            ].map((d) => (
              <div key={d.role} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 rounded-xl bg-black/20 border border-white/[0.03] px-4 py-3 hover:bg-black/30 transition-colors group cursor-default">
                <span className="text-[13px] font-semibold text-blue-300/80 group-hover:text-blue-300 transition-colors">{d.role}</span>
                <span className="text-[12px] text-white/40 font-mono tracking-wide break-all select-all group-hover:text-white/60 transition-colors">
                  {d.email} <span className="opacity-40">/</span> {d.pass}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-white/20">
          <Shield className="h-4 w-4 opacity-50" />
          <span>{t.noGoogle}</span>
        </div>
      </div>
    </div>
  );
}
