"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { PageLoader } from "@/components/ui/spinner";
import { Box } from "@mantine/core";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <PageLoader />;
  if (!user) return null;

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        position: "relative",
        background: "radial-gradient(circle at 10% 10%, rgba(59,130,246,0.12), transparent 40%), radial-gradient(circle at 90% 0%, rgba(236,72,153,0.12), transparent 45%), #0a0f18",
      }}
    >
      <Box style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(120deg, rgba(255,255,255,0.02), transparent)" }} />
      <Box style={{ position: "relative", zIndex: 1, display: "flex", width: "100%" }}>
        <Sidebar />
        <Box style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Navbar />
          <Box component="main" style={{ flex: 1, overflow: "auto", padding: "24px" }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
