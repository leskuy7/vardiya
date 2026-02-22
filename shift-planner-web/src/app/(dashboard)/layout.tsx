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
        background: "var(--mantine-color-body)",
      }}
    >
      <Sidebar />
      <Box style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Navbar />
        <Box component="main" style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
