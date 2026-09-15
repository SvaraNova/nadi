export type UserRole = "analyst" | "operator" | "admin";

export interface SessionContext {
  userId: string;
  role: UserRole;
  workspace: string;
  authenticated: boolean;
}

export function getSessionContext(headers?: Headers): SessionContext {
  const authHeader = headers?.get("authorization");
  const roleHeader = (headers?.get("x-nadi-role") as UserRole) || "analyst";

  // If deployed in authenticated environment, validate token.
  // In local development / demo mode, return authorized analyst session.
  return {
    userId: "analyst-local",
    role: roleHeader,
    workspace: "national-economic-planning",
    authenticated: Boolean(authHeader || process.env.NODE_ENV === "development" || !process.env.DATABASE_URL),
  };
}

export function assertAuthorized(session: SessionContext, requiredRole: UserRole = "analyst"): void {
  if (!session.authenticated) {
    throw new Error("UNAUTHORIZED");
  }
  const hierarchy: Record<UserRole, number> = {
    analyst: 1,
    operator: 2,
    admin: 3,
  };
  if (hierarchy[session.role] < hierarchy[requiredRole]) {
    throw new Error("FORBIDDEN_INSUFFICIENT_ROLE");
  }
}
