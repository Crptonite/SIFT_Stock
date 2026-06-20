import React, { useState } from "react";
import { Shield, Eye, EyeOff, Lock, Mail, ChevronRight, ShieldCheck, User, Chrome, Github, Monitor } from "lucide-react";
import { useNavigate } from "react-router";
import { stackApp } from "../../lib/authClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string | undefined;

      const res = await fetch(
        isLogin ? `${API_BASE}/api/login` : `${API_BASE}/api/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, ...(isLogin ? {} : { name }) }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Authentication failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Server error — make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── Neon Auth OAuth (Stack Auth) ────────────────────────────────────
  const handleOAuth = async (provider: "google" | "github" | "microsoft") => {
    if (!import.meta.env.VITE_STACK_PROJECT_ID) {
      alert(
        "OAuth is not configured yet.\n\nAdd VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY to your frontend/.env\n(from Neon Console → Auth → API Keys)"
      );
      return;
    }
    try {
      // stackApp.signInWithOAuth redirects the page — no return value
      await stackApp.signInWithOAuth(provider);
    } catch (err: any) {
      alert(`OAuth error: ${err?.message ?? "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground font-sans p-4 sm:p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#8BB8C9]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,184,201,0.1)]">
            <Shield className="w-7 h-7 text-background" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLogin ? "Sign In to SIFT" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">
            {isLogin ? "Access your automated screener" : "Start your premium wealth journey"}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* ── OAuth buttons ──────────────────────────────────────────── */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="w-full h-11 bg-background border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center justify-center gap-2.5"
            >
              {/* Google colours SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="w-full h-11 bg-background border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center justify-center gap-2.5"
            >
              <Github className="w-4 h-4 shrink-0" />
              Continue with GitHub
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("microsoft")}
              className="w-full h-11 bg-background border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center justify-center gap-2.5"
            >
              {/* Microsoft logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-mono shrink-0">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Email/password form ──────────────────────────────────── */}
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground/50 focus:border-[#8BB8C9] focus:ring-1 focus:ring-[#8BB8C9] transition-all outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground/50 focus:border-[#8BB8C9] focus:ring-1 focus:ring-[#8BB8C9] transition-all outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-xs text-[#8BB8C9] hover:text-[#AFA089] font-medium transition-colors">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-foreground placeholder-muted-foreground/50 focus:border-[#8BB8C9] focus:ring-1 focus:ring-[#8BB8C9] transition-all outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-[#8BB8C9] hover:bg-[#4A5D6B] disabled:opacity-60 text-background rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(139,184,201,0.3)] hover:shadow-[0_0_25px_rgba(139,184,201,0.4)] flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : null}
              {isLogin ? "Sign In" : "Create Account"}
              {!loading && <ChevronRight className="w-4 h-4 ml-1.5" />}
            </button>
          </form>

          {/* Toggle login/register */}
          <div className="pt-2 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-foreground font-semibold hover:text-[#8BB8C9] transition-colors"
              >
                {isLogin ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        {/* Security indicator */}
        <div className="mt-8 flex flex-col items-center text-muted-foreground space-y-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#8BB8C9]/80" />
            <span className="text-xs font-medium uppercase tracking-widest">
              Bank-Level Security
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 text-center max-w-[280px]">
            Your data is protected with 256-bit encryption. We never share your personal information.
          </p>
        </div>
      </div>
    </div>
  );
}
