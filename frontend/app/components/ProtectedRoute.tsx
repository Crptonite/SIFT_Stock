import { Navigate, Outlet } from "react-router";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Props:
 *   adminOnly  — if true, also requires user.is_admin === true
 */
export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const raw = localStorage.getItem("user");

  // No session → redirect to login
  if (!raw) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(raw) as { id?: string; token?: string; is_admin?: boolean };
    if (!user.id || !user.token) return <Navigate to="/login" replace />;

    // Admin-only route check
    if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />;

    return <Outlet />;
  } catch {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
}
