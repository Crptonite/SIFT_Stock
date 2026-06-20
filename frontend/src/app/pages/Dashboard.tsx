import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Download, ChevronDown, Columns, Globe, BrainCircuit, Loader2 } from "lucide-react";
import { FiftyTwoWeekVisualizer } from "../components/FiftyTwoWeekVisualizer";
import { FilterModal } from "../components/FilterModal";
import { AuthCheckoutModal } from "../components/AuthCheckoutModal";
import { StockDetailsPanel } from "../components/StockDetailsPanel";
import { OnboardingModal } from "../components/OnboardingModal";
import { StockSearchWidget } from "../components/StockSearchWidget";
import { MarketOverviewCards } from "../components/MarketOverviewCards";

const MOCK_DATA = [
  // SGX
  { id: 1, ticker: "D05.SI", name: "DBS Group Holdings", exchange: "SGX", currency: "SGD", price: 34.50, change: 0.45, changePct: 1.32, low52: 28.17, high52: 36.23, mktCap: "88B", pe: 9.5, pb: 1.1, yield: "5.2%", debtEq: 0.8, roic: "12.4%", profitGrowth: "14.2%", divGrowth: "5.0%", fcf: "4.2B" },
  { id: 2, ticker: "O39.SI", name: "OCBC Bank", exchange: "SGX", currency: "SGD", price: 12.80, change: -0.10, changePct: -0.78, low52: 10.43, high52: 13.78, mktCap: "58B", pe: 8.1, pb: 1.0, yield: "6.1%", debtEq: 0.7, roic: "11.9%", profitGrowth: "11.5%", divGrowth: "6.2%", fcf: "3.1B" },
  { id: 3, ticker: "U11.SI", name: "United Overseas Bank", exchange: "SGX", currency: "SGD", price: 28.10, change: 0.22, changePct: 0.79, low52: 24.85, high52: 31.34, mktCap: "47B", pe: 8.5, pb: 0.9, yield: "5.8%", debtEq: 0.7, roic: null, profitGrowth: "10.1%", divGrowth: "4.8%", fcf: "2.8B" },
  { id: 4, ticker: "Z74.SI", name: "Singtel", exchange: "SGX", currency: "SGD", price: 2.45, change: 0.03, changePct: 1.24, low52: 2.30, high52: 2.75, mktCap: "40B", pe: 14.2, pb: 1.2, yield: "4.9%", debtEq: 0.6, roic: "8.2%", profitGrowth: "5.4%", divGrowth: null, fcf: "1.2B" },
  // US
  { id: 101, ticker: "AAPL", name: "Apple Inc.", exchange: "US", currency: "USD", price: 173.50, change: 1.25, changePct: 0.72, low52: 164.08, high52: 199.62, mktCap: "2.7T", pe: 26.5, pb: 38.2, yield: "0.5%", debtEq: 1.4, roic: "55.2%", profitGrowth: "2.1%", divGrowth: "4.2%", fcf: "106B" },
  { id: 102, ticker: "MSFT", name: "Microsoft Corp.", exchange: "US", currency: "USD", price: 420.55, change: -2.10, changePct: -0.50, low52: 315.00, high52: 430.82, mktCap: "3.1T", pe: 38.2, pb: 14.5, yield: "0.7%", debtEq: 0.4, roic: "28.5%", profitGrowth: "18.4%", divGrowth: "10.0%", fcf: "72B" },
  { id: 103, ticker: "GOOGL", name: "Alphabet Inc.", exchange: "US", currency: "USD", price: 142.65, change: 0.85, changePct: 0.60, low52: 115.35, high52: 153.78, mktCap: "1.8T", pe: 24.1, pb: 6.2, yield: "0.0%", debtEq: 0.1, roic: "24.1%", profitGrowth: "12.5%", divGrowth: null, fcf: "69B" },
  // HKEX
  { id: 201, ticker: "0700.HK", name: "Tencent Holdings", exchange: "HKEX", currency: "HKD", price: 308.20, change: -4.50, changePct: -1.44, low52: 260.40, high52: 362.80, mktCap: "2.9T", pe: 14.8, pb: 2.8, yield: "1.1%", debtEq: 0.4, roic: "11.2%", profitGrowth: "8.5%", divGrowth: "15.0%", fcf: "150B" },
  { id: 202, ticker: "9988.HK", name: "Alibaba Group", exchange: "HKEX", currency: "HKD", price: 72.85, change: 1.15, changePct: 1.60, low52: 65.20, high52: 102.50, mktCap: "1.4T", pe: 11.2, pb: 1.2, yield: "1.4%", debtEq: 0.2, roic: "8.4%", profitGrowth: "5.2%", divGrowth: null, fcf: "140B" },
];

const COLUMNS = [
  { id: "price", label: "Price & 52W Range" },
  { id: "mktCap", label: "Market Cap" },
  { id: "pe", label: "P/E Ratio" },
  { id: "pb", label: "P/B Ratio" },
  { id: "yield", label: "Div Yield" },
  { id: "debtEq", label: "Debt/Eq" },
  { id: "roic", label: "ROIC" },
  { id: "profitGrowth", label: "Profit Growth Rate" },
  { id: "divGrowth", label: "Dividend Growth Rate" },
  { id: "fcf", label: "FCF" },
];

export function Dashboard() {
  const [selectedMarket, setSelectedMarket] = useState<string>("All");
  const [showMarketMenu, setShowMarketMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(COLUMNS.map(c => c.id)));
  const [showColMenu, setShowColMenu] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<typeof MOCK_DATA[0] | null>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const marketMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setShowColMenu(false);
      }
      if (marketMenuRef.current && !marketMenuRef.current.contains(event.target as Node)) {
        setShowMarketMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (id: string) => {
    const newSet = new Set(visibleCols);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisibleCols(newSet);
  };

  const filteredData = selectedMarket === "All" 
    ? MOCK_DATA 
    : MOCK_DATA.filter(row => row.exchange === selectedMarket);

  const MissingData = () => (
    <span className="font-mono text-sm text-muted-foreground select-none">N/A</span>
  );

  return (
    <div className="p-4 md:p-10 max-w-[1800px] mx-auto min-h-full pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
            {selectedMarket === 'All' ? 'Global Equities' : 
             selectedMarket === 'SGX' ? 'SGX Blue Chips' : 
             selectedMarket === 'US' ? 'US Equities' : 'HKEX Top Movers'}
          </h1>
          <p className="text-sm text-muted-foreground font-medium flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-foreground/20 mr-2" />
            Monitoring {filteredData.length} assets
          </p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 flex-wrap pb-2 md:pb-0 overflow-visible">
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="h-11 px-4 md:px-5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center shadow-sm whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
            Filters
          </button>

          <button 
            className="h-11 px-4 md:px-5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center shadow-sm whitespace-nowrap"
          >
            <BrainCircuit className="w-4 h-4 mr-2 text-muted-foreground" />
            Send to AI
          </button>
          
          <div className="relative" ref={colMenuRef}>
            <button 
              onClick={() => setShowColMenu(!showColMenu)}
              className="h-11 px-4 md:px-5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center shadow-sm whitespace-nowrap"
            >
              <Columns className="w-4 h-4 mr-2 text-muted-foreground" />
              Metrics
              <ChevronDown className={`w-4 h-4 ml-2 text-muted-foreground transition-transform ${showColMenu ? 'rotate-180' : ''}`} />
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-border mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Criteria</span>
                </div>
                <div className="px-2 space-y-1 overflow-visible">
                  {COLUMNS.map(col => (
                    <label key={col.id} onClick={() => toggleColumn(col.id)} className="flex items-center px-3 py-2 hover:bg-accent rounded-lg cursor-pointer transition-colors">
                      <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-all ${
                        visibleCols.has(col.id) 
                          ? "bg-foreground border-foreground" 
                          : "border-border bg-transparent"
                      }`}>
                        {visibleCols.has(col.id) && (
                          <svg className="w-3 h-3 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-foreground font-medium select-none">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="h-11 w-11 shrink-0 bg-card border border-border rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center shadow-sm">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Market/Exchange Toggle */}
      <div className="mb-6 relative w-max z-20" ref={marketMenuRef}>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground font-semibold mr-2 shrink-0">Market/Exchange:</span>
          <button 
            onClick={() => setShowMarketMenu(!showMarketMenu)}
            className="h-9 px-4 bg-card border border-border rounded-full text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center shadow-sm whitespace-nowrap"
          >
            {selectedMarket === 'All' ? 'All Markets' : selectedMarket}
            <ChevronDown className={`w-4 h-4 ml-2 text-muted-foreground transition-transform ${showMarketMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showMarketMenu && (
          <div className="absolute left-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-xl py-2">
            {['All', 'SGX', 'US', 'HKEX'].map(market => (
              <button
                key={market}
                onClick={() => {
                  setSelectedMarket(market);
                  setShowMarketMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent transition-colors ${
                  selectedMarket === market ? 'text-foreground bg-accent/50' : 'text-muted-foreground'
                }`}
              >
                {market === 'All' ? 'All Markets' : market}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Market Overview + Stock Lookup (MUI) ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <MarketOverviewCards />
        </div>
        <div>
          <StockSearchWidget />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="w-full flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 text-foreground animate-spin mb-4" />
          <p className="text-foreground font-medium">Scanning Database...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-2xl shadow-sm">
          <p className="text-muted-foreground font-medium">No counters match your criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop View (Table) */}
          <div className="hidden md:inline-block min-w-full bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-visible w-fit">
              <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 font-semibold text-xs text-muted-foreground sticky left-0 z-10 w-64 border-r border-border backdrop-blur-md">Stock Identity</th>
                {COLUMNS.map(col => (
                  visibleCols.has(col.id) && (
                    <th key={col.id} className="px-6 py-4 font-semibold text-xs text-muted-foreground">
                      {col.label}
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-accent/40 transition-colors cursor-pointer group"
                  onClick={() => setSelectedStock(row)}
                >
                  <td className="px-6 py-4 sticky left-0 z-10 border-r border-border backdrop-blur-md bg-card group-hover:bg-accent/40 transition-colors">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 bg-secondary text-[10px] font-semibold rounded border border-border text-muted-foreground">{row.exchange}</span>
                        <span className="text-xs font-medium text-muted-foreground font-mono">{row.ticker}</span>
                      </div>
                      <span className="font-semibold text-base text-foreground">{row.name}</span>
                    </div>
                  </td>
                  
                  {visibleCols.has("price") && (
                    <td className="px-6 py-4 align-middle min-w-[240px]">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-baseline space-x-1">
                          <span className="font-mono text-lg font-medium text-foreground tabular-nums">${row.price.toFixed(2)}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{row.currency}</span>
                        </div>
                        <FiftyTwoWeekVisualizer low={row.low52} high={row.high52} current={row.price} />
                      </div>
                    </td>
                  )}
                  {visibleCols.has("mktCap") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.mktCap || <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("pe") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.pe ? row.pe.toFixed(1) : <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("pb") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.pb ? row.pb.toFixed(1) : <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("yield") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.yield || <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("debtEq") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.debtEq ? row.debtEq.toFixed(1) : <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("roic") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.roic || <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("profitGrowth") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.profitGrowth || <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("divGrowth") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.divGrowth || <MissingData />}</span>
                    </td>
                  )}
                  {visibleCols.has("fcf") && (
                    <td className="px-6 py-4 align-middle">
                      <span className="font-mono text-sm font-medium text-foreground tabular-nums">{row.fcf || <MissingData />}</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Card-based) */}
      <div className="md:hidden space-y-4">
        {filteredData.map((row) => {
          return (
            <div key={row.id} className="bg-[#121820] border border-white/5 rounded-xl overflow-hidden shadow-sm p-5 relative group flex flex-col">
              {/* Mobile Header: Identity */}
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 bg-black/30 text-[10px] font-bold uppercase tracking-widest rounded border border-white/10 text-white/50">{row.exchange}</span>
                    <span className="text-[10px] font-bold text-[#8BB8C9] font-mono">{row.ticker}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{row.name}</h3>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end space-x-1">
                    <div className="font-mono text-lg font-bold text-white tabular-nums leading-none">${row.price.toFixed(2)}</div>
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{row.currency}</div>
                  </div>
                  <div className="text-[11px] font-bold font-mono mt-1 flex items-center justify-end text-[#6488A3]">
                    {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)} ({row.changePct >= 0 ? '+' : ''}{row.changePct.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* 52W Visualizer */}
              <div className="p-3 bg-black/20 border border-white/5 rounded-xl mb-4">
                 <FiftyTwoWeekVisualizer low={row.low52} high={row.high52} current={row.price} />
              </div>

              {/* Expandable Metrics (No horizontal scroll) */}
              <details className="group/details">
                <summary className="flex items-center justify-between py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-[#8BB8C9] cursor-pointer list-none hover:bg-white/10 transition-colors">
                  <span>View Metrics</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open/details:rotate-180" />
                </summary>
                <div className="pt-4 pb-2 grid grid-cols-2 gap-3">
                  {COLUMNS.slice(1).map(col => {
                    if (!visibleCols.has(col.id)) return null;
                    const value = row[col.id as keyof typeof row];
                    const isMissing = value === null;
                    return (
                      <div key={col.id} className="p-3 bg-black/30 rounded-xl border border-white/5">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block mb-1">{col.label}</span>
                        <span className={`font-mono text-sm font-bold tabular-nums ${isMissing ? 'opacity-30 text-white' : 'text-white'}`}>
                          {isMissing ? '—' : (typeof value === 'number' ? value.toFixed(1) : value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </details>

              <button 
                onClick={() => setSelectedStock(row)}
                className="mt-4 w-full py-3 bg-[#6488A3]/10 border border-[#6488A3]/30 rounded-lg text-xs font-bold uppercase tracking-widest text-[#8BB8C9] hover:bg-[#6488A3]/20 transition-colors flex items-center justify-center"
              >
                Detailed Analysis
              </button>
            </div>
          );
        })}
      </div>
      </>
      )}
      <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />
      <AuthCheckoutModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <OnboardingModal 
        isOpen={isOnboardingModalOpen} 
        onClose={() => setIsOnboardingModalOpen(false)} 
        onSelectBlueChip={() => {
          setIsOnboardingModalOpen(false);
          // Load baseline data or reset filters
        }}
        onSelectCustom={() => {
          setIsOnboardingModalOpen(false);
          setIsFilterModalOpen(true);
        }}
      />
      <StockDetailsPanel 
        stock={selectedStock} 
        isOpen={!!selectedStock} 
        onClose={() => setSelectedStock(null)} 
      />
    </div>
  );
}