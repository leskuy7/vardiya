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
  Shield,
  BarChart3,
  Users,
} from "lucide-react";
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
  { role: "Admin",    email: "admin@shiftplanner.com",   pass: "Admin1234!",    bg: "#7c3aed" },
  { role: "Müdür",   email: "manager@shiftplanner.com", pass: "Manager1234!",  bg: "#2563eb" },
  { role: "Çalışan", email: "ali@shiftplanner.com",      pass: "Employee1234!", bg: "#059669" },
];

const FEATURES = [
  { icon: CalendarDays, label: "Haftalık Planlama",  desc: "Sürükle-bırak vardiya" },
  { icon: Users,        label: "Çalışan Takibi",     desc: "Uygunluk & mesai kontrolü" },
  { icon: BarChart3,    label: "Raporlar",            desc: "Maliyet & fazla mesai" },
  { icon: Shield,       label: "Güvenli Erişim",      desc: "Rol tabanlı yetkilendirme" },
];

const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  fontSize: "13px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(10,8,32,0.85)",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s",
};

export default function LoginPage() {
  const { login, register: registerUser } = useAuth();
  const { toast } = useToast();
  const [mode, setMode]       = useState<"login" | "register">("login");
  const [showPw,  setShowPw]  = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [showPw3, setShowPw3] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

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

  const submitBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    height: "43px",
    width: "100%",
    borderRadius: "11px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
    marginTop: "4px",
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        background: "linear-gradient(135deg,#0a0820 0%,#130d35 50%,#1a1040 100%)",
        fontFamily: "system-ui,-apple-system,sans-serif",
        position: "relative",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-180px", left: "-180px", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-160px", right: "-120px", width: "460px", height: "460px", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 70%)" }} />
      </div>

      {/* ── LEFT PANEL (lg+) ── */}
      <div
        className="lp"
        style={{
          flex: "0 0 50%",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 52px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 6px 20px rgba(99,102,241,.35)" }}>
            <CalendarDays size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px", lineHeight: 1.2 }}>Vardiya Planlayıcı</div>
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: "11px" }}>Ekip Yönetim Platformu</div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(34px,3.2vw,50px)", fontWeight: 800, lineHeight: 1.1, color: "#fff", margin: "0 0 14px", letterSpacing: "-1.5px" }}>
          Ekibinizi{" "}
          <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Akıllıca
          </span>
          <br />Yönetin
        </h1>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 28px" }}>
          Sürükle-bırak ile vardiya planla, mesaileri takip et,<br />raporları anında gör.
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div style={{ width: "33px", height: "33px", borderRadius: "9px", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} color="#818cf8" />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>{label}</div>
                <div style={{ color: "rgba(255,255,255,.3)", fontSize: "11px" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 24px",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Card */}
          <div
            style={{
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.04)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              padding: "26px",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "16px" }}>
              <h2 style={{ color: "#fff", fontSize: "21px", fontWeight: 700, margin: "0 0 4px" }}>
                {mode === "login" ? "Hoş Geldiniz 👋" : "Hesap Oluştur"}
              </h2>
              <p style={{ color: "rgba(255,255,255,.35)", fontSize: "12px", margin: 0 }}>
                {mode === "login" ? "Devam etmek için giriş yapın" : "Birkaç dakikada başlayın"}
              </p>
            </div>

            {/* Tab switcher */}
            <div
              style={{
                display: "flex",
                gap: "3px",
                padding: "3px",
                background: "rgba(0,0,0,.3)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,.07)",
                marginBottom: "18px",
              }}
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "all .18s",
                    background: mode === m ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "transparent",
                    color: mode === m ? "#fff" : "rgba(255,255,255,.35)",
                    boxShadow: mode === m ? "0 3px 12px rgba(99,102,241,.3)" : "none",
                  }}
                >
                  {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
                </button>
              ))}
            </div>

            {/* ── Login Form ── */}
            {mode === "login" ? (
              <form onSubmit={handleSubmit(onLogin)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,.45)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", display: "block", marginBottom: "5px" }}>
                    E-posta
                  </label>
                  <input type="email" autoComplete="email" placeholder="ornek@sirket.com" style={inp} {...register("email")} />
                  {errors.email && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "3px" }}>{errors.email.message}</p>}
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <label style={{ color: "rgba(255,255,255,.45)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em" }}>
                      Şifre
                    </label>
                    <button type="button" onClick={() => toast("info", "Yöneticinize başvurun.")} style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: "11px", padding: 0 }}>
                      Şifremi unuttum
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" style={{ ...inp, paddingRight: "40px" }} {...register("password")} />
                    <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.35)", display: "flex", padding: 0 }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "3px" }}>{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} style={{ ...submitBtn, opacity: isSubmitting ? 0.65 : 1 }}>
                  {isSubmitting ? "Giriş yapılıyor…" : <><span>Giriş Yap</span><ArrowRight size={15} /></>}
                </button>
              </form>
            ) : (
              /* ── Register Form ── */
              <form onSubmit={handleReg(onRegister)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {(["firstName", "lastName"] as const).map((f) => (
                    <div key={f}>
                      <label style={{ color: "rgba(255,255,255,.45)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", display: "block", marginBottom: "5px" }}>
                        {f === "firstName" ? "Ad" : "Soyad"}
                      </label>
                      <input placeholder={f === "firstName" ? "Ali" : "Yılmaz"} style={inp} {...reg(f)} />
                      {rErr[f] && <p style={{ color: "#f87171", fontSize: "10px", marginTop: "2px" }}>{rErr[f]?.message}</p>}
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ color: "rgba(255,255,255,.45)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", display: "block", marginBottom: "5px" }}>
                    E-posta
                  </label>
                  <input type="email" placeholder="ornek@sirket.com" style={inp} {...reg("email")} />
                  {rErr.email && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "3px" }}>{rErr.email.message}</p>}
                </div>

                {([
                  { field: "password"        as const, show: showPw2, toggle: () => setShowPw2((v) => !v), label: "Şifre",        ph: "En az 8 karakter" },
                  { field: "confirmPassword" as const, show: showPw3, toggle: () => setShowPw3((v) => !v), label: "Şifre Tekrar", ph: "Tekrar girin" },
                ]).map(({ field, show, toggle, label, ph }) => (
                  <div key={field}>
                    <label style={{ color: "rgba(255,255,255,.45)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", display: "block", marginBottom: "5px" }}>
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input type={show ? "text" : "password"} placeholder={ph} style={{ ...inp, paddingRight: "40px" }} {...reg(field)} />
                      <button type="button" onClick={toggle} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.35)", display: "flex", padding: 0 }}>
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {rErr[field] && <p style={{ color: "#f87171", fontSize: "11px", marginTop: "3px" }}>{rErr[field]?.message}</p>}
                  </div>
                ))}

                <button type="submit" disabled={rSub} style={{ ...submitBtn, opacity: rSub ? 0.65 : 1 }}>
                  {rSub ? "Oluşturuluyor…" : <><span>Hesap Oluştur</span><ArrowRight size={15} /></>}
                </button>
              </form>
            )}

            {/* ── Demo Accounts ── */}
            <div style={{ marginTop: "18px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,.25)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>
                  Demo — tıkla, anında giriş yap
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {DEMOS.map((d) => (
                  <button
                    key={d.role}
                    type="button"
                    disabled={demoLoading !== null}
                    onClick={() => handleDemoLogin(d.email, d.pass)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "9px 12px",
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: "10px",
                      cursor: demoLoading ? "not-allowed" : "pointer",
                      textAlign: "left",
                      opacity: demoLoading && demoLoading !== d.email ? 0.45 : 1,
                      transition: "background .15s, opacity .15s",
                    }}
                    onMouseEnter={(e) => { if (!demoLoading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.09)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.04)"; }}
                  >
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: d.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                      {demoLoading === d.email ? "…" : d.role[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "rgba(255,255,255,.8)", fontWeight: 600, fontSize: "12px" }}>{d.role}</div>
                      <div style={{ color: "rgba(255,255,255,.25)", fontSize: "10px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email}</div>
                    </div>
                    <ArrowRight size={12} color="rgba(255,255,255,.2)" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Sol panel: mobilde gizli, lg'de flex */
        .lp { display: none; }
        @media (min-width: 1024px) { .lp { display: flex; } }

        /* Input renk zorlaması */
        input { color: #fff !important; }
        input::placeholder { color: rgba(255,255,255,.2) !important; }
        input:focus {
          border-color: rgba(99,102,241,.65) !important;
          box-shadow: 0 0 0 2px rgba(99,102,241,.18) !important;
        }

        /* Chrome autofill arka plan override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgb(10,8,32) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff !important;
          border-color: rgba(255,255,255,.12) !important;
        }
      `}</style>
    </div>
  );
}
