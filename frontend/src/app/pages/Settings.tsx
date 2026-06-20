import { useState } from "react";
import {
  Bell,
  Smartphone,
  MessageSquare,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Lock,
  ChevronDown,
  Crown,
  Wallet,
  Zap,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { CreateTriggerModal } from "../components/CreateTriggerModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

// ── Subscription + Wallet section ─────────────────────────────────────────
function SubscriptionSection() {
  const user  = getStoredUser();
  const plan  = user?.current_plan ?? "FREE";
  const token = user?.token ?? localStorage.getItem("token") ?? "";
  const [topupAmount, setTopupAmount] = useState("100");
  const [loading, setLoading]         = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const checkout = async (type: string, amount?: number) => {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/create-checkout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ type, ...(amount ? { amount } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to start checkout"); return; }
      // Stripe-hosted checkout — redirect full page
      window.location.href = data.url;
    } catch {
      setError("Network error — could not reach backend.");
    } finally {
      setLoading(null);
    }
  };

  const PLANS = [
    {
      id: "FREE",
      label: "Free",
      price: "$0 / mo",
      color: "var(--muted-foreground)",
      bg: "rgba(107,142,159,0.08)",
      features: ["10 stock screener results", "Basic AI analysis", "Simulated trading ($10k wallet)"],
    },
    {
      id: "PRO",
      label: "Pro",
      price: "$49 / mo",
      color: "#8BB8C9",
      bg: "rgba(139,184,201,0.10)",
      features: ["Unlimited screener results", "Deep AI reports", "WhatsApp + Telegram alerts", "Priority support"],
    },
    {
      id: "ENTERPRISE",
      label: "Enterprise",
      price: "$199 / mo",
      color: "#AFA089",
      bg: "rgba(175,160,137,0.10)",
      features: ["Everything in Pro", "API access", "Dedicated account manager", "Custom integrations", "SLA guarantee"],
    },
  ];

  return (
    <section className="space-y-6 pt-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Crown className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">Plan &amp; Billing</h2>
        <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ color: PLANS.find(p => p.id === plan)?.color, background: PLANS.find(p => p.id === plan)?.bg }}>
          Current: {plan}
        </span>
      </div>

      {error && (
        <p className="text-xs text-[#EF9E4A] font-mono bg-[rgba(239,158,74,0.08)] border border-[rgba(239,158,74,0.25)] px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isCurrent = plan === p.id;
          return (
            <div
              key={p.id}
              className="bg-card border rounded-xl p-5 flex flex-col gap-4 transition-all"
              style={{ borderColor: isCurrent ? p.color : "var(--border)" }}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold font-mono" style={{ color: p.color }}>{p.label}</span>
                  {isCurrent && <CheckCircle2 className="w-4 h-4" style={{ color: p.color }} />}
                </div>
                <p className="text-xl font-mono font-medium text-foreground">{p.price}</p>
              </div>

              <ul className="space-y-1.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground font-mono">
                    <Zap className="w-3 h-3 mt-0.5 shrink-0" style={{ color: p.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              {!isCurrent && p.id !== "FREE" && (
                <button
                  disabled={loading === p.id}
                  onClick={() => checkout(p.id)}
                  className="w-full py-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                  style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}` }}
                >
                  {loading === p.id ? "Redirecting…" : (
                    <><ExternalLink className="w-3.5 h-3.5" /> Upgrade via Stripe</>
                  )}
                </button>
              )}
              {isCurrent && (
                <div className="w-full py-2 rounded-lg text-xs font-mono text-center"
                  style={{ background: p.bg, color: p.color }}>
                  Active plan
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wallet top-up */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Top-up Simulated Wallet</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-mono">Amount (SGD)</label>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono text-muted-foreground">$</span>
              <input
                type="number"
                min="1"
                step="50"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="bg-secondary border border-border text-foreground text-sm px-3 py-2 rounded-lg focus:outline-none font-mono w-28"
              />
            </div>
          </div>
          {/* Quick amounts */}
          {[100, 500, 1000, 5000].map((v) => (
            <button
              key={v}
              onClick={() => setTopupAmount(String(v))}
              className="px-3 py-2 rounded-lg text-xs font-mono border border-border text-muted-foreground hover:text-foreground hover:border-[#8BB8C9] transition-all"
            >
              ${v}
            </button>
          ))}
          <button
            disabled={loading === "TOPUP"}
            onClick={() => checkout("TOPUP", parseFloat(topupAmount || "0"))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold disabled:opacity-60 transition-all"
            style={{ background: "rgba(139,184,201,0.15)", color: "#8BB8C9", border: "1px solid #8BB8C9" }}
          >
            {loading === "TOPUP" ? "Redirecting…" : <><CreditCard className="w-3.5 h-3.5" /> Pay &amp; Top-up via Stripe</>}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mt-3">
          Powered by Stripe. You'll be redirected to a secure checkout page and funds credited after payment.
        </p>
      </div>
    </section>
  );
}

interface TriggerRule {
  id: string;
  asset: string;
  assetName: string;
  metric: string;
  condition: string;
  target: string;
  current: string;
  status: "active" | "nearing" | "crossed";
  trend: "up" | "down";
}

const MOCK_TRIGGERS: TriggerRule[] = [
  {
    id: "1",
    asset: "D05.SI",
    assetName: "DBS Group Holdings",
    metric: "Dividend Yield",
    condition: "Drops below",
    target: "5.00%",
    current: "5.12%",
    status: "nearing",
    trend: "down",
  },
  {
    id: "2",
    asset: "TSLA",
    assetName: "Tesla Inc.",
    metric: "Price",
    condition: "Drops below",
    target: "$150.00",
    current: "$145.20",
    status: "crossed",
    trend: "down",
  },
  {
    id: "3",
    asset: "AAPL",
    assetName: "Apple Inc.",
    metric: "RSI (14)",
    condition: "Crosses above",
    target: "70.0",
    current: "62.4",
    status: "active",
    trend: "up",
  },
  {
    id: "4",
    asset: "MSFT",
    assetName: "Microsoft Corp.",
    metric: "P/E Ratio",
    condition: "Drops below",
    target: "25.0",
    current: "24.8",
    status: "crossed",
    trend: "down",
  }
];

export function Settings() {
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 019-2834");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [triggers, setTriggers] = useState<TriggerRule[]>(MOCK_TRIGGERS);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);

  const handleDeleteTrigger = (id: string) => {
    setTriggers(triggers.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-full bg-background text-foreground p-6 md:p-10 font-sans">
      <div className="max-w-[1000px] mx-auto space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-2">Manage your plan, billing, communication channels, and market trigger rules.</p>
        </div>

        {/* Subscription & Billing */}
        <SubscriptionSection />

        {/* Contact Methods Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Smartphone className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Communication Channels</h2>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            {/* Phone Input Card */}
            <div className="md:col-span-5 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold mb-1">Secure Mobile Link</h3>
                <p className="text-xs text-muted-foreground mb-4">Link a number to receive encrypted off-app alerts.</p>
                
                <div className="space-y-3">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile Number</label>
                  <div className="flex bg-background border border-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#188bf6] focus-within:border-[#188bf6] transition-all">
                    <div className="flex items-center px-3 bg-secondary/50 border-r border-border cursor-pointer">
                      <span className="text-sm font-medium mr-1">US</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm font-mono outline-none w-full"
                      placeholder="+1 (000) 000-0000"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Lock className="w-3 h-3 mr-1.5" /> E2E Encrypted
                </div>
                <button className="bg-[#188bf6] hover:bg-[#157add] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Update Number
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="md:col-span-7 space-y-4">
              {/* WhatsApp Toggle */}
              <div className="flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">WhatsApp Alerts</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive immediate push notifications to your linked WhatsApp number.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#188bf6] focus-visible:ring-offset-2 focus-visible:ring-offset-background ${whatsappEnabled ? 'bg-[#188bf6]' : 'bg-muted'}`}
                >
                  <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${whatsappEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Telegram Toggle */}
              <div className="flex items-center justify-between p-5 bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center shrink-0">
                    {/* Standard Icon fallback for Telegram */}
                    <svg className="w-5 h-5 text-[#0088cc] ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Telegram Alerts</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Route alerts through our encrypted Telegram bot (@SIFTScreenerBot).</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTelegramEnabled(!telegramEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#188bf6] focus-visible:ring-offset-2 focus-visible:ring-offset-background ${telegramEnabled ? 'bg-[#188bf6]' : 'bg-muted'}`}
                >
                  <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${telegramEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Active Triggers Section */}
        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Active Trigger Rules</h2>
            </div>
            <button 
              onClick={() => setIsTriggerModalOpen(true)}
              className="flex items-center text-sm font-medium text-[#188bf6] hover:text-[#157add] transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> New Trigger
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-3">Asset</div>
              <div className="col-span-4">Condition</div>
              <div className="col-span-2 text-right">Target</div>
              <div className="col-span-2 text-right">Current</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {triggers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Bell className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No active triggers.</p>
                  <p className="text-xs opacity-70 mt-1">Create a trigger to monitor market movements automatically.</p>
                </div>
              ) : (
                triggers.map((trigger) => {
                  // Determine status styling
                  let statusIcon;
                  let statusColor;
                  let rowBg = "bg-transparent";

                  if (trigger.status === "crossed") {
                    statusIcon = <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />;
                    // Use subtle neutral shades depending on trend
                    statusColor = trigger.trend === "down" ? "text-muted-foreground bg-secondary/50 border-border" : "text-foreground bg-secondary border-border";
                    rowBg = trigger.trend === "down" ? "bg-muted/10" : "bg-muted/30";
                  } else if (trigger.status === "nearing") {
                    statusIcon = <Activity className="w-3.5 h-3.5 mr-1.5" />;
                    statusColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
                  } else {
                    statusIcon = <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />;
                    statusColor = "text-muted-foreground bg-secondary/50 border-border";
                  }

                  const valueColor = trigger.status === "crossed" 
                    ? (trigger.trend === "down" ? "text-muted-foreground" : "text-foreground") 
                    : "text-foreground";

                  return (
                    <div key={trigger.id} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-secondary/10 ${rowBg}`}>
                      {/* Asset Column */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{trigger.asset}</span>
                          {trigger.status === "crossed" && (
                            <span className="flex h-2 w-2 rounded-full bg-current shadow-[0_0_8px_currentColor] animate-pulse text-foreground" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{trigger.assetName}</div>
                      </div>

                      {/* Condition Column */}
                      <div className="col-span-4 flex items-center gap-2">
                        <div className={`px-2 py-1 rounded border text-[10px] font-medium uppercase tracking-wider flex items-center w-fit ${statusColor}`}>
                          {statusIcon}
                          {trigger.status}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground mr-1">{trigger.metric}</span>
                          <span className="font-medium">{trigger.condition.toLowerCase()}</span>
                        </div>
                      </div>

                      {/* Target Column */}
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-mono">{trigger.target}</span>
                      </div>

                      {/* Current Column */}
                      <div className="col-span-2 text-right">
                        <span className={`text-sm font-mono font-medium flex items-center justify-end gap-1.5 ${valueColor}`}>
                          {trigger.trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          {trigger.current}
                        </span>
                      </div>

                      {/* Action Column */}
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => handleDeleteTrigger(trigger.id)}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary"
                          title="Delete trigger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 text-right mt-2 font-medium flex items-center justify-end gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> All active triggers are monitored in real-time.
          </p>
        </section>

      </div>
      <CreateTriggerModal isOpen={isTriggerModalOpen} onClose={() => setIsTriggerModalOpen(false)} />
    </div>
  );
}
