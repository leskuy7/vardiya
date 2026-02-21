"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "32px",
          borderRadius: "16px",
          border: "1px solid rgba(239,68,68,.2)",
          background: "rgba(239,68,68,.05)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "rgba(239,68,68,.12)",
            border: "1px solid rgba(239,68,68,.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: "20px",
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            fontSize: "17px",
            fontWeight: 700,
            margin: "0 0 8px",
            color: "inherit",
          }}
        >
          Sayfa Yüklenemedi
        </h2>

        <p
          style={{
            fontSize: "13px",
            opacity: 0.55,
            lineHeight: 1.6,
            margin: "0 0 18px",
          }}
        >
          Bu bölüm yüklenirken bir sorun yaşandı.
          {error.message ? ` (${error.message})` : ""}
        </p>

        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary/90 transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}
