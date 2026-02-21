"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0a0820,#130d35)",
          fontFamily: "system-ui,-apple-system,sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "90%",
            padding: "36px",
            borderRadius: "20px",
            border: "1px solid rgba(239,68,68,.25)",
            background: "rgba(239,68,68,.06)",
            backdropFilter: "blur(20px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "rgba(239,68,68,.15)",
              border: "1px solid rgba(239,68,68,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontSize: "24px",
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              color: "#fff",
              fontSize: "20px",
              fontWeight: 700,
              margin: "0 0 10px",
            }}
          >
            Beklenmeyen Bir Hata Oluştu
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.45)",
              fontSize: "13px",
              lineHeight: 1.6,
              margin: "0 0 8px",
            }}
          >
            Uygulama beklenmedik bir sorunla karşılaştı. Lütfen sayfayı
            yenileyin. Sorun devam ederse yöneticinize bildirin.
          </p>

          {error.message && (
            <p
              style={{
                color: "#f87171",
                fontSize: "12px",
                fontFamily: "monospace",
                background: "rgba(0,0,0,.35)",
                borderRadius: "8px",
                padding: "8px 12px",
                margin: "0 0 8px",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </p>
          )}

          {error.digest && (
            <p
              style={{
                color: "rgba(255,255,255,.2)",
                fontSize: "10px",
                fontFamily: "monospace",
                margin: "0 0 22px",
              }}
            >
              Hata kodu: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: "11px 28px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg,#3b82f6,#6366f1)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow: "0 6px 20px rgba(99,102,241,.35)",
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
