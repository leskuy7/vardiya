import { Center, Loader } from "@mantine/core";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

export function Spinner({ size = "md" }: SpinnerProps) {
  return <Loader size={sizeMap[size]} />;
}

export function PageLoader() {
  return (
    <Center h="100vh">
      <Loader size={48} />
    </Center>
  );
}
