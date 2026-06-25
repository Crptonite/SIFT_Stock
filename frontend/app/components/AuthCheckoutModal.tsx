import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  ExternalLink,
  CreditCard,
  Zap,
  Crown,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface AuthCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    id: "PRO",
    label: "Pro",
    price: "$49 / mo",
    color: "#8BB8C9",
    bg: "rgba(139,184,201,0.12)",
    features: [
      "Unlimited screener results",
      "Deep AI analysis reports",
      "WhatsApp & Telegram alerts",
      "Priority support",
    ],
  },
  {
    id: "ENTERPRISE",
    label: "Enterprise",
    price: "$199 / mo",
    color: "#AFA089",
    bg: "rgba(175,160,137,0.12)",
    features: [
      "Everything in Pro",
      "Full API access",
      "Dedicated account manager",
      "Custom integrations",
      "99.9% SLA",
    ],
  },
];

export function AuthCheckoutModal({ isOpen, onClose }: AuthCheckoutModalProps) {
  const [loading, setLoading]   = React.useState<string | null>(null);
  const [error, setError]       = React.useState<string | null>(null);
  const [topup, setTopup]       = React.useState("100");
  const [showTopup, setShowTopup] = React.useState(false);

  const token = localStorage.getItem("token") ?? "";

  const startCheckout = async (type: string, amount?: number) => {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, ...(amount !== undefined ? { amount } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start checkout");
        return;
      }
      // Redirect to Stripe-hosted checkout (secure, PCI-compliant)
      window.location.href = data.url;
    } catch {
      setError("Network error — check backend connection.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade Plan</DialogTitle>
          <DialogDescription>Choose a plan and pay securely via Stripe.</DialogDescription>
        </DialogHeader>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" style={{ color: "#AFA089" }} />
            <div>
              <h2 className="text-xl font-bold text-foreground">Upgrade Your Plan</h2>
              <p className="text-sm text-muted-foreground">Powered by Stripe — no card data touches our servers.</p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#EF9E4A] font-mono bg-[rgba(239,158,74,0.08)] border border-[rgba(239,158,74,0.25)] px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Plan cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="bg-background border border-border rounded-xl p-5 flex flex-col gap-4"
              >
                <div>
                  <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-1"
                     style={{ color: plan.color }}>
                    {plan.label}
                  </p>
                  <p className="text-2xl font-bold font-mono text-foreground">{plan.price}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Billed monthly · Cancel anytime</p>
                </div>

                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                      <Zap className="w-3 h-3 shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={loading === plan.id}
                  onClick={() => startCheckout(plan.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold font-mono flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.color}` }}
                >
                  {loading === plan.id ? (
                    "Redirecting to Stripe…"
                  ) : (
                    <><ExternalLink className="w-3.5 h-3.5" /> Subscribe — {plan.price}</>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Wallet top-up toggle */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowTopup(!showTopup)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 font-mono transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {showTopup ? "Hide" : "Top-up simulated wallet instead"}
            </button>

            {showTopup && (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-mono">Amount (SGD $)</label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={topup}
                    onChange={(e) => setTopup(e.target.value)}
                    className="bg-secondary border border-border text-foreground text-sm px-3 py-2 rounded-lg focus:outline-none font-mono w-28"
                  />
                </div>
                {[100, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTopup(String(v))}
                    className="px-3 py-2 rounded-lg text-xs font-mono border border-border text-muted-foreground hover:border-[#8BB8C9] hover:text-[#8BB8C9] transition-all"
                  >
                    ${v}
                  </button>
                ))}
                <button
                  disabled={loading === "TOPUP"}
                  onClick={() => startCheckout("TOPUP", parseFloat(topup || "0"))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold disabled:opacity-60"
                  style={{ background: "rgba(139,184,201,0.15)", color: "#8BB8C9", border: "1px solid #8BB8C9" }}
                >
                  {loading === "TOPUP" ? "Redirecting…" : "Pay via Stripe →"}
                </button>
              </div>
            )}
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" /> PCI DSS Compliant
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> 256-bit SSL
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
