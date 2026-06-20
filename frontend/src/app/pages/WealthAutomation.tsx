import { Search, DollarSign, Calendar, ChevronRight, Menu, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function WealthAutomation() {
  const [frequency, setFrequency] = useState("Monthly");
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const frequencies = ["Weekly", "Monthly", "Quarterly"];

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 animate-in zoom-in duration-300">
        <div className="w-full max-w-md border border-border bg-card p-10 text-center space-y-6 rounded-sm">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#8BB8C9]/10 flex items-center justify-center border border-[#8BB8C9]/30">
              <CheckCircle2 className="w-8 h-8 text-[#8BB8C9]" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Automation Active</h2>
            <p className="text-sm text-muted-foreground font-mono">
              Successfully configured {frequency} purchase of ${amount} for {asset || "D05.SI"}.
            </p>
          </div>
          <button
            onClick={() => setIsSuccess(false)}
            className="w-full py-3 bg-foreground text-background text-sm font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background font-sans text-foreground animate-in fade-in duration-500">
      {/* Top Bar - Local mobile header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 md:hidden">
        <Menu className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase">Automation Setup</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 flex flex-col items-center py-10 md:py-20 px-4">
        <div className="w-full max-w-lg space-y-12">
          {/* Header */}
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Wealth Automation</h2>
            <p className="text-sm text-muted-foreground">Configure your systematic Dollar-Cost Averaging strategy.</p>
          </div>

          {/* Form */}
          <div className="space-y-8 border border-border bg-card/30 p-6 md:p-8 rounded-sm relative overflow-hidden">
            {/* Structural wireframe corner accent */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-border/40 pointer-events-none" />
            
            {/* Step 1: Select Asset */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                01. Select Asset
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <input 
                  type="text" 
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  placeholder="e.g. D05.SI or AAPL" 
                  className="w-full bg-secondary/50 border border-border rounded-sm pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Step 2: Amount */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                02. Purchase Amount ($)
              </label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50.00" 
                  className="w-full bg-secondary/50 border border-border rounded-sm pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono uppercase">
                  Fractional Enabled
                </div>
              </div>
            </div>

            {/* Step 3: Frequency */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                03. Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {frequencies.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`py-3 text-[11px] font-bold uppercase tracking-widest border transition-all rounded-sm ${
                      frequency === f 
                        ? "bg-foreground text-background border-foreground shadow-lg" 
                        : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Block */}
            <div className="pt-4 border-t border-dashed border-border">
              <div className="bg-secondary/20 p-4 rounded-sm flex items-start gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Execution Strategy</p>
                  <p className="text-xs font-mono leading-relaxed">
                    SIFT will execute a market order for <span className="text-foreground font-bold">${amount || "0.00"}</span> of <span className="text-foreground font-bold">{asset || "asset"}</span> on the 1st of every {frequency.toLowerCase().replace('ly', '')}.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <button 
              onClick={() => setIsSuccess(true)}
              disabled={!amount || !asset}
              className="w-full py-5 bg-foreground text-background text-sm font-bold uppercase tracking-[0.2em] rounded-sm hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start Automation
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest leading-loose max-w-xs mx-auto">
            SYSTEMATIC INVESTMENT FILTERING TOOL <br />
            SECURED END-TO-END VIA PORT-LEVEL ENCRYPTION
          </p>
        </div>
      </div>
    </div>
  );
}
