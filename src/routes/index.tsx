import { createFileRoute } from "@tanstack/react-router";
import { HalcyonOps } from "@/components/halcyon-ops";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <HalcyonOps />;
}
