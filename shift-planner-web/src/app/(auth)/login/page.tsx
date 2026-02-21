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
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

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
        "Büyük/küçük harf ve rakam içermelidir",
      ),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function getErrorMessage(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const m = (data as { message?: unknown }).message;
    if (Array.isArray(m) && m.length > 0) return String(m[0]);
    if (typeof m === "string") return m;
  }
  return fallback;
}

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@shiftplanner.com",
    pass: "Admin1234!",
    color: "from-purple-500 to-violet-600",
    desc: "Tam yönetici erişimi",
  },
  {
    role: "Müdür",
    email: "manager@shiftplanner.com",
    pass: "Manager1234!",
    color: "from-blue-500 to-cyan-600",
    desc: "Ekip yönetimi",
  },
  {
    role: "Çalışan",
    email: "ali@shiftplanner.com",
    pass: "Employee1234!",
    color: "from-emerald-500 to-teal-600",
    desc: "Çalışan görünümü",
  },
];

export default function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [showPw3, setShowPw3] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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
    } catch (err: unknown) {
      toast("error", getErrorMessage(err, "E-posta veya şifre hatalı."));
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
    } catch (err: unknown) {
      toast("error", getErrorMessage(err, "Kayıt başarısız."));
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
    if (mode !== "login") setMode("login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050818]">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-tight leading-none">
                Vardiya Planlayıcı
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Ekip Yönetim Platformu
              </p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="max-w-lg space-y-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                Gerçek zamanlı vardiya yönetimi
              </div>
              <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-white">
                Ekibinizi{" "}
                <span className="relative">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                    Akıllıca
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 opacity-60" />
                </span>
                <br />
                Yönetin
              </h1>
              <p className="text-lg leading-relaxed text-white/50">
                Sürükle-bırak ile vardiya planla, mesaileri takip et,
                <br />
                raporları anında görüntüle.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: CalendarDays, label: "Haftalık Planlama" },
                { icon: TrendingUp, label: "Fazla Mesai Takibi" },
                { icon: Shield, label: "Rol Tabanlı Erişim" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white/70">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "500+", label: "Çalışan" },
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Destek" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/20">
            © 2026 Vardiya Planlayıcı • Tüm hakları saklıdır
          </p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-4">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <p className="text-base font-bold text-white">
                Vardiya Planlayıcı
              </p>
            </div>

            {/* Main card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="mb-7 space-y-1">
                <h2 className="text-2xl font-bold text-white">
                  {mode === "login" ? "Hoş Geldiniz 👋" : "Hesap Oluştur"}
                </h2>
                <p className="text-sm text-white/40">
                  {mode === "login"
                    ? "Devam etmek için giriş yapın"
                    : "Birkaç dakikada başlayın"}
                </p>
              </div>

              {/* Tab switcher */}
              <div className="mb-7 flex h-11 rounded-xl bg-white/5 p-1 border border-white/10">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      mode === m
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
                  </button>
                ))}
              </div>

              {/* Login form */}
              {mode === "login" ? (
                <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      E-posta
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="ornek@sirket.com"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        Şifre
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          toast(
                            "info",
                            "Şifre sıfırlama için yöneticinize başvurun.",
                          )
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Şifremi unuttum
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      >
                        {showPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-400">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-50"
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
                      <>
                        Giriş Yap
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Register form */
                <form onSubmit={handleReg(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(["firstName", "lastName"] as const).map((field) => (
                      <div key={field} className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                          {field === "firstName" ? "Ad" : "Soyad"}
                        </label>
                        <input
                          placeholder={
                            field === "firstName" ? "Ali" : "Yılmaz"
                          }
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
                          {...reg(field)}
                        />
                        {rErr[field] && (
                          <p className="text-xs text-red-400">
                            {rErr[field]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      E-posta
                    </label>
                    <input
                      type="email"
                      placeholder="ornek@sirket.com"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
                      {...reg("email")}
                    />
                    {rErr.email && (
                      <p className="text-xs text-red-400">
                        {rErr.email.message}
                      </p>
                    )}
                  </div>

                  {(
                    [
                      {
                        field: "password" as const,
                        show: showPw2,
                        toggle: () => setShowPw2((v) => !v),
                        label: "Şifre",
                        placeholder: "En az 8 karakter",
                      },
                      {
                        field: "confirmPassword" as const,
                        show: showPw3,
                        toggle: () => setShowPw3((v) => !v),
                        label: "Şifre Tekrar",
                        placeholder: "Tekrar girin",
                      },
                    ]
                  ).map(({ field, show, toggle, label, placeholder }) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          type={show ? "text" : "password"}
                          placeholder={placeholder}
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20"
                          {...reg(field)}
                        />
                        <button
                          type="button"
                          onClick={toggle}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                        >
                          {show ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {rErr[field] && (
                        <p className="text-xs text-red-400">
                          {rErr[field]?.message}
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={rSub}
                    className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {rSub ? (
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
                      <>
                        Hesap Oluştur
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Demo accounts */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
              <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Demo hesaplar — tıkla, otomatik doldur
              </p>
              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map((d) => (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => fillDemo(d.email, d.pass)}
                    className="group w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/5 p-3 text-left transition-all duration-200 hover:bg-white/10 hover:border-white/15"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${d.color} text-sm font-bold text-white shadow-lg`}
                    >
                      {d.role[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white/80">
                        {d.role}
                      </p>
                      <p className="text-xs text-white/30">{d.desc}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-mono text-white/25 truncate max-w-[140px]">
                        {d.email}
                      </p>
                      <ArrowRight className="ml-auto mt-0.5 h-3.5 w-3.5 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
