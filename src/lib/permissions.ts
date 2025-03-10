import { Role } from "@prisma/client";

export type Permission =
  | "manage_billing"
  | "manage_users"
  | "assign_users"
  | "manage_posts"
  | "use_ai_tools"
  | "approve_posts"
  | "view_analytics"
  | "manage_accounts"
  | "set_guidelines";

export const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    "manage_billing",
    "manage_users",
    "assign_users",
    "manage_posts",
    "use_ai_tools",
    "approve_posts",
    "view_analytics",
    "manage_accounts",
    "set_guidelines",
  ],
  ADMIN: [
    "assign_users",
    "manage_posts",
    "use_ai_tools",
    "approve_posts",
    "view_analytics",
    "manage_accounts",
    "set_guidelines",
  ],
  MEMBER: ["manage_posts", "use_ai_tools"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function requirePermission(role: Role, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error("Insufficient permissions");
  }
}
