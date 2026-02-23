"use client";

import { useEffect } from "react";
import { Button, Center, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

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
      <body style={{ margin: 0 }}>
        <Center
          style={{
            minHeight: "100vh",
            background: "var(--mantine-color-body)",
          }}
        >
          <Paper
            withBorder
            radius="xl"
            p="xl"
            style={{
              width: "min(520px, 92vw)",
              background: "var(--mantine-color-default)",
              borderColor: "var(--mantine-color-red-4)",
            }}
          >
            <Stack gap="sm" align="center">
              <IconAlertTriangle size={36} color="var(--mantine-color-red-6)" />
              <Title order={3}>Beklenmeyen Bir Hata Olustu</Title>
              <Text size="sm" c="dimmed" ta="center">
                Uygulama beklenmedik bir sorunla karsilasti. Lutfen sayfayi yenileyin.
              </Text>
              {process.env.NODE_ENV !== "production" && error.message && (
                <Text
                  size="xs"
                  style={{
                    background: "var(--mantine-color-default)",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontFamily: "monospace",
                  }}
                >
                  {error.message}
                </Text>
              )}
              {error.digest && (
                <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                  Hata kodu: {error.digest}
                </Text>
              )}
              <Button onClick={reset}>Tekrar Dene</Button>
            </Stack>
          </Paper>
        </Center>
      </body>
    </html>
  );
}
