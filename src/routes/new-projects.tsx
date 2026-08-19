import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/new-projects")({
  component: () => <Outlet />,
});