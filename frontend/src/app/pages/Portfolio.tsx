import { useState, useEffect, useCallback } from "react";
import {
  Plus, TrendingUp, TrendingDown, DollarSign, BarChart2, X,
  ArrowUpRight, ArrowDownRight, Wallet, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import {
  ThemeProvider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Paper, Chip, Box,
  Typography, TextField, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { muiDarkTheme } from "../../lib/muiTheme";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Types ─────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  user_id: string;
  ticker: string;
  type: "BUY" | "SELL" | "TOPUP";
  shares: string;
  price_per_share: string;
  total_amount: string;
  created_at: string;
}

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  totalCost: number;
}

interface TradeForm {
  ticker: string;
  type: "BUY" | "SELL";
  shares: string;
  pricePerShare: string;
}

const SECTOR_COLORS = ["#8BB8C9", "#AFA089", "#4A5D6B", "#6B8E9F", "#C4B49E", "#6BAB8E"];

// ── Helpers ───────────────────────────────────────────────────────────────
function getStoredUser() {
  try {
    const s = localStorage.getItem("user");
    if (!s) return null;
    return JSON.parse(s) as { id?: string; user_id?: string; token?: string };
  } catch {
    return null;
  }
}

function buildPositions(txs: Transaction[]): Position[] {
  const map: Record<string, Position> = {};
  for (const tx of txs) {
    if (tx.type === "TOPUP") continue;
    const ticker = tx.ticker;
    const shares = parseFloat(tx.shares);
    const price = parseFloat(tx.price_per_share);
    if (!map[ticker]) map[ticker] = { ticker, shares: 0, avgCost: 0, totalCost: 0 };
    if (tx.type === "BUY") {
      const newTotal = map[ticker].totalCost + shares * price;
      const newShares = map[ticker].shares + shares;
      map[ticker].shares = newShares;
      map[ticker].totalCost = newTotal;
      map[ticker].avgCost = newShares > 0 ? newTotal / newShares : 0;
    } else {
      map[ticker].shares = Math.max(0, map[ticker].shares - shares);
      map[ticker].totalCost = map[ticker].shares * map[ticker].avgCost;
    }
  }
  return Object.values(map).filter((p) => p.shares > 0.0001);
}

// ── MUI Trade History Table ───────────────────────────────────────────────
type SortKey = "created_at" | "ticker" | "type" | "total_amount";
type SortDir  = "asc" | "desc";

function MuiTradeHistory({ transactions }: { transactions: Transaction[] }) {
  const [filter,  setFilter]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    setSortDir(sortKey === key && sortDir === "asc" ? "desc" : "asc");
    setSortKey(key);
  };

  const filtered = transactions
    .filter((t) =>
      !filter ||
      t.ticker.toLowerCase().includes(filter.toLowerCase()) ||
      t.type.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (sortKey === "total_amount") { av = parseFloat(av as string); bv = parseFloat(bv as string); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const typeChip = (type: string) => {
    const map: Record<string, { label: string; color: "success" | "warning" | "info" }> = {
      BUY:   { label: "BUY",   color: "info"    },
      SELL:  { label: "SELL",  color: "warning" },
      TOPUP: { label: "TOPUP", color: "success" },
    };
    const cfg = map[type] ?? { label: type, color: "info" };
    return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" />;
  };

  return (
    <Box>
      {/* Search filter */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Filter by ticker or type…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="small"
          sx={{ width: 260 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.secondary" }} /></InputAdornment>,
            sx: { fontFamily: "monospace", fontSize: 12 },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          {filtered.length} of {transactions.length} transactions
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>
                <TableSortLabel active={sortKey === "ticker"} direction={sortKey === "ticker" ? sortDir : "asc"} onClick={() => handleSort("ticker")}>
                  Ticker
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortKey === "type"} direction={sortKey === "type" ? sortDir : "asc"} onClick={() => handleSort("type")}>
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Shares</TableCell>
              <TableCell align="right">Price/Share</TableCell>
              <TableCell align="right">
                <TableSortLabel active={sortKey === "total_amount"} direction={sortKey === "total_amount" ? sortDir : "asc"} onClick={() => handleSort("total_amount")}>
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortKey === "created_at"} direction={sortKey === "created_at" ? sortDir : "asc"} onClick={() => handleSort("created_at")}>
                  Date
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary", fontStyle: "italic" }}>
                  {transactions.length === 0 ? "No transactions yet." : "No matches for your filter."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ color: "text.secondary", fontSize: 11 }}>{t.id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{t.ticker}</TableCell>
                  <TableCell>{typeChip(t.type)}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {parseFloat(t.shares).toFixed(4)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                    ${parseFloat(t.price_per_share).toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                    ${parseFloat(t.total_amount).toLocaleString("en", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    {new Date(t.created_at).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export function Portfolio() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeForm, setTradeForm] = useState<TradeForm>({ ticker: "", type: "BUY", shares: "", pricePerShare: "" });
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "positions" | "history">("overview");

  const user = getStoredUser();
  const userId = user?.id || user?.user_id;
  const token = user?.token || localStorage.getItem("token");

  // ── Fetch user data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [txRes, balRes] = await Promise.all([
        fetch(`${API_BASE}/api/transactions/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/balance/${userId}`),
      ]);

      if (txRes.ok) {
        const txData: Transaction[] = await txRes.json();
        setTransactions(txData);
      }
      if (balRes.ok) {
        const balData = await balRes.json();
        setWalletBalance(parseFloat(balData.wallet_balance ?? "0"));
        setCurrentPlan(balData.current_plan ?? "FREE");
      }
    } catch {
      setError("Failed to connect to backend. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Poll balance every 30s for real-time updates
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/balance/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(parseFloat(data.wallet_balance ?? "0"));
          setCurrentPlan(data.current_plan ?? "FREE");
        }
      } catch {}
    }, 30_000);
    return () => clearInterval(interval);
  }, [userId]);

  // ── Execute trade ────────────────────────────────────────────────────
  const executeTrade = async () => {
    if (!tradeForm.ticker || !tradeForm.shares || !tradeForm.pricePerShare) {
      setTradeError("All fields are required.");
      return;
    }
    setTradeLoading(true);
    setTradeError(null);
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          ticker: tradeForm.ticker.toUpperCase(),
          type: tradeForm.type,
          shares: parseFloat(tradeForm.shares),
          pricePerShare: parseFloat(tradeForm.pricePerShare),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTradeError(data.error || "Trade failed");
        return;
      }

      // Update balance immediately
      setWalletBalance(parseFloat(data.wallet_balance ?? "0"));
      setCurrentPlan(data.current_plan ?? currentPlan);

      // Prepend new transaction
      setTransactions((prev) => [data.transaction, ...prev]);

      // Reset form
      setTradeForm({ ticker: "", type: "BUY", shares: "", pricePerShare: "" });
      setShowTradeForm(false);
    } catch {
      setTradeError("Network error — could not reach backend.");
    } finally {
      setTradeLoading(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────
  const positions = buildPositions(transactions);
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);

  // For a simulated portfolio, current value = totalCost (no live prices)
  // In production, wire up a market-data API here.
  const totalValue = totalCost; // Replace with market price calculation
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? ((totalValue / totalCost) - 1) * 100 : 0;

  const sectorData = positions.map((p, i) => ({ name: p.ticker, value: Math.round(p.totalCost) }));

  const recentBuySells = transactions.filter((t) => t.type !== "TOPUP").slice(0, 12);
  const historyChartData = (() => {
    const byDay: Record<string, { date: string; value: number }> = {};
    let running = 0;
    [...transactions].reverse().forEach((t) => {
      const d = new Date(t.created_at).toLocaleDateString("en-SG", { month: "short", day: "2-digit" });
      const amt = parseFloat(t.total_amount);
      if (t.type === "BUY") running += amt;
      else if (t.type === "SELL") running -= amt;
      byDay[d] = { date: d, value: Math.max(0, running) };
    });
    return Object.values(byDay).slice(-10);
  })();

  const pnlStyle = (val: number) => ({
    color: val >= 0 ? "var(--trust-blue)" : "var(--trust-bronze)",
  });

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground font-mono">{label}</p>
        <p className="text-sm font-medium text-foreground font-mono">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">Please log in to view your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground font-mono">Portfolio</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Simulated ledger — real-time P&L tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => { setShowTradeForm(!showTradeForm); setTradeError(null); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all"
              style={{ background: "var(--trust-blue)", color: "#0B1015" }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Trade
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(239,158,74,0.1)] border border-[rgba(239,158,74,0.3)] rounded-xl text-sm text-[#EF9E4A] font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Trade form */}
        {showTradeForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium font-mono text-foreground">Execute Trade</h3>
              <button onClick={() => setShowTradeForm(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Buy/Sell toggle */}
            <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
              {(["BUY", "SELL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTradeForm((f) => ({ ...f, type: t }))}
                  className={`px-5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all ${
                    tradeForm.type === t
                      ? t === "BUY" ? "bg-[#8BB8C9] text-[#0B1015]" : "bg-[#AFA089] text-[#0B1015]"
                      : "text-muted-foreground"
                  }`}
                >
                  {t === "BUY" ? <ArrowUpRight className="w-3 h-3 inline mr-1" /> : <ArrowDownRight className="w-3 h-3 inline mr-1" />}
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-end">
              {[
                { label: "Ticker", key: "ticker",        placeholder: "AAPL",    type: "text"   },
                { label: "Shares", key: "shares",        placeholder: "10",      type: "number" },
                { label: "Price/Share ($)", key: "pricePerShare", placeholder: "173.50", type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-mono">{label}</label>
                  <input
                    type={type}
                    min="0"
                    step="any"
                    value={tradeForm[key as keyof TradeForm]}
                    onChange={(e) => setTradeForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono w-36"
                  />
                </div>
              ))}

              {/* Total preview */}
              {tradeForm.shares && tradeForm.pricePerShare && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-mono">Total</label>
                  <div className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs font-mono text-foreground w-36">
                    ${(parseFloat(tradeForm.shares || "0") * parseFloat(tradeForm.pricePerShare || "0")).toLocaleString("en", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}

              <button
                onClick={executeTrade}
                disabled={tradeLoading}
                className="px-5 py-2 rounded-lg text-xs font-mono font-semibold disabled:opacity-60 transition-all"
                style={tradeForm.type === "BUY" ? { background: "#8BB8C9", color: "#0B1015" } : { background: "#AFA089", color: "#0B1015" }}
              >
                {tradeLoading ? "Processing…" : `Confirm ${tradeForm.type}`}
              </button>
            </div>

            {tradeError && (
              <p className="text-xs text-[#EF9E4A] font-mono flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {tradeError}
              </p>
            )}

            <p className="text-[10px] text-muted-foreground font-mono">
              Wallet: ${walletBalance.toLocaleString("en", { minimumFractionDigits: 2 })} · Plan: {currentPlan}
            </p>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Wallet Balance",
              value: `$${walletBalance.toLocaleString("en", { minimumFractionDigits: 2 })}`,
              sub: currentPlan + " plan",
              icon: Wallet,
              color: "var(--trust-blue)",
            },
            {
              label: "Trade Cost Basis",
              value: `$${totalCost.toLocaleString("en", { maximumFractionDigits: 0 })}`,
              sub: `${positions.length} open positions`,
              icon: DollarSign,
              color: "var(--trust-bronze)",
            },
            {
              label: "P&L",
              value: `${totalPnL >= 0 ? "+" : ""}$${Math.abs(totalPnL).toLocaleString("en", { maximumFractionDigits: 0 })}`,
              sub: `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`,
              icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
              color: totalPnL >= 0 ? "var(--trust-blue)" : "var(--trust-bronze)",
            },
            {
              label: "All Transactions",
              value: transactions.length.toString(),
              sub: `${transactions.filter((t) => t.type === "BUY").length} buys · ${transactions.filter((t) => t.type === "SELL").length} sells`,
              icon: BarChart2,
              color: "var(--trust-slate)",
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xl font-medium text-foreground font-mono" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5 w-fit">
          {(["overview", "positions", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-mono capitalize transition-all ${activeTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Trade Cost Basis (cumulative)</h3>
              {historyChartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground font-mono">No trades yet. Use "New Trade" to get started.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={historyChartData}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8BB8C9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8BB8C9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#8BB8C9" strokeWidth={1.5} fill="url(#portfolioGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Position Allocation</h3>
              {sectorData.length === 0 ? (
                <div className="h-[160px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground font-mono text-center">No open positions</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={sectorData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                        {sectorData.map((_, i) => (
                          <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px", fontFamily: "var(--font-mono)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-3">
                    {sectorData.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                          <span className="text-xs text-muted-foreground font-mono">{s.name}</span>
                        </div>
                        <span className="text-xs text-foreground font-mono">
                          {totalCost > 0 ? ((s.value / totalCost) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── POSITIONS ─────────────────────────────────────────────────── */}
        {activeTab === "positions" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  {["Ticker", "Shares", "Avg Cost", "Total Cost", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground font-mono">
                      No open positions — use "New Trade" to place a BUY order.
                    </td>
                  </tr>
                ) : (
                  positions.map((p) => (
                    <tr key={p.ticker} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground font-mono">{p.ticker}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-mono">{p.shares.toLocaleString("en", { maximumFractionDigits: 4 })}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">${p.avgCost.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-mono">${p.totalCost.toLocaleString("en", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setTradeForm({ ticker: p.ticker, type: "SELL", shares: "", pricePerShare: p.avgCost.toFixed(2) });
                            setShowTradeForm(true);
                          }}
                          className="text-xs font-mono px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[#AFA089] transition-all"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── HISTORY (MUI Table) ───────────────────────────────────────── */}
        {activeTab === "history" && (
          <ThemeProvider theme={muiDarkTheme}>
            <MuiTradeHistory transactions={transactions} />
          </ThemeProvider>
        )}
      </div>
    </div>
  );
}
