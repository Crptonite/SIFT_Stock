import { useState } from "react";
import { Search, TrendingUp, TrendingDown, BarChart2, Users, Building2, FileText } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const STOCKS: Record<string, {
  name: string; price: number; change: number; changePct: number;
  marketCap: string; pe: number; eps: number; dividendYield: number;
  week52High: number; week52Low: number; avgVolume: string;
  description: string; sector: string; exchange: string;
  financials: { year: string; revenue: number; netIncome: number; eps: number }[];
  ratios: { name: string; value: string; benchmark: string }[];
  analysts: { buy: number; hold: number; sell: number; priceTarget: number };
  insiders: { name: string; role: string; action: string; shares: number; date: string }[];
  institutional: { name: string; shares: string; pct: string; change: string }[];
  earnings: { quarter: string; estimated: number; actual: number }[];
}> = {
  AAPL: {
    name: "Apple Inc.",
    price: 189.84,
    change: 2.14,
    changePct: 1.14,
    marketCap: "$2.93T",
    pe: 31.2,
    eps: 6.08,
    dividendYield: 0.52,
    week52High: 199.62,
    week52Low: 164.08,
    avgVolume: "54.2M",
    description: "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. Its key products include iPhone, Mac, iPad, Apple Watch, AirPods, and subscription services including App Store, Apple Music, Apple TV+, iCloud, and Apple Pay.",
    sector: "Technology",
    exchange: "NASDAQ",
    financials: [
      { year: "FY2021", revenue: 365817, netIncome: 94680, eps: 5.61 },
      { year: "FY2022", revenue: 394328, netIncome: 99803, eps: 6.11 },
      { year: "FY2023", revenue: 383285, netIncome: 96995, eps: 6.13 },
      { year: "FY2024", revenue: 391035, netIncome: 93736, eps: 6.08 },
    ],
    ratios: [
      { name: "P/E Ratio", value: "31.2x", benchmark: "Sector avg: 24.8x" },
      { name: "Forward P/E", value: "28.6x", benchmark: "5yr avg: 26.3x" },
      { name: "EV/EBITDA", value: "22.4x", benchmark: "Sector avg: 18.2x" },
      { name: "Price/Sales", value: "8.1x", benchmark: "Sector avg: 5.2x" },
      { name: "Return on Equity", value: "147.9%", benchmark: "Sector avg: 22.4%" },
      { name: "Gross Margin", value: "45.2%", benchmark: "Sector avg: 41.8%" },
      { name: "FCF Yield", value: "3.8%", benchmark: "S&P 500 avg: 3.4%" },
      { name: "Debt/Equity", value: "1.98x", benchmark: "Sector avg: 0.82x" },
    ],
    analysts: { buy: 32, hold: 9, sell: 2, priceTarget: 218 },
    insiders: [
      { name: "Timothy Cook", role: "CEO", action: "Sell", shares: 511000, date: "2024-02-28" },
      { name: "Luca Maestri", role: "CFO", action: "Sell", shares: 210000, date: "2024-02-15" },
      { name: "Eddy Cue", role: "SVP Services", action: "Sell", shares: 80000, date: "2024-01-30" },
    ],
    institutional: [
      { name: "Vanguard Group", shares: "1.32B", pct: "8.63%", change: "+0.02%" },
      { name: "BlackRock", shares: "1.02B", pct: "6.68%", change: "-0.11%" },
      { name: "Berkshire Hathaway", shares: "905M", pct: "5.92%", change: "0.00%" },
      { name: "State Street", shares: "586M", pct: "3.83%", change: "+0.04%" },
    ],
    earnings: [
      { quarter: "Q1 FY24", estimated: 1.71, actual: 2.18 },
      { quarter: "Q2 FY24", estimated: 1.50, actual: 1.53 },
      { quarter: "Q3 FY24", estimated: 1.35, actual: 1.40 },
      { quarter: "Q4 FY24", estimated: 1.60, actual: 1.64 },
    ],
  },
};

function generatePriceData(basePrice: number, periods: number) {
  const prices: number[] = [basePrice * 0.88];
  for (let i = 1; i < periods; i++) {
    const change = (Math.random() - 0.48) * 4;
    prices.push(Math.max(prices[i - 1] + change, basePrice * 0.7));
  }
  return prices;
}

function generateRSI(prices: number[]): number[] {
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  const rsi: number[] = [50];
  const period = 14;
  for (let i = period; i < gains.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

function generateMACD(prices: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macd = prices.map((_, i) => ema12[i] - ema26[i]);
  const signal = ema(macd, 9);
  const histogram = macd.map((v, i) => v - signal[i]);
  return { macd, signal, histogram };
}

type TabType = "overview" | "financials" | "ratios" | "earnings" | "technical" | "insiders" | "institutional";

export function StockAnalysis() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("AAPL");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [chartType, setChartType] = useState<"price" | "rsi" | "macd">("price");

  const stock = STOCKS[ticker.toUpperCase()] || STOCKS["AAPL"];

  const LABELS = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(2024, 0, 1);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  });
  const prices = generatePriceData(stock.price, 60);
  const rsiData = generateRSI(prices);
  const macdData = generateMACD(prices);

  const priceChartData = {
    labels: LABELS,
    datasets: [
      {
        type: "line" as const,
        label: "Price",
        data: prices,
        borderColor: "#8BB8C9",
        backgroundColor: "rgba(139,184,201,0.06)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const rsiChartData = {
    labels: LABELS.slice(1),
    datasets: [
      {
        type: "line" as const,
        label: "RSI",
        data: rsiData,
        borderColor: "#8BB8C9",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const macdChartData = {
    labels: LABELS,
    datasets: [
      {
        type: "bar" as const,
        label: "Histogram",
        data: macdData.histogram,
        backgroundColor: macdData.histogram.map((v) => v >= 0 ? "rgba(139,184,201,0.6)" : "rgba(175,160,137,0.6)"),
        borderWidth: 0,
      },
      {
        type: "line" as const,
        label: "MACD",
        data: macdData.macd,
        borderColor: "#8BB8C9",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        type: "line" as const,
        label: "Signal",
        data: macdData.signal,
        borderColor: "#AFA089",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17,24,32,0.95)",
        titleColor: "#6B8299",
        bodyColor: "#D4DDE6",
        borderColor: "rgba(139,184,201,0.2)",
        borderWidth: 1,
        titleFont: { family: "JetBrains Mono, monospace", size: 10 },
        bodyFont: { family: "JetBrains Mono, monospace", size: 11 },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(139,184,201,0.05)", display: true },
        border: { display: false },
        ticks: { color: "#6B8299", font: { family: "JetBrains Mono, monospace" as const, size: 9 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: "rgba(139,184,201,0.05)", display: true },
        border: { display: false },
        ticks: { color: "#6B8299", font: { family: "JetBrains Mono, monospace" as const, size: 9 } },
        position: "right" as const,
      },
    },
  };

  const rsiOptions = {
    ...chartOptions,
    scales: {
      x: chartOptions.scales.x,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
      },
    },
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "financials", label: "Financials" },
    { id: "ratios", label: "Ratios" },
    { id: "earnings", label: "Earnings" },
    { id: "technical", label: "Technical" },
    { id: "insiders", label: "Insiders" },
    { id: "institutional", label: "Institutional" },
  ];

  const pctStyle = (v: number) => ({ color: v >= 0 ? "var(--trust-blue)" : "var(--trust-bronze)" });

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && setTicker(searchInput)}
              placeholder="Search ticker (e.g. AAPL)"
              className="w-full bg-card border border-border text-foreground text-sm pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-accent/50 font-mono uppercase"
            />
          </div>
          <button
            onClick={() => setTicker(searchInput)}
            className="px-4 py-2.5 rounded-xl text-sm font-mono"
            style={{ background: "var(--trust-blue)", color: "#0B1015" }}
          >
            Analyze
          </button>
        </div>

        {/* Stock header */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-medium text-foreground font-mono">{ticker.toUpperCase()}</h1>
                <span className="text-xs px-2 py-0.5 rounded border font-mono" style={{ borderColor: "var(--trust-slate)", color: "var(--trust-slate)" }}>{stock.exchange}</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{stock.name} · {stock.sector}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-medium text-foreground font-mono">${stock.price.toFixed(2)}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                {stock.changePct >= 0
                  ? <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--trust-blue)" }} />
                  : <TrendingDown className="w-3.5 h-3.5" style={{ color: "var(--trust-bronze)" }} />}
                <span className="text-sm font-mono" style={pctStyle(stock.changePct)}>
                  {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePct >= 0 ? "+" : ""}{stock.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-5 pt-5 border-t border-border">
            {[
              ["Mkt Cap", stock.marketCap],
              ["P/E", `${stock.pe}x`],
              ["EPS", `$${stock.eps}`],
              ["Div Yield", `${stock.dividendYield}%`],
              ["52W High", `$${stock.week52High}`],
              ["52W Low", `$${stock.week52Low}`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground font-mono">{label}</p>
                <p className="text-sm text-foreground font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
              {(["price", "rsi", "macd"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 rounded-md text-xs font-mono uppercase transition-all ${chartType === type ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {type}
                </button>
              ))}
            </div>
            {chartType === "rsi" && (
              <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                <span>Overbought: &gt;70</span>
                <span>Oversold: &lt;30</span>
              </div>
            )}
          </div>
          <div style={{ height: 260 }}>
            {chartType === "price" && <Chart type="line" data={priceChartData} options={chartOptions} />}
            {chartType === "rsi" && <Chart type="line" data={rsiChartData} options={rsiOptions} />}
            {chartType === "macd" && <Chart type="bar" data={macdChartData} options={chartOptions} />}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground font-mono">Company Overview</h3>
            </div>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">{stock.description}</p>
            <div className="mt-5">
              <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Analyst Consensus</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex rounded-full overflow-hidden h-3">
                  <div style={{ width: `${(stock.analysts.buy / (stock.analysts.buy + stock.analysts.hold + stock.analysts.sell)) * 100}%`, background: "var(--trust-blue)" }} />
                  <div style={{ width: `${(stock.analysts.hold / (stock.analysts.buy + stock.analysts.hold + stock.analysts.sell)) * 100}%`, background: "var(--trust-slate)" }} />
                  <div style={{ width: `${(stock.analysts.sell / (stock.analysts.buy + stock.analysts.hold + stock.analysts.sell)) * 100}%`, background: "var(--trust-bronze)" }} />
                </div>
                <div className="flex gap-3 text-xs font-mono">
                  <span style={{ color: "var(--trust-blue)" }}>Buy {stock.analysts.buy}</span>
                  <span style={{ color: "var(--trust-slate)" }}>Hold {stock.analysts.hold}</span>
                  <span style={{ color: "var(--trust-bronze)" }}>Sell {stock.analysts.sell}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-2">12-month price target: <span className="text-foreground">${stock.analysts.priceTarget}</span> ({((stock.analysts.priceTarget / stock.price - 1) * 100).toFixed(1)}% upside)</p>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground font-mono">Annual Financials (USD millions)</h3>
            </div>
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  {["Period", "Revenue", "Net Income", "EPS"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.financials.map((row) => (
                  <tr key={row.year} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{row.year}</td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground">${row.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground">${row.netIncome.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground">${row.eps.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "ratios" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground font-mono">Key Ratios</h3>
            </div>
            <div className="divide-y divide-border/50">
              {stock.ratios.map((r) => (
                <div key={r.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                  <span className="text-sm text-muted-foreground font-mono">{r.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground font-mono">{r.value}</span>
                    <p className="text-xs text-muted-foreground font-mono">{r.benchmark}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground font-mono">Earnings History</h3>
            </div>
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  {["Quarter", "Estimated EPS", "Actual EPS", "Surprise"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.earnings.map((e) => {
                  const surprise = ((e.actual - e.estimated) / e.estimated) * 100;
                  return (
                    <tr key={e.quarter} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{e.quarter}</td>
                      <td className="px-5 py-3 text-sm font-mono text-foreground">${e.estimated.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm font-mono text-foreground">${e.actual.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm font-mono" style={pctStyle(surprise)}>
                        {surprise >= 0 ? "+" : ""}{surprise.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "technical" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "RSI (14)", value: "62.4", note: "Neutral zone", border: "var(--trust-blue)" },
              { label: "MACD", value: "+1.24", note: "Bullish crossover", border: "var(--trust-blue)" },
              { label: "Support Level", value: "$182.40", note: "200-day MA", border: "var(--trust-slate)" },
              { label: "Resistance Level", value: "$195.80", note: "52-week high zone", border: "var(--trust-bronze)" },
              { label: "50-day MA", value: "$185.20", note: "Price above MA", border: "var(--trust-blue)" },
              { label: "200-day MA", value: "$178.60", note: "Bullish trend intact", border: "var(--trust-blue)" },
              { label: "Bollinger Upper", value: "$198.40", note: "Approaching upper band", border: "var(--trust-bronze)" },
              { label: "Bollinger Lower", value: "$172.80", note: "Strong support", border: "var(--trust-slate)" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between" style={{ borderLeft: `3px solid ${item.border}` }}>
                <div>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5">{item.note}</p>
                </div>
                <span className="text-lg font-medium text-foreground font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "insiders" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground font-mono">Insider Transactions</h3>
            </div>
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  {["Name", "Role", "Action", "Shares", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.insiders.map((ins, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-foreground">{ins.name}</td>
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{ins.role}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: ins.action === "Buy" ? "rgba(139,184,201,0.15)" : "rgba(175,160,137,0.15)", color: ins.action === "Buy" ? "var(--trust-blue)" : "var(--trust-bronze)" }}>
                        {ins.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground">{ins.shares.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{ins.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "institutional" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground font-mono">Institutional Ownership</h3>
            </div>
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  {["Institution", "Shares", "% Owned", "Change"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.institutional.map((inst, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-foreground">{inst.name}</td>
                    <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{inst.shares}</td>
                    <td className="px-5 py-3 text-sm font-mono text-foreground">{inst.pct}</td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: inst.change.startsWith("+") ? "var(--trust-blue)" : inst.change === "0.00%" ? "var(--muted-foreground)" : "var(--trust-bronze)" }}>
                      {inst.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
