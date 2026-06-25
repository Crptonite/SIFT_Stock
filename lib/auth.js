const NEON_AUTH_URL    = process.env.NEON_AUTH_URL!;
const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID!;
const STACK_SECRET_KEY = process.env.STACK_SECRET_SERVER_KEY!;

export async function verifyStackToken(accessToken: string) {
  const res = await fetch(`${NEON_AUTH_URL}/api/v1/users/me`, {
    headers: {
      "x-stack-project-id":     STACK_PROJECT_ID,
      "x-stack-access-token":   accessToken,
      "x-stack-secret-server-key": STACK_SECRET_KEY,
    },
  });
  if (!res.ok) throw new Error(`Stack Auth rejected token (${res.status})`);
  return res.json() as Promise<{ id: string; primary_email: string; display_name?: string }>;
}

export function getAdminToken(req: Request) {
  return req.headers.get("x-admin-auth");
}

export function isAdmin(token: string | null) {
  return token === process.env.ADMIN_TOKEN;
}
