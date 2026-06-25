import { Link, useLocation, Outlet } from "react-router";
import {
  Search,
  LayoutDashboard,
  BrainCircuit,
  Settings,
  Menu,
  Sun,
  Moon,
  X,
  Wallet,
  Crown,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AuthCheckoutModal } from "./AuthCheckoutModal";
import { stackApp } from "../../lib/authClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PLAN_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  FREE:       { color: "#6B8E9F",    bg: "rgba(107,142,159,0.12)", label: "Free" },
  PRO:        { color: "#8BB8C9",    bg: "rgba(139,184,201,0.15)", label: "Pro" },
  ENTERPRISE: { color: "#AFA089",    bg: "rgba(175,160,137,0.15)", label: "Enterprise" },
};

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [userName, setUserName] = useState<string>("JD");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [userId, setUserId] = useState<string | null>(null);

  const location = useLocation();

  // ── Load user from localStorage + fetch fresh profile ──────────────────
  const fetchUser = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/${uid}`);
      if (!res.ok) return;
      const data = await res.json();
      setUserName(data.name || "JD");
      setWalletBalance(parseFloat(data.wallet_balance ?? "0"));
      setCurrentPlan(data.current_plan ?? "FREE");
    } catch {
      // silently ignore — offline or dev mode
    }
  }, []);

  // ── Real-time balance poll ──────────────────────────────────────────────
  const fetchBalance = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/balance/${uid}`);
      if (!res.ok) return;
      const data = await res.json();
      setWalletBalance(parseFloat(data.wallet_balance ?? "0"));
      setCurrentPlan(data.current_plan ?? "FREE");
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const boot = async () => {
      // 1. Check localStorage (email/password or previously synced OAuth session)
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const uid = parsed.id || parsed.user_id;
          if (uid) {
            setUserId(uid);
            fetchUser(uid);
            interval = setInterval(() => fetchBalance(uid), 30_000);
            return;
          }
        } catch { /* fall through */ }
      }

      // 2. No localStorage — check for an active Stack Auth / Neon Auth OAuth session
      try {
        const stackUser = await stackApp.getUser();
        if (!stackUser?.primaryEmail) return;

        // Get the Stack Auth access token for backend verification
        const authHeaders = await stackUser.getAuthHeaders();
        const accessToken = (authHeaders as any)?.["x-stack-access-token"]
          ?? authHeaders?.Authorization?.replace("Bearer ", "");
        if (!accessToken) return;

        // Sync to our backend — creates/updates user_profiles row + issues our JWT
        const res = await fetch(`${API_BASE}/api/auth/oauth-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,                                              // verified server-side
            email: stackUser.primaryEmail,
            name:  stackUser.displayName || stackUser.primaryEmail.split("@")[0],
            image: (stackUser as any).profileImageUrl || null,
          }),
        });
        if (!res.ok) return;

        const data = await res.json();
        localStorage.setItem("user",  JSON.stringify(data));
        localStorage.setItem("token", data.token);

        const uid = data.id || data.user_id;
        setUserId(uid);
        setUserName(data.name || stackUser.displayName || "User");
        setWalletBalance(parseFloat(data.wallet_balance ?? "0"));
        setCurrentPlan(data.current_plan ?? "FREE");
        interval = setInterval(() => fetchBalance(uid), 30_000);
      } catch {
        // Stack Auth not configured or no active session — silently ignore
      }
    };

    boot();
    return () => clearInterval(interval);
  }, [fetchUser, fetchBalance]);

  // ── Dark mode ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // ── Close user menu on outside click ───────────────────────────────────
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [userMenuOpen]);

  const navItems = [
    { name: "Screener",   path: "/dashboard", icon: LayoutDashboard },
    { name: "AI Analysis", path: "/analysis",  icon: BrainCircuit },
    { name: "Alerts",     path: "/settings",  icon: Settings },
  ];

  const initials = (userName ?? "JD")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const planStyle = PLAN_STYLE[currentPlan] ?? PLAN_STYLE.FREE;

  const handleLogout = async () => {
    try {
      const stackUser = await stackApp.getUser();
      if (stackUser) await stackUser.signOut();
    } catch { /* ignore if no OAuth session */ }
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans antialiased overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="h-20 w-full flex items-center justify-between px-6 md:px-10 border-b border-border/40">

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 relative">

          {/* Wallet balance chip */}
          {walletBalance !== null && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>${walletBalance.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* Plan badge */}
          <div
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{ color: planStyle.color, background: planStyle.bg }}
          >
            {currentPlan === "ENTERPRISE" && <Crown className="w-3 h-3" />}
            {planStyle.label}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User avatar + dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!userMenuOpen);
              }}
              className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm select-none"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground font-mono truncate">{userName}</p>
                  {walletBalance !== null && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      ${walletBalance.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <div
                    className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                    style={{ color: planStyle.color, background: planStyle.bg }}
                  >
                    {currentPlan === "ENTERPRISE" && <Crown className="w-2.5 h-2.5" />}
                    {planStyle.label}
                  </div>
                </div>

                {/* Links */}
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                    Settings
                  </Link>
                  <Link
                    to="/portfolio"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
                    Portfolio
                  </Link>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-secondary transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── SIDEBAR (mobile drawer) ──────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 bg-card h-full p-5 shadow-2xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="mb-6 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Balance in sidebar */}
            {walletBalance !== null && (
              <div className="mb-4 px-3 py-3 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground font-mono mb-1">Wallet Balance</p>
                <p className="text-lg font-mono font-medium text-foreground">
                  ${walletBalance.toLocaleString("en", { minimumFractionDigits: 2 })}
                </p>
                <div
                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                  style={{ color: planStyle.color, background: planStyle.bg }}
                >
                  {currentPlan === "ENTERPRISE" && <Crown className="w-2.5 h-2.5" />}
                  {planStyle.label}
                </div>
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
              <Link
                to="/portfolio"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === "/portfolio"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Portfolio
              </Link>
            </nav>
          </div>
        </div>
      )}

            {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        {children}
      </main>

      <AuthCheckoutModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
