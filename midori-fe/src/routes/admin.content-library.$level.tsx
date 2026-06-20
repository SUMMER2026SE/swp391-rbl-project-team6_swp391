import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/content-library/$level")({
  component: ContentLibraryLevelLayout,
});

function ContentLibraryLevelLayout() {
  return <Outlet />;
}
