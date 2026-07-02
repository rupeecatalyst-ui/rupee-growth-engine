/**
 * RCLIP permission catalog (client-side mirror).
 *
 * The database is the source of truth: RLS policies gate every table via
 * `public.rc_has_permission(code)`. These constants keep the UI/service layer in
 * sync with the seeded permission codes so we can hide/disable actions the user
 * cannot perform. NEVER treat a client-side check as a security boundary — it is
 * a UX affordance only; RLS enforces access.
 */

export const PERMISSIONS = {
  // Identity & Access (Phase 1)
  org: { read: "org.read", manage: "org.manage" },
  branch: { read: "branch.read", manage: "branch.manage" },
  employee: { read: "employee.read", manage: "employee.manage" },
  user: { read: "user.read", manage: "user.manage" },
  role: { read: "role.read", manage: "role.manage", assignMasterAdmin: "role.assign.master_admin" },
  permission: { read: "permission.read" },

  // Relationship Engine (Phase 2A)
  contact: {
    read: "contact.read",
    manage: "contact.manage",
    piiRead: "contact.pii.read",
    merge: "contact.merge",
  },

  // Product Intelligence Engine (Phase 2B)
  product: { read: "product.read", manage: "product.manage" },
} as const;

type PermissionGroup = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type PermissionCode = PermissionGroup[keyof PermissionGroup];

/** UX affordance check against a set of permission codes the current user holds. */
export function can(held: ReadonlySet<string> | readonly string[], code: PermissionCode): boolean {
  return Array.from(held).includes(code);
}
