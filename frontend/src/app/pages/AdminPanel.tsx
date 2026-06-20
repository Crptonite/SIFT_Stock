import { useState, useEffect, useCallback } from "react";
import {
  Home,
  Users,
  BarChart2,
  MessageSquare,
  History,
  Search,
  FileUp,
  Shield,
  TrendingUp,
  Activity,
  Wallet,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "sift-admin-dev";

const HEADERS = { "x-admin-auth": ADMIN_TOKEN, "Content-Type": "application/json" };

// ── Types ─────────────────────────────────────────────────────────────────
interface Analytics {
  users: { total: number; pro: number; enterprise: number; newThisMonth: number };
  transactions: { total: number; volume: number; buys: number; sells: number; topups: number };
  complaints: { pending: number; investigating: number; resolved: number; total: number };
  wallet: { total: number; avg: number };
}

interface AdminUser {
  user_id: string;
  email: string;
  name: string;
  wallet_balance: string;
  current_plan: "FREE" | "PRO" | "ENTERPRISE";
  is_admin: boolean;
  created_at: string;
  tx_count: string;
  trade_volume: string;
  last_trade_at: string | null;
}

interface AdminTx {
  id: number;
  user_id: string;
  email: string;
  name: string;
  ticker: string;
  type: "BUY" | "SELL" | "TOPUP";
  shares: string;
  price_per_share: string;
  total_amount: string;
  created_at: string;
}

interface Complaint {
  id: number;
  user_id: string;
  email: string;
  name: string;
  title: string;
  description: string;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED";
  created_at: string;
  updated_at: string;
}

type Tab = "overview" | "users" | "transactions" | "complaints" | "analytics";

// ── Helpers ───────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  FREE: "var(--muted-foreground)",
  PRO: "var(--trust-blue)",
  ENTERPRISE: "var(--trust-bronze)",
};

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:       { color: "#EF9E4A", bg: "rgba(239,158,74,0.12)",  icon: <Clock className="w-3 h-3" /> },
  INVESTIGATING: { color: "#8BB8C9", bg: "rgba(139,184,201,0.12)", icon: <Activity className="w-3 h-3" /> },
  RESOLVED:      { color: "#6BAB8E", bg: "rgba(107,171,142,0.12)", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const TX_COLOR: Record<string, string> = {
  BUY:   "var(--trust-blue)",
  SELL:  "var(--trust-bronze)",
  TOPUP: "#6BAB8E",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
}

// ── Component ─────────────────────────────────────────────────────────────
export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTx[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search + filter states
  const [userSearch, setUserSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedComplaint, setExpandedComplaint] = useState<number | null>(null);

  // ── Fetch helpers ────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/analytics`, { headers: HEADERS });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Analytics>;
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/users`, { headers: HEADERS });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<AdminUser[]>;
  }, []);

  const fetchTransactions = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/transactions`, { headers: HEADERS });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<AdminTx[]>;
  }, []);

  const fetchComplaints = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/admin/complaints`, { headers: HEADERS });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Complaint[]>;
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, u, t, c] = await Promise.all([
        fetchAnalytics(), fetchUsers(), fetchTransactions(), fetchComplaints(),
      ]);
      setAnalytics(a);
      setUsers(u);
      setTransactions(t);
      setComplaints(c);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("Forbidden") ? "Admin token invalid. Set VITE_ADMIN_TOKEN in your .env." : "Failed to load data — check backend connection.");
    } finally {
      setLoading(false);
    }
  }, [fetchAnalytics, fetchUsers, fetchTransactions, fetchComplaints]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Update complaint status ──────────────────────────────────────────
  const updateStatus = async (id: number, status: Complaint["status"]) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: HEADERS,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    } catch {
      alert("Failed to update complaint status.");
    }
  };

  // ── Filtered views ───────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.user_id.toLowerCase().includes(userSearch.toLowerCase());
    const matchPlan = planFilter === "All" || u.current_plan === planFilter;
    return matchSearch && matchPlan;
  });

  const filteredTxs = transactions.filter((t) => {
    const matchSearch =
      t.ticker.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(txSearch.toLowerCase());
    const matchType = txTypeFilter === "All" || t.type === txTypeFilter;
    return matchSearch && matchType;
  });

  const filteredComplaints = complaints.filter(
    (c) => statusFilter === "All" || c.status === statusFilter
  );

  // ── Chart data (derive from real txs) ───────────────────────────────
  const chartData = (() => {
    const byDay: Record<string, { date: string; buys: number; sells: number; topups: number }> = {};
    transactions.slice(0, 100).forEach((t) => {
      const d = new Date(t.created_at).toLocaleDateString("en-SG", { day: "2-digit", month: "short" });
      if (!byDay[d]) byDay[d] = { date: d, buys: 0, sells: 0, topups: 0 };
      const amt = parseFloat(t.total_amount);
      if (t.type === "BUY") byDay[d].buys += amt;
      else if (t.type === "SELL") byDay[d].sells += amt;
      else byDay[d].topups += amt;
    });
    return Object.values(byDay).slice(-7).reverse();
  })();

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",     label: "Overview",     icon: <Home className="w-3.5 h-3.5" /> },
    { id: "users",        label: "Users",        icon: <Users className="w-3.5 h-3.5" /> },
    { id: "transactions", label: "Transactions", icon: <History className="w-3.5 h-3.5" /> },
    { id: "complaints",   label: "Complaints",   icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "analytics",    label: "Analytics",    icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-mono" style={{ color: p.color }}>
            {p.name}: ${parseFloat(String(p.value)).toLocaleString("en", { maximumFractionDigits: 0 })}
          </p>
        ))}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-auto custom-scrollbar bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-medium text-foreground font-mono">Admin Panel</h1>
              <p className="text-xs text-muted-foreground font-mono">System management · SIMULATE mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-mono border" style={{ borderColor: "var(--trust-bronze)", color: "var(--trust-bronze)" }}>
              Admin
            </span>
            <button
              onClick={loadAll}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(239,158,74,0.1)] border border-[rgba(239,158,74,0.3)] rounded-xl text-sm text-[#EF9E4A] font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* KPI summary cards */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Users",        value: analytics.users.total.toLocaleString(),                     sub: `+${analytics.users.newThisMonth} this month`,         icon: Users,     color: "var(--trust-blue)" },
              { label: "Trade Volume",        value: `$${(analytics.transactions.volume / 1000).toFixed(1)}k`, sub: `${analytics.transactions.total} transactions`,          icon: TrendingUp, color: "var(--trust-bronze)" },
              { label: "Wallet AUM",          value: `$${analytics.wallet.avg.toFixed(0)} avg`,                 sub: `$${(analytics.wallet.total / 1000).toFixed(1)}k total`, icon: Wallet,    color: "#6BAB8E" },
              { label: "Pending Complaints",  value: analytics.complaints.pending.toString(),                   sub: `${analytics.complaints.total} total tickets`,           icon: MessageSquare, color: analytics.complaints.pending > 0 ? "#EF9E4A" : "var(--muted-foreground)" },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-mono">{label}</span>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-xl font-medium font-mono" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5 w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-all ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}{t.label}
              {t.id === "complaints" && analytics?.complaints.pending ? (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono" style={{ background: "rgba(239,158,74,0.2)", color: "#EF9E4A" }}>
                  {analytics.complaints.pending}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {tab === "overview" && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Plan breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {[
                  { plan: "FREE",       count: analytics.users.total - analytics.users.pro - analytics.users.enterprise, color: "var(--muted-foreground)" },
                  { plan: "PRO",        count: analytics.users.pro,        color: "var(--trust-blue)" },
                  { plan: "ENTERPRISE", count: analytics.users.enterprise, color: "var(--trust-bronze)" },
                ].map(({ plan, count, color }) => (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono" style={{ color }}>{plan}</span>
                      <span className="text-xs font-mono text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${analytics.users.total ? (count / analytics.users.total) * 100 : 0}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Transaction Mix</h3>
              <div className="space-y-3">
                {[
                  { type: "BUY",   count: analytics.transactions.buys,   color: "var(--trust-blue)" },
                  { type: "SELL",  count: analytics.transactions.sells,  color: "var(--trust-bronze)" },
                  { type: "TOPUP", count: analytics.transactions.topups, color: "#6BAB8E" },
                ].map(({ type, count, color }) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono" style={{ color }}>{type}</span>
                      <span className="text-xs font-mono text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${analytics.transactions.total ? (count / analytics.transactions.total) * 100 : 0}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaint status */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Complaint Status</h3>
              <div className="space-y-3">
                {(["PENDING", "INVESTIGATING", "RESOLVED"] as const).map((s) => {
                  const count = analytics.complaints[s.toLowerCase() as "pending" | "investigating" | "resolved"];
                  const { color, icon } = STATUS_STYLE[s];
                  return (
                    <div key={s} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2" style={{ color }}>
                        {icon}
                        <span className="text-xs font-mono capitalize">{s.toLowerCase()}</span>
                      </div>
                      <span className="text-sm font-mono font-medium text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ──────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users…"
                  className="bg-card border border-border text-foreground text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none font-mono w-52"
                />
              </div>
              <div className="flex gap-1">
                {["All", "FREE", "PRO", "ENTERPRISE"].map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setPlanFilter(plan)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${planFilter === plan ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{filteredUsers.length} users</span>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    {["Name / Email", "Plan", "Balance", "Volume", "Trades", "Joined", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-mono text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground font-mono">No users found</td></tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground font-mono">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: PLAN_COLORS[u.current_plan] }}>{u.current_plan}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-foreground">
                        ${parseFloat(u.wallet_balance).toLocaleString("en", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-foreground">
                        ${parseFloat(u.trade_volume).toLocaleString("en", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.tx_count}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        {u.is_admin && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ color: "var(--trust-bronze)", background: "rgba(175,160,137,0.12)" }}>
                            Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TRANSACTIONS ───────────────────────────────────────────────── */}
        {tab === "transactions" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search ticker or user…"
                  className="bg-card border border-border text-foreground text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none font-mono w-52"
                />
              </div>
              <div className="flex gap-1">
                {["All", "BUY", "SELL", "TOPUP"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTxTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${txTypeFilter === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{filteredTxs.length} records</span>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    {["#", "User", "Ticker", "Type", "Shares", "Price", "Total", "Date"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-mono text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground font-mono">No transactions found</td></tr>
                  ) : filteredTxs.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{t.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-medium text-foreground">{t.ticker}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-medium" style={{ color: TX_COLOR[t.type] }}>{t.type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-foreground">{parseFloat(t.shares).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">${parseFloat(t.price_per_share).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-foreground">${parseFloat(t.total_amount).toLocaleString("en", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        <p>{fmtDate(t.created_at)}</p>
                        <p className="text-[10px]">{fmtTime(t.created_at)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COMPLAINTS ─────────────────────────────────────────────────── */}
        {tab === "complaints" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1">
                {["All", "PENDING", "INVESTIGATING", "RESOLVED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${statusFilter === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Upload document button (for attaching evidence) */}
              <label
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                title="Attach document to a complaint"
              >
                <FileUp className="w-3.5 h-3.5" />
                Attach Doc
                <input type="file" className="hidden" accept=".pdf,.docx,.png,.jpg" />
              </label>
            </div>

            <div className="space-y-2">
              {filteredComplaints.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center text-xs text-muted-foreground font-mono">
                  No complaints {statusFilter !== "All" ? `with status "${statusFilter}"` : "yet"}.
                </div>
              ) : filteredComplaints.map((c) => {
                const st = STATUS_STYLE[c.status];
                const isExpanded = expandedComplaint === c.id;
                return (
                  <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-secondary/20 transition-colors"
                      onClick={() => setExpandedComplaint(isExpanded ? null : c.id)}
                    >
                      <div className="mt-0.5 flex-shrink-0" style={{ color: st.color }}>{st.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground font-mono">{c.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold" style={{ color: st.color, background: st.bg }}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {c.name} · {c.email} · {fmtDate(c.created_at)}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-5 py-4 space-y-4">
                        <p className="text-sm text-foreground font-mono whitespace-pre-wrap">{c.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-mono">Update status:</span>
                          {(["PENDING", "INVESTIGATING", "RESOLVED"] as const).map((s) => (
                            <button
                              key={s}
                              disabled={c.status === s}
                              onClick={() => updateStatus(c.id, s)}
                              className="px-3 py-1 rounded-lg text-xs font-mono border transition-all disabled:opacity-40"
                              style={c.status === s
                                ? { borderColor: STATUS_STYLE[s].color, color: STATUS_STYLE[s].color }
                                : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                              }
                            >
                              {s === "PENDING" ? "Re-open" : s === "INVESTIGATING" ? "Investigate" : "Resolve"}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Last updated: {fmtDate(c.updated_at)} {fmtTime(c.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ──────────────────────────────────────────────────── */}
        {tab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                Trade Volume (last 7 days, by date)
              </h3>
              {chartData.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono text-center py-16">No trade data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="buyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8BB8C9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8BB8C9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="buys" name="BUY" stroke="#8BB8C9" strokeWidth={1.5} fill="url(#buyGrad)" />
                    <Area type="monotone" dataKey="sells" name="SELL" stroke="#AFA089" strokeWidth={1.5} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                Top-up Volume (last 7 days)
              </h3>
              {chartData.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono text-center py-16">No top-up data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="topups" name="TOPUP" fill="#6BAB8E" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Summary metrics */}
            {analytics && (
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Platform Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Conversion Rate", value: `${analytics.users.total ? (((analytics.users.pro + analytics.users.enterprise) / analytics.users.total) * 100).toFixed(1) : 0}%`, icon: TrendingUp, color: "var(--trust-blue)" },
                    { label: "Avg Wallet",       value: `$${analytics.wallet.avg.toFixed(0)}`,                                                                                              icon: Wallet,    color: "var(--trust-bronze)" },
                    { label: "Avg Trades/User",  value: analytics.users.total ? (analytics.transactions.total / analytics.users.total).toFixed(1) : "0",                                    icon: BarChart2, color: "#6BAB8E" },
                    { label: "Resolution Rate",  value: `${analytics.complaints.total ? ((analytics.complaints.resolved / analytics.complaints.total) * 100).toFixed(0) : 100}%`,           icon: CheckCircle2, color: "#6BAB8E" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="text-center">
                      <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
                      <p className="text-lg font-mono font-medium" style={{ color }}>{value}</p>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
