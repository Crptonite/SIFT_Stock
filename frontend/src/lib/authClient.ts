/**
 * Neon Auth client — powered by Stack Auth (@stackframe/stack)
 *
 * Required env vars (add to frontend/.env):
 *   VITE_NEON_AUTH_URL                — base URL from Neon Console → Auth → Settings
 *   VITE_STACK_PROJECT_ID             — from Neon Console → Auth → API Keys
 *   VITE_STACK_PUBLISHABLE_CLIENT_KEY — from Neon Console → Auth → API Keys
 */
import { StackClientApp } from "@stackframe/stack";

export const stackApp = new StackClientApp({
  baseUrl:              import.meta.env.VITE_NEON_AUTH_URL,
  projectId:            import.meta.env.VITE_STACK_PROJECT_ID,
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
  tokenStore:           "localStorage",
  urls: {
    afterSignIn:  "/dashboard",
    afterSignOut: "/login",
  },
});
