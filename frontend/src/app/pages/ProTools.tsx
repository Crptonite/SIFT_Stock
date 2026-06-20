import { Activity, BarChart3, ListFilter, Menu } from "lucide-react";

export function ProTools() {
  // Mock data for Heatmap
  const heatmapData = [
    { name: "TECH", size: "w-[45%] h-40", isPositive: true, value: "+2.4%", arrow: "↑" },
    { name: "FIN", size: "w-[25%] h-40", isPositive: false, value: "-1.2%", arrow: "↓" },
    { name: "HLTH", size: "w-[28%] h-40", isPositive: true, value: "+0.8%", arrow: "↑" },
    { name: "ENER", size: "w-[20%] h-32", isPositive: null, value: "0.0%", arrow: "" },
    { name: "CONS", size: "w-[30%] h-32", isPositive: true, value: "+1.5%", arrow: "↑" },
    { name: "UTIL", size: "w-[15%] h-32", isPositive: false, value: "-0.5%", arrow: "↓" },
    { name: "REIT", size: "w-[15%] h-32", isPositive: true, value: "+0.2%", arrow: "↑" },
    { name: "COMM", size: "w-[17%] h-32", isPositive: false, value: "-3.1%", arrow: "↓" },
  ];

  // Mock data for Level 2
  const bids = [
    { size: "1,250", price: "184.22" },
    { size: "800", price: "184.21" },
    { size: "2,400", price: "184.20" },
    { size: "150", price: "184.19" },
    { size: "3,100", price: "184.18" },
    { size: "600", price: "184.17" },
  ];

  const asks = [
    { size: "400", price: "184.24" },
    { size: "2,100", price: "184.25" },
    { size: "950", price: "184.26" },
    { size: "1,200", price: "184.27" },
    { size: "300", price: "184.28" },
    { size: "1,500", price: "184.29" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background font-mono text-foreground animate-in fade-in duration-500">
      {/* Top Bar - Mobile */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 md:hidden">
        <Menu className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-foreground">Pro Trading Interface</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Desktop Title */}
      <div className="hidden md:flex items-center justify-center py-6 border-b border-border">
         <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-muted-foreground">Pro Trading Interface</h1>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-10 max-w-7xl mx-auto w-full">
        {/* Sector Heatmap Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Sector Heatmap
            </h2>
            <div className="flex gap-2 opacity-60">
              <span className="px-2 py-0.5 text-[9px] border border-border text-foreground/80 rounded">1D Change</span>
              <span className="px-2 py-0.5 text-[9px] border border-border text-foreground/80 rounded">Volume</span>
            </div>
          </div>

          <div className="flex flex-wrap w-full border border-border p-1 bg-secondary/20 rounded-sm gap-1">
            {heatmapData.map((item, i) => {
              const bgClass = item.isPositive === true
                ? "bg-[#6488A3]/15 border-[#6488A3]/30"
                : item.isPositive === false
                ? "bg-[#B36E5C]/15 border-[#B36E5C]/30"
                : "bg-secondary/50 border-border";

              const textClass = item.isPositive === true
                ? "text-foreground font-bold"
                : item.isPositive === false
                ? "text-foreground/60 font-light"
                : "text-muted-foreground font-normal";

              const labelClass = item.isPositive === true
                ? "text-[#6488A3] font-bold"
                : item.isPositive === false
                ? "text-[#B36E5C]/80 font-normal"
                : "text-muted-foreground font-normal";

              return (
                <div
                  key={i}
                  className={`${item.size} ${bgClass} border flex flex-col items-center justify-center relative group cursor-crosshair transition-all hover:bg-secondary/80 flex-grow`}
                >
                  <span className={`text-sm tracking-widest ${textClass}`}>{item.name}</span>
                  <span className={`text-[10px] flex items-center gap-1 mt-1 ${labelClass}`}>
                    {item.value} {item.arrow && <span className="font-sans text-[8px]">{item.arrow}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Level 2 Market Data Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <ListFilter className="w-3.5 h-3.5" />
              Level 2 Market Data
            </h2>
            <div className="text-[10px] font-mono border border-[#6488A3]/20 px-2 py-1 rounded bg-[#6488A3]/5 text-[#6488A3]/90">
              $AAPL · REAL-TIME
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bids Table */}
            <div className="border border-border rounded-sm overflow-hidden bg-card shadow-xl">
              <div className="grid grid-cols-2 bg-secondary/50 px-4 py-2 border-b border-border text-[9px] font-bold uppercase tracking-widest">
                <span className="text-[#6488A3]">Bid Size</span>
                <span className="text-right text-[#6488A3]">Price</span>
              </div>
              <div className="divide-y divide-border">
                {bids.map((bid, i) => (
                  <div key={i} className="grid grid-cols-2 px-4 py-3 text-[11px] hover:bg-secondary/50 transition-colors relative">
                    <div className="absolute inset-y-0 left-0 bg-[#6488A3]/10 transition-all" style={{ width: `${(parseInt(bid.size.replace(',',''))/3500)*100}%` }} />
                    <span className="relative text-foreground/80 font-medium tabular-nums">{bid.size}</span>
                    <span className="relative text-right text-[#6488A3] font-bold tabular-nums">{bid.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks Table */}
            <div className="border border-border rounded-sm overflow-hidden bg-card shadow-xl">
              <div className="grid grid-cols-2 bg-secondary/50 px-4 py-2 border-b border-border text-[9px] font-bold uppercase tracking-widest">
                <span className="text-[#B36E5C]">Price</span>
                <span className="text-right text-[#B36E5C]">Ask Size</span>
              </div>
              <div className="divide-y divide-border">
                {asks.map((ask, i) => (
                  <div key={i} className="grid grid-cols-2 px-4 py-3 text-[11px] hover:bg-secondary/50 transition-colors relative">
                    <div className="absolute inset-y-0 right-0 bg-[#B36E5C]/10 transition-all" style={{ width: `${(parseInt(ask.size.replace(',',''))/3500)*100}%` }} />
                    <span className="relative text-[#B36E5C] font-bold tabular-nums">{ask.price}</span>
                    <span className="relative text-right text-foreground/80 font-medium tabular-nums">{ask.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Structural Wireframe Elements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40 pt-6">
           {[
             { label: "Execution Engine", status: "Active" },
             { label: "Latency (ms)", status: "14.2" },
             { label: "Data Source", status: "IEX Cloud" },
             { label: "Protocol", status: "FIX/WebSocket" },
           ].map((stat, i) => (
             <div key={i} className="border border-border p-3 space-y-1 rounded-sm">
                <p className="text-[8px] uppercase tracking-tighter font-bold text-muted-foreground">{stat.label}</p>
                <div className="flex items-center justify-between text-foreground">
                  <p className="text-[10px] font-bold">{stat.status}</p>
                  <Activity className="w-2.5 h-2.5" />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
