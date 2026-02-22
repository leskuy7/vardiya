"use client";

import { useEffect } from "react";
import { Button, Center, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

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
    <Center h="60vh">
      <Paper
        withBorder
        radius="xl"
        p="xl"
        style={{
          width: "min(440px, 92vw)",
          background: "rgba(239,68,68,0.08)",
          borderColor: "rgba(239,68,68,0.25)",
        }}
      >
        <Stack gap="sm" align="center">
          <IconAlertTriangle size={32} color="#f87171" />
          <Title order={4}>Sayfa Yuklenemedi</Title>
          <Text size="sm" c="dimmed" ta="center">
            Bu bolum yuklenirken bir sorun yasandi.
            {process.env.NODE_ENV !== "production" && error.message
              ? ` (${error.message})`
              : ""}
          </Text>
          <Button onClick={reset}>Tekrar Dene</Button>
        </Stack>
      </Paper>
    </Center>
  );
}
