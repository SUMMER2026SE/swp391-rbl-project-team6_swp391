import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, GraduationCap, User, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/roles")({ component: RolesPage });

type Role = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  userCount: number;
};

type Permission = {
  id: string;
  name: string;
  description: string;
};

const ROLES: Role[] = [
  { id: "super_admin", name: "Super Admin", description: "Full system access", icon: Shield, color: "text-[var(--jp-red)]", userCount: 2 },
  { id: "academic_admin", name: "Academic Admin", description: "Manage users and content", icon: Users, color: "text-primary", userCount: 5 },
  { id: "teacher", name: "Teacher", description: "Create and manage content", icon: GraduationCap, color: "text-[var(--status-teacher)]", userCount: 128 },
  { id: "student", name: "Student", description: "Learn and practice", icon: User, color: "text-[var(--status-student)]", userCount: 3842 },
];

const PERMISSIONS: Permission[] = [
  { id: "user_management", name: "User Management", description: "View, edit, suspend users" },
  { id: "content_create", name: "Content Creation", description: "Create vocabulary, grammar, flashcards" },
  { id: "content_approve", name: "Content Approval", description: "Approve or reject submitted content" },
  { id: "exam_management", name: "Exam Management", description: "Create and manage JLPT exams" },
  { id: "analytics", name: "Analytics", description: "View platform analytics" },
  { id: "system_settings", name: "System Settings", description: "Configure system settings" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["user_management", "content_create", "content_approve", "exam_management", "analytics", "system_settings"],
  academic_admin: ["user_management", "content_approve", "exam_management", "analytics"],
  teacher: ["content_create"],
  student: [],
};

function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string>("academic_admin");

  const currentRole = ROLES.find(r => r.id === selectedRole) || ROLES[1];
  const currentPerms = ROLE_PERMISSIONS[selectedRole] || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Roles & Permissions</h1>
          <p className="text-sm text-secondary-col mt-0.5">Manage user roles and access permissions</p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.map(role => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <motion.button
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole(role.id)}
              className={`card-base p-4 text-left transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${role.color.replace("]", "/15]")} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${role.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-col text-sm">{role.name}</h3>
                  <p className="text-[10px] text-muted-col">{role.userCount} users</p>
                </div>
              </div>
              <p className="text-xs text-secondary-col">{role.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-4 border-b separator">
          <h2 className="font-display font-bold text-primary-col">
            Permissions for <span className={currentRole.color}>{currentRole.name}</span>
          </h2>
          <p className="text-xs text-muted-col mt-1">{currentRole.description}</p>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {PERMISSIONS.map(perm => {
            const hasPerm = currentPerms.includes(perm.id);
            return (
              <div key={perm.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--accent)] transition">
                <div>
                  <h4 className="text-sm font-semibold text-primary-col">{perm.name}</h4>
                  <p className="text-xs text-muted-col">{perm.description}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasPerm 
                    ? "bg-[var(--status-active)]/15 text-[var(--status-active)]" 
                    : "bg-muted text-muted-col"
                }`}>
                  {hasPerm ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
