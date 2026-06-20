import { useState } from "react";
import { Newspaper, Search, TrendingUp, TrendingDown, Minus, Clock, ExternalLink, Filter, Sparkles } from "lucide-react";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  tickers: string[];
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  impactScore: number;
  category: string;
  url: string;
}

const NEWS: NewsItem[] = [
  {
    id: "1",
    headline: "Apple Reports Record Services Revenue in Q4, Beats Analyst Estimates",
    source: "Bloomberg",
    time: "2 hours ago",
    tickers: ["AAPL"],
    summary: "Apple's services segment delivered $24.2B in revenue, up 12% year-over-year, driven by App Store growth and Apple TV+ subscriber expansion. The beat surpassed consensus estimates by 4.2%, reflecting strong ecosystem monetization. Management guided Q1 services growth of 10-12%, which analysts view as conservative.",
    sentiment: "positive",
    impactScore: 8.4,
    category: "Earnings",
    url: "#",
  },
  {
    id: "2",
    headline: "Fed Minutes Signal Two Rate Cuts Remain Possible Before Year-End",
    source: "Reuters",
    time: "3 hours ago",
    tickers: ["SPY", "QQQ", "TLT"],
    summary: "Federal Reserve meeting minutes revealed that a majority of members view two 25bps cuts as appropriate if inflation continues its trajectory toward the 2% target. Markets repriced rate cut probability from 62% to 74% following the release, supporting broad equity indices.",
    sentiment: "positive",
    impactScore: 9.1,
    category: "Macro",
    url: "#",
  },
  {
    id: "3",
    headline: "NVIDIA Supply Constraints Could Limit H200 Shipments Through Q2 2025",
    source: "The Information",
    time: "4 hours ago",
    tickers: ["NVDA", "TSMC", "AMD"],
    summary: "Supply chain sources indicate TSMC's CoWoS packaging capacity remains constrained, potentially limiting NVIDIA's H200 shipment volumes. Analysts estimate 15-20% of anticipated H200 orders may slip to Q3 2025, though demand remains substantially above supply at current pricing levels.",
    sentiment: "negative",
    impactScore: 7.2,
    category: "Supply Chain",
    url: "#",
  },
  {
    id: "4",
    headline: "DBS Group Posts 8% Rise in Net Interest Income on Robust Loan Growth",
    source: "Straits Times",
    time: "5 hours ago",
    tickers: ["D05.SI"],
    summary: "DBS reported Q3 net interest income of SGD 3.8B, up 8.2% YoY, driven by strong corporate and wealth management loan growth. Management maintained full-year NIM guidance of 2.15-2.20%, ahead of market consensus. Dividend payout ratio increased to 55%.",
    sentiment: "positive",
    impactScore: 7.8,
    category: "Earnings",
    url: "#",
  },
  {
    id: "5",
    headline: "China Manufacturing PMI Unexpectedly Contracts in October, Weighs on HKEX",
    source: "Financial Times",
    time: "6 hours ago",
    tickers: ["FXI", "EWH", "HSI"],
    summary: "China's official manufacturing PMI fell to 49.3 in October, below the 50-point expansion threshold and missing expectations of 50.1. The miss raises questions about the efficacy of recent stimulus measures and weighs on Hong Kong-listed equities.",
    sentiment: "negative",
    impactScore: 8.6,
    category: "Macro",
    url: "#",
  },
  {
    id: "6",
    headline: "Microsoft Azure Growth Accelerates to 33% as AI Workloads Scale",
    source: "Wall Street Journal",
    time: "7 hours ago",
    tickers: ["MSFT", "AMZN", "GOOGL"],
    summary: "Microsoft's Azure cloud unit reported 33% constant-currency growth in Q1 FY2025, accelerating from 29% in the prior quarter. CEO Satya Nadella attributed the acceleration to AI services which now contribute approximately 8 percentage points of Azure's growth.",
    sentiment: "positive",
    impactScore: 8.8,
    category: "Earnings",
    url: "#",
  },
  {
    id: "7",
    headline: "Singapore MAS Keeps Policy Unchanged, Flags External Demand Risks",
    source: "MAS Press Release",
    time: "8 hours ago",
    tickers: ["D05.SI", "O39.SI", "SGD"],
    summary: "The Monetary Authority of Singapore maintained its S$NEER policy band parameters unchanged at its semi-annual review, citing balanced inflation and growth risks. MAS flagged heightened uncertainty from geopolitical tensions and slower-than-expected global trade recovery.",
    sentiment: "neutral",
    impactScore: 6.5,
    category: "Central Bank",
    url: "#",
  },
  {
    id: "8",
    headline: "Tesla Cybertruck Recall Affects 27,000 Units Over Accelerator Pedal Defect",
    source: "NHTSA Filing",
    time: "10 hours ago",
    tickers: ["TSLA"],
    summary: "NHTSA documents show Tesla initiated a voluntary safety recall of 27,185 Cybertruck units due to a pedal cover that could detach and interfere with the accelerator assembly. Tesla confirmed the fix is a software update with no hardware replacement required.",
    sentiment: "negative",
    impactScore: 5.4,
    category: "Regulatory",
    url: "#",
  },
];

const CATEGORIES = ["All", "Earnings", "Macro", "Supply Chain", "Regulatory", "Central Bank"];
const SENTIMENTS = ["All", "positive", "negative", "neutral"];

export function NewsIntelligence() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sentiment, setSentiment] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = NEWS.filter((n) => {
    const matchSearch = n.headline.toLowerCase().includes(search.toLowerCase()) ||
      n.tickers.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === "All" || n.category === category;
    const matchSent = sentiment === "All" || n.sentiment === sentiment;
    return matchSearch && matchCat && matchSent;
  });

  const sentimentIcon = (s: NewsItem["sentiment"]) => {
    if (s === "positive") return <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--trust-blue)" }} />;
    if (s === "negative") return <TrendingDown className="w-3.5 h-3.5" style={{ color: "var(--trust-bronze)" }} />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const sentimentColor = (s: NewsItem["sentiment"]) => {
    if (s === "positive") return { color: "var(--trust-blue)", background: "rgba(139,184,201,0.12)" };
    if (s === "negative") return { color: "var(--trust-bronze)", background: "rgba(175,160,137,0.12)" };
    return { color: "var(--muted-foreground)", background: "rgba(107,130,153,0.12)" };
  };

  const impactBar = (score: number) => {
    const color = score >= 8 ? "var(--trust-blue)" : score >= 6 ? "var(--trust-bronze)" : "var(--trust-slate)";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score * 10}%`, background: color }} />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground font-mono flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-muted-foreground" />
              News Intelligence
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">AI-curated financial news with sentiment analysis and impact scoring</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--trust-blue)" }} />
            Live feed
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news or ticker..."
              className="w-full bg-card border border-border text-foreground text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none font-mono"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${category === cat ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {SENTIMENTS.map((s) => (
              <button
                key={s}
                onClick={() => setSentiment(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all ${sentiment === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* News list */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:border-accent/20 transition-all cursor-pointer"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{item.category}</span>
                      {item.tickers.map((t) => (
                        <span key={t} className="text-xs font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: "rgba(139,184,201,0.2)", color: "var(--trust-blue)" }}>{t}</span>
                      ))}
                    </div>
                    <h3 className="text-sm font-medium text-foreground font-mono leading-snug">{item.headline}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" />{item.time}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{item.source}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={sentimentColor(item.sentiment)}>
                      {sentimentIcon(item.sentiment)}
                      <span className="text-xs font-mono capitalize">{item.sentiment}</span>
                    </div>
                    <div className="w-24">
                      <p className="text-xs text-muted-foreground font-mono mb-1">Impact</p>
                      {impactBar(item.impactScore)}
                    </div>
                  </div>
                </div>

                {expanded === item.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--trust-blue)" }} />
                      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">AI Summary</p>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">{item.summary}</p>
                    <button className="flex items-center gap-1 mt-3 text-xs font-mono hover:text-foreground transition-colors" style={{ color: "var(--trust-blue)" }}>
                      Read full article <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground font-mono text-sm">No news matching your filters</div>
          )}
        </div>
      </div>
    </div>
  );
}
