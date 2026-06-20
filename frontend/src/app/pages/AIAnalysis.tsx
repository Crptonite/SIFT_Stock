import { useState } from "react";
import { 
  Search, 
  BrainCircuit, 
  Activity, 
  ShieldCheck, 
  Globe, 
  Scale, 
  Users, 
  Leaf, 
  Building2, 
  Landmark,
  Menu
} from "lucide-react";

export function AIAnalysis() {
  const [ticker, setTicker] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    if (!ticker) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-full bg-background font-sans text-foreground animate-in fade-in duration-500 pb-12">
      {/* Top Bar - Mobile */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 md:hidden">
        <Menu className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-foreground">Risk Engine</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      <div className="flex-1 px-4 py-8 md:p-10 max-w-6xl mx-auto w-full space-y-10">
        
        {/* Header Title (Desktop) */}
        <div className="hidden md:flex items-center gap-3 pb-4 border-b border-border">
          <BrainCircuit className="w-6 h-6 text-[#6488A3]" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Comprehensive Risk Engine</h1>
        </div>

        {/* Top Section (The Input) */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="Analyze Ticker: $LMT or $D05.SI"
              className="w-full bg-secondary/50 border border-border rounded-sm py-5 pl-14 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#6488A3] focus:ring-1 focus:ring-[#6488A3] transition-all font-mono text-sm uppercase"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full md:w-auto px-8 py-5 bg-[#6488A3] hover:bg-[#6488A3]/80 disabled:opacity-50 text-background font-bold uppercase tracking-widest text-[11px] rounded-sm transition-colors flex items-center justify-center gap-3"
          >
            {isScanning ? (
              <Activity className="w-4 h-4 animate-pulse" />
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            Run Comprehensive Risk Scan
          </button>
        </div>

        {/* The Verdict Card (Primary Output) */}
        <section className="bg-card border border-border rounded-sm p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8BB8C9]" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">AI Investment Verdict</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#8BB8C9]/10 border border-[#8BB8C9]/30 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8BB8C9]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8BB8C9]">Data Synthesis Confidence: 95%</span>
              </div>
            </div>
            <div className="text-left md:text-right bg-secondary/50 px-4 py-2 border border-border rounded-sm">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Target Asset</p>
              <p className="text-xl font-mono font-bold text-foreground">{ticker.toUpperCase() || "$LMT"}</p>
            </div>
          </div>

          <div className="bg-secondary/50 border border-border p-6 rounded-sm">
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-medium">
              <strong className="text-foreground font-bold tracking-wide">VERDICT: MONITOR.</strong> Strong historical yields and operational moats, but elevated long-term ESG and regulatory risks. The asset presents highly stable short-term cash flows and dividend safety, though shifting global trade policies and localized scrutiny necessitate active algorithmic surveillance.
            </p>
          </div>
        </section>

        {/* The 6-Part Risk Matrix (Data Modules) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Risk Matrix Breakdown</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Module 1: Financial & Credit */}
            <div className="bg-card border border-border hover:border-border/50 transition-all rounded-sm p-6 flex flex-col h-full group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-sm bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Risk Score</span>
                  <span className="text-lg font-mono font-bold text-[#8BB8C9]">22/100</span>
                </div>
              </div>
              <div className="mb-6 flex-grow">
                <h4 className="text-sm font-bold text-foreground mb-2">Financial & Credit</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Summarizing debt profile, operational cash flow stability, and short-term liquidity health.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Severity Level</span>
                  <span className="text-[#8BB8C9]">Low</span>
                </div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#8BB8C9] w-[22%]" />
                </div>
              </div>
            </div>

            {/* Module 2: Operational & Business */}
            <div className="bg-card border border-border hover:border-border/50 transition-all rounded-sm p-6 flex flex-col h-full group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-sm bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Risk Score</span>
                  <span className="text-lg font-mono font-bold text-[#6488A3]">38/100</span>
                </div>
              </div>
              <div className="mb-6 flex-grow">
                <h4 className="text-sm font-bold text-foreground mb-2">Operational & Business</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Summarizing supply chain integrity, market competition, and core revenue moats.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Severity Level</span>
                  <span className="text-[#6488A3]">Low-Medium</span>
                </div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#6488A3] w-[38%]" />
                </div>
              </div>
            </div>

            {/* Module 3: Regulatory & Legal */}
            <div className="bg-card border border-border hover:border-border/50 transition-all rounded-sm p-6 flex flex-col h-full group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-sm bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Risk Score</span>
                  <span className="text-lg font-mono font-bold text-[#AFA089]">64/100</span>
                </div>
              </div>
              <div className="mb-6 flex-grow">
                <h4 className="text-sm font-bold text-foreground mb-2">Regulatory & Legal</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Summarizing compliance overhead, antitrust exposure, and ongoing multi-jurisdictional lawsuits.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Severity Level</span>
                  <span className="text-[#AFA089]">Elevated</span>
                </div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#AFA089] w-[64%]" />
                </div>
              </div>
            </div>

            {/* Module 4: Geopolitical & Macro */}
            <div className="bg-card border border-border hover:border-border/50 transition-all rounded-sm p-6 flex flex-col h-full group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-sm bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Risk Score</span>
                  <span className="text-lg font-mono font-bold text-[#4A5D6B]">55/100</span>
                </div>
              </div>
              <div className="mb-6 flex-grow">
                <h4 className="text-sm font-bold text-foreground mb-2">Geopolitical & Macro</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Summarizing interest rate sensitivities, foreign tariffs, and international trade stability.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Severity Level</span>
                  <span className="text-[#4A5D6B]">Moderate</span>
                </div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#4A5D6B] w-[55%]" />
                </div>
              </div>
            </div>

            {/* Module 5: ESG & Climate */}
            <div className="bg-card border border-border hover:border-border/50 transition-all rounded-sm p-6 flex flex-col h-full group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-sm bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Risk Score</span>
                  <span className="text-lg font-mono font-bold text-[#AFA089]">78/100</span>
                </div>
              </div>
              <div className="mb-6 flex-grow">
                <h4 className="text-sm font-bold text-foreground mb-2">ESG & Climate</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Summarizing direct carbon footprint, ethical sourcing controversies, and environmental impact.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Severity Level</span>
                  <span className="text-[#AFA089]">High</span>
                </div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#AFA089] w-[78%]" />
                </div>
              </div>
            </div>

            {/* Module 6: Reputational & Sentiment */}
            <div className="bg-card border border-border hover:border-border/50 transition-all rounded-sm p-6 flex flex-col h-full group">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-sm bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Risk Score</span>
                  <span className="text-lg font-mono font-bold text-[#8BB8C9]">42/100</span>
                </div>
              </div>
              <div className="mb-6 flex-grow">
                <h4 className="text-sm font-bold text-foreground mb-2">Reputational & Sentiment</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Summarizing real-time public opinion, brand decay, and executive leadership controversies.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Severity Level</span>
                  <span className="text-[#8BB8C9]">Medium</span>
                </div>
                <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#8BB8C9] w-[42%]" />
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
