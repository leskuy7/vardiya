"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  CalendarDays,
  Eye,
  EyeOff,
  Moon,
  Sun,
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
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Şifre büyük/küçük harf ve rakam içermelidir",
      ),
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
    supportToast:
      "Şifre sıfırlama için yöneticinize veya destek mailine yazın.",
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
  const responseData = (err as { response?: { data?: unknown } })?.response
    ?.data;
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
    const savedTheme =
      (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
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
      toast(
        "error",
        getErrorMessage(err, "Giriş başarısız. E-posta veya şifre hatalı."),
      );
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
      toast(
        "error",
        getErrorMessage(err, "Kayıt başarısız. Bilgilerinizi kontrol edin."),
      );
    }
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left side - Branding/Hero (Visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0MjY2ZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djI4SDI0VjE2aDEyem0yNC0yNHYyOEg0OFYwaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 dark:opacity-10"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Vardiya Planlayıcı
              </span>
              <span className="block text-xs text-slate-600 dark:text-slate-400 font-medium">
                Ekip Yönetim Platformu
              </span>
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-md space-y-8">
            <div>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Ekibinizin Mesaisini{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Akıllıca Yönetin
                </span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Vardiya planlamayı basitleştirin, ekibinizin üretkenliğini artırın
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                {
                  icon: CalendarDays,
                  title: t.feature1,
                  desc: t.feature1Desc,
                },
                {
                  icon: Clock,
                  title: t.feature2,
                  desc: t.feature2Desc,
                },
                {
                  icon: BarChart3,
                  title: t.feature3,
                  desc: t.feature3Desc,
                },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Shield className="h-4 w-4" />
            <span>{t.noGoogle}</span>
          </div>
        </div>
      </div>

      {/* Right side - Forms */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 bg-white dark:bg-slate-950">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <CalendarDays className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Vardiya Planlayıcı
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {mode === "login" ? t.titleLogin : t.titleRegister}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {mode === "login" ? t.subtitleLogin : t.subtitleRegister}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={toggleLang}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {lang.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form container */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none p-8">
            {mode === "login" ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ornek@sirket.com"
                    className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("email")}
                  />
                  {errors.email?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        toast("info", t.supportToast);
                        if (typeof window !== "undefined") {
                          window.open(
                            "mailto:destek@vardiya.app?subject=Sifre%20Sifirlama",
                            "_blank",
                          );
                        }
                      }}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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
                      className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-11"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      t.login
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleRegisterSubmit(onRegister)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="firstName"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {t.firstName}
                    </label>
                    <input
                      id="firstName"
                      placeholder="Ali"
                      className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      {...registerField("firstName")}
                    />
                    {registerErrors.firstName?.message && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {registerErrors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {t.lastName}
                    </label>
                    <input
                      id="lastName"
                      placeholder="Yılmaz"
                      className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      {...registerField("lastName")}
                    />
                    {registerErrors.lastName?.message && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {registerErrors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="registerEmail"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.email}
                  </label>
                  <input
                    id="registerEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="ornek@sirket.com"
                    className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    {...registerField("email")}
                  />
                  {registerErrors.email?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {registerErrors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="registerPassword"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.password}
                  </label>
                  <div className="relative">
                    <input
                      id="registerPassword"
                      type={showRegisterPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="En az 8 karakter"
                      className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-11"
                      {...registerField("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {registerErrors.password?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {registerErrors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.passwordAgain}
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showRegisterPassword2 ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Şifrenizi tekrar girin"
                      className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pr-11"
                      {...registerField("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword2((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showRegisterPassword2 ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {registerErrors.confirmPassword?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {registerErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isRegisterSubmitting}
                    className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  >
                    {isRegisterSubmitting ? (
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      t.register
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">
                  veya
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
              >
                {mode === "login"
                  ? "Hesabınız yok mu? Kayıt olun"
                  : "Zaten hesabınız var mı? Giriş yapın"}
              </button>
            </div>
          </div>

          {/* Demo Accounts Panel */}
          <div className="mt-6 overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="border-b border-blue-200 dark:border-blue-900 bg-blue-100/50 dark:bg-blue-950/50 px-4 py-3">
              <h3 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                {t.demoTitle}
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {[
                  {
                    role: "Admin",
                    email: "admin@shiftplanner.com",
                    pass: "Admin1234!",
                    color: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300",
                  },
                  {
                    role: "Müdür",
                    email: "manager@shiftplanner.com",
                    pass: "Manager1234!",
                    color: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
                  },
                  {
                    role: "Çalışan",
                    email: "ali@shiftplanner.com",
                    pass: "Employee1234!",
                    color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
                  },
                ].map((d) => (
                  <div
                    key={d.role}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${d.color}`}>
                        {d.role}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Email:</span>
                        <code className="text-xs text-slate-900 dark:text-slate-100 font-mono select-all bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {d.email}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Şifre:</span>
                        <code className="text-xs text-slate-900 dark:text-slate-100 font-mono select-all bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {d.pass}
                        </code>
                      </div>
                    </div>
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
