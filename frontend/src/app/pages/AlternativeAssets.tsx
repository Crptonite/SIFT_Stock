import { Menu, Filter, ShieldCheck, ChevronRight, TrendingUp, Info } from "lucide-react";
import { useState } from "react";

export function AlternativeAssets() {
  const [activeTab, setActiveTab] = useState("Wholesale Bonds");
  const [sortBy, setSortBy] = useState("Highest Yield");

  const bonds = [
    { name: "SIA 3.50% 2027", risk: "Low", yield: "3.50%", type: "Corporate" },
    { name: "CapitaLand 4.10% Perp", risk: "Medium", yield: "4.10%", type: "Real Estate" },
    { name: "DBS Tier 2 Subordinated", risk: "Low", yield: "3.85%", type: "Financial" },
    { name: "Frasers Property 4.50%", risk: "Medium", yield: "4.50%", type: "Real Estate" },
    { name: "Keppel Corp 2.45% 2026", risk: "Low", yield: "2.45%", type: "Conglomerate" },
  ];

  const trusts = [
    { name: "BlackRock World Tech", risk: "High", yield: "12.40%", type: "Equity" },
    { name: "PIMCO Income Fund", risk: "Medium", yield: "6.20%", type: "Fixed Income" },
    { name: "Schroder Global Multi-Asset", risk: "Medium", yield: "5.80%", type: "Balanced" },
    { name: "JPM Emerging Markets", risk: "High", yield: "8.90%", type: "Equity" },
    { name: "Allianz Income and Growth", risk: "Medium", yield: "7.10%", type: "Income" },
  ];

  const data = activeTab === "Wholesale Bonds" ? bonds : trusts;
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "Highest Yield") return parseFloat(b.yield) - parseFloat(a.yield);
    if (sortBy === "Lowest Risk") {
      const riskOrder = { Low: 1, Medium: 2, High: 3 };
      return riskOrder[a.risk] - riskOrder[b.risk];
    }
    return 0;
  });

  return (
    <div className="flex flex-col min-h-full bg-background font-sans text-foreground animate-in fade-in duration-500">
      {/* Top Bar - Mobile Local */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 md:hidden">
        <Menu className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase">Alternative Assets</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Institutional Access</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
            <p className="text-sm text-muted-foreground">Exclusively curated wholesale instruments and managed funds.</p>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-3 self-start md:self-auto">
             <Filter className="w-4 h-4 text-muted-foreground" />
             <div className="flex bg-secondary/50 p-1 rounded-sm border border-border">
                {["Highest Yield", "Lowest Risk"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm ${
                      sortBy === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          {["Wholesale Bonds", "Unit Trusts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] relative transition-colors ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* List of Asset Cards */}
        <div className="space-y-3">
          {sortedData.map((item, i) => (
            <div 
              key={i} 
              className="group border border-border bg-card/30 p-5 md:p-6 rounded-sm hover:border-muted-foreground/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative overflow-hidden"
            >
              {/* Wireframe Corner Accent */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-border/20 group-hover:border-white/20 pointer-events-none" />
              
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-sm bg-secondary flex items-center justify-center shrink-0 border border-border group-hover:bg-white/5 transition-colors">
                  {activeTab === "Wholesale Bonds" ? <Info className="w-5 h-5 text-muted-foreground" /> : <TrendingUp className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm md:text-base tracking-tight">{item.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border uppercase font-mono tracking-tighter ${
                      item.type === 'Real Estate' || item.type === 'Fixed Income' 
                        ? 'bg-[#AFA089]/10 border-[#AFA089]/30 text-[#AFA089]' 
                        : item.type === 'Financial' || item.type === 'Equity'
                        ? 'bg-[#7E8C9A]/10 border-[#7E8C9A]/30 text-[#7E8C9A]'
                        : 'bg-secondary border-border text-muted-foreground'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.risk === 'Low' ? 'bg-[#7E8C9A]' : item.risk === 'Medium' ? 'bg-[#AFA089]' : 'bg-[#7A6B68]'
                      }`} />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{item.risk} Risk</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end md:gap-12 pl-[68px] md:pl-0">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Annual Yield</p>
                  <p className="text-2xl font-mono font-bold text-foreground">{item.yield}</p>
                </div>
                <button className="p-2 border border-border rounded-full group-hover:bg-foreground group-hover:text-background transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="bg-secondary/20 p-6 rounded-sm border border-border/50 border-dashed space-y-3">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Investor Qualification</h4>
           <p className="text-xs text-muted-foreground leading-relaxed italic">
             Access to wholesale bonds and certain unit trusts is restricted to Accredited Investors as defined under the Securities and Futures Act. SIFT verifies eligibility through automated KYC/AML integration.
           </p>
        </div>
      </div>
    </div>
  );
}
