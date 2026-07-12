import { createFileRoute } from "@tanstack/react-router";
import { AdminShadowingManagement } from "@/components/admin/AdminShadowingManagement";

export const Route = createFileRoute("/admin/shadowing/_index")({
  component: AdminShadowingManagementRoute,
});

function AdminShadowingManagementRoute() {
  return (
    <div className="pb-12">
      <AdminShadowingManagement />
    </div>
  );
}
