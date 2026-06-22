"use client";
import { StackClientApp } from "@stackframe/stack";

export const stackApp = new StackClientApp({
  baseUrl:             process.env.NEXT_PUBLIC_NEON_AUTH_URL,
  projectId:           process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore:          "localStorage",
  urls: { afterSignIn: "/dashboard", afterSignOut: "/login" },
});
