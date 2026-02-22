"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/toast";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const mantineTheme = createTheme({
  primaryColor: "blue",
  fontFamily: "inherit",
  defaultRadius: "md",
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    fetch(`${apiUrl}/health`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .catch(() => {
        return;
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="auto">
      <Notifications position="bottom-right" zIndex={9999} />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}
