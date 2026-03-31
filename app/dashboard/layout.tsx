import { PropsWithChildren } from "react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function Layout({ children }: PropsWithChildren) {
  return <DashboardShell>{children}</DashboardShell>;
}
