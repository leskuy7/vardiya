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
  BarChart3,
  Users,
} from "lucide-react";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Ad en az 2 karakter"),
    lastName: z.string().min(2, "Soyad en az 2 karakter"),
    email: z.string().email("Geçerli bir e-posta girin"),
    password: z
      .string()
      .min(8, "En az 8 karakter")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Büyük/küçük harf + rakam içermeli"),
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
  { role: "Admin", email: "admin@shiftplanner.com", pass: "Admin1234!", bg: "#7c3aed" },
  { role: "Müdür", email: "manager@shiftplanner.com", pass: "Manager1234!", bg: "#2563eb" },
  { role: "Çalışan", email: "ali@shiftplanner.com", pass: "Employee1234!", bg: "#059669" },
];

const inputCls =
  "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150" +
  " border focus:ring-2";

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
    try { await login(data.email, data.password); }
    catch (err: unknown) { toast("error", getErr(err, "E-posta veya şifre hatalı.")); }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await registerUser({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password });
      toast("success", "Hesabınız oluşturuldu!");
    } catch (err: unknown) { toast("error", getErr(err, "Kayıt başarısız.")); }
  };

  const fillDemo = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
    setMode("login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #24243e 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", left: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-200px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "35%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* ── LEFT ── */}
      <div
        style={{
          flex: "0 0 52%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 56px",
          position: "relative",
          zIndex: 1,
        }}
        className="hidden lg:flex"
      >
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px", height: "44px", borderRadius: "14px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            }}
          >
            <CalendarDays size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "17px", lineHeight: 1.2 }}>Vardiya Planlayıcı</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "2px" }}>Ekip Yönetim Platformu</div>
          </div>
        </div>

        {/* hero */}
        <div style={{ maxWidth: "480px" }}>
          {/* badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "999px", padding: "6px 14px",
              color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 500,
              marginBottom: "28px", backdropFilter: "blur(8px)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <Zap size={13} color="#facc15" />
            Gerçek zamanlı vardiya yönetimi
          </div>

          <h1
            style={{
              fontSize: "clamp(42px, 4vw, 60px)", fontWeight: 800,
              lineHeight: 1.1, color: "#fff", margin: "0 0 20px",
              letterSpacing: "-1.5px",
            }}
          >
            Ekibinizi{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #60a5fa, #818cf8, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Akıllıca
            </span>
            <br />Yönetin
          </h1>

          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "17px", lineHeight: 1.7, margin: "0 0 40px" }}>
            Sürükle-bırak ile vardiya planla,<br />
            mesaileri takip et, raporları anında gör.
          </p>

          {/* features */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
            {[
              { icon: CalendarDays, label: "Haftalık Planlama", desc: "Sürükle-bırak ile kolayca vardiya oluştur" },
              { icon: Users, label: "Çalışan Takibi", desc: "Uygunluk ve mesai kontrolü" },
              { icon: BarChart3, label: "Detaylı Raporlar", desc: "Maliyet ve fazla mesai analizi" },
              { icon: Shield, label: "Güvenli Erişim", desc: "Rol tabanlı yetkilendirme sistemi" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "38px", height: "38px", borderRadius: "10px",
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color="#818cf8" />
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{label}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "1px" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { v: "500+", l: "Çalışan" },
              { v: "99.9%", l: "Uptime" },
              { v: "24/7", l: "Destek" },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px", padding: "16px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ color: "#fff", fontSize: "24px", fontWeight: 700 }}>{s.v}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", marginTop: "4px" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.18)", fontSize: "12px" }}>
          © 2026 Vardiya Planlayıcı
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "32px 24px", position: "relative", zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* main card */}
          <div
            style={{
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              padding: "32px",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: 0 }}>
                {mode === "login" ? "Hoş Geldiniz 👋" : "Hesap Oluştur"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "6px" }}>
                {mode === "login" ? "Devam etmek için giriş yapın" : "Birkaç dakikada başlayın"}
              </p>
            </div>

            {/* switcher */}
            <div
              style={{
                display: "flex", gap: "4px", padding: "4px",
                background: "rgba(0,0,0,0.25)", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: "24px",
              }}
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: "9px", borderRadius: "9px", border: "none",
                    cursor: "pointer", fontSize: "14px", fontWeight: 600,
                    transition: "all 0.2s",
                    background: mode === m
                      ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                      : "transparent",
                    color: mode === m ? "#fff" : "rgba(255,255,255,0.35)",
                    boxShadow: mode === m ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
                </button>
              ))}
            </div>

            {mode === "login" ? (
              <form onSubmit={handleSubmit(onLogin)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "7px" }}>
                    E-posta
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="ornek@sirket.com"
                    className={inputCls}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      borderRadius: "12px",
                    }}
                    {...register("email")}
                  />
                  {errors.email && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "5px" }}>{errors.email.message}</p>}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Şifre
                    </label>
                    <button
                      type="button"
                      onClick={() => toast("info", "Şifre sıfırlama için yöneticinize başvurun.")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: "12px", fontWeight: 500, padding: 0 }}
                    >
                      Şifremi unuttum
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={inputCls}
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        borderRadius: "12px",
                        paddingRight: "48px",
                      }}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}
                    >
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "5px" }}>{errors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    height: "48px", borderRadius: "13px", border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "#fff", fontWeight: 700, fontSize: "15px",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                    transition: "all 0.2s", marginTop: "4px",
                    opacity: isSubmitting ? 0.65 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <svg style={{ animation: "spin 1s linear infinite", width: 20, height: 20 }} viewBox="0 0 24 24" fill="none">
                      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <><span>Giriş Yap</span><ArrowRight size={17} /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleReg(onRegister)} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {(["firstName", "lastName"] as const).map((field) => (
                    <div key={field}>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "7px" }}>
                        {field === "firstName" ? "Ad" : "Soyad"}
                      </label>
                      <input
                        placeholder={field === "firstName" ? "Ali" : "Yılmaz"}
                        className={inputCls}
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "12px" }}
                        {...reg(field)}
                      />
                      {rErr[field] && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "4px" }}>{rErr[field]?.message}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "7px" }}>E-posta</label>
                  <input type="email" placeholder="ornek@sirket.com" className={inputCls} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "12px" }} {...reg("email")} />
                  {rErr.email && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "5px" }}>{rErr.email.message}</p>}
                </div>

                {([
                  { field: "password" as const, show: showPw2, toggle: () => setShowPw2((v) => !v), label: "Şifre", ph: "En az 8 karakter" },
                  { field: "confirmPassword" as const, show: showPw3, toggle: () => setShowPw3((v) => !v), label: "Şifre Tekrar", ph: "Tekrar girin" },
                ]).map(({ field, show, toggle, label, ph }) => (
                  <div key={field}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "7px" }}>{label}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={show ? "text" : "password"}
                        placeholder={ph}
                        className={inputCls}
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "12px", paddingRight: "48px" }}
                        {...reg(field)}
                      />
                      <button type="button" onClick={toggle} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                        {show ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {rErr[field] && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "5px" }}>{rErr[field]?.message}</p>}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={rSub}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    height: "48px", borderRadius: "13px", border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "#fff", fontWeight: 700, fontSize: "15px",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                    marginTop: "4px", opacity: rSub ? 0.65 : 1,
                  }}
                >
                  {rSub ? (
                    <svg style={{ animation: "spin 1s linear infinite", width: 20, height: 20 }} viewBox="0 0 24 24" fill="none">
                      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <><span>Hesap Oluştur</span><ArrowRight size={17} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* demo card */}
          <div
            style={{
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(16px)",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse 2s infinite" }} />
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Demo Hesaplar — tıkla, otomatik doldur
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {DEMOS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => fillDemo(d.email, d.pass)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    width: "100%", padding: "11px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px", cursor: "pointer",
                    transition: "all 0.15s", textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.14)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <div
                    style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      background: d.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "15px", flexShrink: 0,
                      boxShadow: `0 4px 12px ${d.bg}55`,
                    }}
                  >
                    {d.role[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "13px" }}>{d.role}</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", fontFamily: "monospace", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email}</div>
                  </div>
                  <ArrowRight size={14} color="rgba(255,255,255,0.2)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
        input { color: #fff !important; }
        input:focus { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; outline: none !important; }
      `}</style>
    </div>
  );
}
