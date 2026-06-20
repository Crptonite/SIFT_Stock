import { useState } from "react";
import { Bell, Plus, Trash2, TrendingUp, BarChart2, Newspaper, Zap, X, Check, ToggleLeft, ToggleRight } from "lucide-react";

type AlertType = "price" | "earnings" | "news" | "technical";
type AlertStatus = "active" | "triggered" | "paused";

interface Alert {
  id: string;
  type: AlertType;
  ticker: string;
  condition: string;
  value: string;
  status: AlertStatus;
  createdAt: string;
  triggeredAt?: string;
}

const INITIAL_ALERTS: Alert[] = [
  { id: "1", type: "price", ticker: "AAPL", condition: "Price above", value: "$195.00", status: "active", createdAt: "2024-10-15" },
  { id: "2", type: "price", ticker: "NVDA", condition: "Price below", value: "$850.00", status: "triggered", createdAt: "2024-10-10", triggeredAt: "2024-10-18 09:32" },
  { id: "3", type: "earnings", ticker: "MSFT", condition: "Earnings report", value: "Any beat/miss", status: "active", createdAt: "2024-10-12" },
  { id: "4", type: "technical", ticker: "AAPL", condition: "RSI above", value: "70 (overbought)", status: "active", createdAt: "2024-10-14" },
  { id: "5", type: "technical", ticker: "D05.SI", condition: "MACD crossover", value: "Bullish signal", status: "paused", createdAt: "2024-10-08" },
  { id: "6", type: "news", ticker: "TSLA", condition: "Keyword mention", value: "recall, SEC, lawsuit", status: "active", createdAt: "2024-10-11" },
  { id: "7", type: "price", ticker: "GOOGL", condition: "% change above", value: "+5% in a day", status: "triggered", createdAt: "2024-10-09", triggeredAt: "2024-10-16 14:05" },
];

const TYPE_ICONS: Record<AlertType, React.ReactNode> = {
  price: <TrendingUp className="w-4 h-4" />,
  earnings: <BarChart2 className="w-4 h-4" />,
  news: <Newspaper className="w-4 h-4" />,
  technical: <Zap className="w-4 h-4" />,
};

const TYPE_COLORS: Record<AlertType, string> = {
  price: "var(--trust-blue)",
  earnings: "var(--trust-bronze)",
  news: "var(--trust-slate)",
  technical: "#6B8E9F",
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "var(--trust-blue)", bg: "rgba(139,184,201,0.12)" },
  triggered: { label: "Triggered", color: "var(--trust-bronze)", bg: "rgba(175,160,137,0.12)" },
  paused: { label: "Paused", color: "var(--muted-foreground)", bg: "rgba(107,130,153,0.1)" },
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [filterType, setFilterType] = useState<"all" | AlertType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | AlertStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "price" as AlertType, ticker: "", condition: "", value: "" });

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      return { ...a, status: a.status === "active" ? "paused" : a.status === "paused" ? "active" : a.status };
    }));
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const addAlert = () => {
    if (!form.ticker || !form.condition || !form.value) return;
    const newAlert: Alert = {
      id: Date.now().toString(),
      type: form.type,
      ticker: form.ticker.toUpperCase(),
      condition: form.condition,
      value: form.value,
      status: "active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setForm({ type: "price", ticker: "", condition: "", value: "" });
    setShowForm(false);
  };

  const filtered = alerts.filter((a) => {
    const matchType = filterType === "all" || a.type === filterType;
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchType && matchStatus;
  });

  const counts = {
    active: alerts.filter((a) => a.status === "active").length,
    triggered: alerts.filter((a) => a.status === "triggered").length,
    paused: alerts.filter((a) => a.status === "paused").length,
  };

  const CONDITIONS: Record<AlertType, string[]> = {
    price: ["Price above", "Price below", "% change above", "% change below", "New 52W high", "New 52W low"],
    earnings: ["Earnings report", "EPS beat", "EPS miss", "Revenue beat", "Revenue miss", "Guidance raised"],
    news: ["Keyword mention", "Analyst upgrade", "Analyst downgrade", "Insider buying", "Insider selling"],
    technical: ["RSI above", "RSI below", "MACD crossover", "Bollinger breakout", "MA crossover", "Volume spike"],
  };

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground font-mono flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              Alerts
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Price, earnings, news, and technical indicator alerts</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all"
            style={{ background: "var(--trust-blue)", color: "#0B1015" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Alert
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {(["active", "triggered", "paused"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
              className={`bg-card border rounded-xl p-4 text-left transition-all ${filterStatus === status ? "border-accent/40" : "border-border hover:border-border/80"}`}
            >
              <p className="text-2xl font-medium font-mono" style={{ color: STATUS_CONFIG[status].color }}>{counts[status]}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1 capitalize">{status} alerts</p>
            </button>
          ))}
        </div>

        {/* Add alert form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground font-mono">Create Alert</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AlertType, condition: "" }))}
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                >
                  <option value="price">Price</option>
                  <option value="earnings">Earnings</option>
                  <option value="news">News</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Ticker</label>
                <input
                  value={form.ticker}
                  onChange={(e) => setForm((p) => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                  placeholder="AAPL"
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono uppercase"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                >
                  <option value="">Select...</option>
                  {CONDITIONS[form.type].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Value</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  placeholder="e.g. $200.00"
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={addAlert}
                disabled={!form.ticker || !form.condition || !form.value}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono disabled:opacity-40 transition-all"
                style={{ background: "var(--trust-slate)", color: "#fff" }}
              >
                <Check className="w-3.5 h-3.5" />
                Create Alert
              </button>
            </div>
          </div>
        )}

        {/* Type filter */}
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5 w-fit">
          {(["all", "price", "earnings", "news", "technical"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize transition-all ${filterType === type ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {filtered.map((alert) => (
            <div key={alert.id} className={`bg-card border rounded-xl px-5 py-4 flex items-center gap-4 transition-all ${alert.status === "triggered" ? "border-accent/20" : "border-border"}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${TYPE_COLORS[alert.type]}18`, color: TYPE_COLORS[alert.type] }}>
                {TYPE_ICONS[alert.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground font-mono">{alert.ticker}</span>
                  <span className="text-xs font-mono text-muted-foreground">{alert.condition}: {alert.value}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ color: STATUS_CONFIG[alert.status].color, background: STATUS_CONFIG[alert.status].bg }}>
                    {STATUS_CONFIG[alert.status].label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono capitalize">{alert.type}</span>
                  {alert.triggeredAt && (
                    <span className="text-xs text-muted-foreground font-mono">Triggered: {alert.triggeredAt}</span>
                  )}
                  {!alert.triggeredAt && (
                    <span className="text-xs text-muted-foreground font-mono">Created: {alert.createdAt}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {alert.status !== "triggered" && (
                  <button onClick={() => toggleAlert(alert.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {alert.status === "active"
                      ? <ToggleRight className="w-5 h-5" style={{ color: "var(--trust-blue)" }} />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                )}
                <button onClick={() => deleteAlert(alert.id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground font-mono text-sm">No alerts matching filters</div>
          )}
        </div>
      </div>
    </div>
  );
}
