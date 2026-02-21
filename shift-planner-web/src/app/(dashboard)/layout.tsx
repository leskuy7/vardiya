"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { PageLoader } from "@/components/ui/spinner";

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
    <div className="flex h-screen overflow-hidden bg-background relative selection:bg-primary/30">
      {/* Subtle ambient glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 flex h-full w-full">
        <Sidebar className="shadow-2xl shadow-black/50 border-r border-white/5" />
        <div className="flex flex-1 flex-col overflow-hidden backdrop-blur-3xl bg-background/50">
          <Navbar />
          <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
