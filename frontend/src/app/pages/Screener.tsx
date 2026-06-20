import { useState } from "react";
import { Search, Info, Download, BookmarkPlus, ChevronDown, Shield, X } from "lucide-react";
import { StockDetailsPanel } from "../components/StockDetailsPanel";
import { STOCK_DATABASE } from "../data/stockData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const METRIC_DEFINITIONS = {
  pe: "Price-to-Earnings Ratio: Current stock price divided by earnings per share (EPS) over the last 12 months. Formula: Market Price per Share / EPS",
  dividendYield: "Dividend Yield: Annual dividends per share divided by current stock price, expressed as a percentage. Formula: (Annual Dividends per Share / Price per Share) × 100",
  marketCap: "Market Capitalization: Total market value of company's outstanding shares. Formula: Current Stock Price × Total Outstanding Shares",
  revenueGrowth: "Revenue Growth: Year-over-year percentage increase in total revenue. Formula: ((Current Period Revenue - Prior Period Revenue) / Prior Period Revenue) × 100",
  profitGrowth: "Profit Growth: Year-over-year percentage increase in net profit. Formula: ((Current Period Profit - Prior Period Profit) / Prior Period Profit) × 100",
  ebita: "EBITA: Earnings Before Interest, Taxes, and Amortization. A measure of operating profitability. Formula: Net Income + Interest + Taxes + Amortization",
  pbt: "PBT (Profit Before Tax): Company's profit after all expenses except taxes. Formula: Revenue - Operating Expenses - Interest Expenses",
  pat: "PAT (Profit After Tax): Net profit after all expenses including taxes. Formula: PBT - Tax Expenses",
  ohlc: "OHLC: Open, High, Low, Close prices for the trading period. These are the four key price points used in technical analysis."
};

const MOCK_TEMPLATES = [
  { id: 1, name: "Bob's Watchlist", lastEdited: "2026-06-01" },
  { id: 2, name: "Growth Stocks", lastEdited: "2026-05-28" },
  { id: 3, name: "Value Picks", lastEdited: "2026-05-15" },
];

// Use shared database
const MOCK_RESULTS = STOCK_DATABASE;

export function Screener() {
  const [largePrintMode, setLargePrintMode] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStock, setSelectedStock] = useState<typeof MOCK_RESULTS[0] | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const [criteria, setCriteria] = useState({
    pe: "",
    dividendYield: "",
    marketCap: "",
    revenueGrowth: "",
    profitGrowth: "",
    ebita: "",
    pbt: "",
    pat: "",
    ohlc: ""
  });

  const inputHeight = largePrintMode ? "h-20" : "h-11";

  const handleSearch = () => {
    setHasSearched(true);
  };

  // Apply custom filtering logic based on user criteria
  const getFilteredResults = () => {
    if (!hasSearched) return [];

    return MOCK_RESULTS.filter(stock => {
      // P/E filter
      if (criteria.pe) {
        const peValue = stock.pe;
        if (peValue === null || peValue === undefined) return false;
        if (!evaluateCriteria(peValue, criteria.pe)) return false;
      }

      // Dividend Yield filter
      if (criteria.dividendYield) {
        const yieldValue = stock.dividendYield;
        if (yieldValue === null || yieldValue === undefined) return false;
        if (!evaluateCriteria(yieldValue, criteria.dividendYield)) return false;
      }

      // Market Cap filter
      if (criteria.marketCap) {
        const capValue = stock.mktCap?.replace(/[^0-9.]/g, '');
        const multiplier = stock.mktCap?.includes('T') ? 1000 : stock.mktCap?.includes('B') ? 1 : 0.001;
        const marketCapBillions = capValue ? parseFloat(capValue) * multiplier : 0;
        if (!evaluateCapCriteria(marketCapBillions, criteria.marketCap)) return false;
      }

      // Revenue Growth filter
      if (criteria.revenueGrowth) {
        const revGrowth = stock.revenueGrowth;
        if (revGrowth === null || revGrowth === undefined) return false;
        if (!evaluateCriteria(revGrowth, criteria.revenueGrowth)) return false;
      }

      // Profit Growth filter
      if (criteria.profitGrowth) {
        const profitGrowthValue = typeof stock.profitGrowth === 'string'
          ? parseFloat(stock.profitGrowth.replace('%', ''))
          : stock.profitGrowth;
        if (profitGrowthValue === null || profitGrowthValue === undefined) return false;
        if (!evaluateCriteria(profitGrowthValue, criteria.profitGrowth)) return false;
      }

      // EBITA filter (string comparison)
      if (criteria.ebita && !stock.ebita) return false;

      // PBT filter (string comparison)
      if (criteria.pbt && !stock.pbt) return false;

      // PAT filter (string comparison)
      if (criteria.pat && !stock.pat) return false;

      // OHLC filter (string comparison)
      if (criteria.ohlc && !stock.ohlc) return false;

      return true;
    });
  };

  // Helper function to evaluate numeric criteria (e.g., "< 10", "> 5%", "10-20")
  const evaluateCriteria = (value: number, criterion: string): boolean => {
    const cleanCriterion = criterion.trim().replace('%', '').replace(/\s+/g, '');

    if (cleanCriterion.includes('-')) {
      const [min, max] = cleanCriterion.split('-').map(v => parseFloat(v));
      return value >= min && value <= max;
    }

    if (cleanCriterion.startsWith('>=')) {
      return value >= parseFloat(cleanCriterion.substring(2));
    }
    if (cleanCriterion.startsWith('<=')) {
      return value <= parseFloat(cleanCriterion.substring(2));
    }
    if (cleanCriterion.startsWith('>')) {
      return value > parseFloat(cleanCriterion.substring(1));
    }
    if (cleanCriterion.startsWith('<')) {
      return value < parseFloat(cleanCriterion.substring(1));
    }
    if (cleanCriterion.startsWith('=')) {
      return value === parseFloat(cleanCriterion.substring(1));
    }

    return true;
  };

  // Helper function for market cap evaluation
  const evaluateCapCriteria = (valueBillions: number, criterion: string): boolean => {
    const cleanCriterion = criterion.trim().toUpperCase();

    // Extract numeric value and multiplier
    const match = cleanCriterion.match(/([><]=?|=)?\s*([0-9.]+)\s*([BTM])?/);
    if (!match) return true;

    const [, operator, numStr, unit] = match;
    let targetValue = parseFloat(numStr);

    // Convert to billions
    if (unit === 'T') targetValue *= 1000;
    else if (unit === 'M') targetValue /= 1000;
    // B is default, no conversion needed

    if (operator === '>=') return valueBillions >= targetValue;
    if (operator === '<=') return valueBillions <= targetValue;
    if (operator === '>') return valueBillions > targetValue;
    if (operator === '<') return valueBillions < targetValue;
    if (operator === '=') return Math.abs(valueBillions - targetValue) < 0.1;

    // Default to >= if no operator
    return valueBillions >= targetValue;
  };

  const filteredResults = getFilteredResults();

  const handleSaveTemplate = () => {
    setShowSaveModal(false);
    setTemplateName("");
  };

  const handleLoadTemplate = (template: typeof MOCK_TEMPLATES[0]) => {
    setCriteria({
      pe: "< 10",
      dividendYield: "> 5%",
      marketCap: "> 10B",
      revenueGrowth: "> 5%",
      profitGrowth: "> 8%",
      ebita: "> 1B",
      pbt: "> 500M",
      pat: "> 400M",
      ohlc: "Any"
    });
    setShowTemplateMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("SIFT Advanced Screener Results", 14, 20);

    doc.setFontSize(10);
    doc.text("Data: Google Finance EOD, updated daily 5pm SGT", 14, 28);

    const tableData = filteredResults.map(row => [
      `${row.ticker}\n${row.name}`,
      row.pe !== null && row.pe !== undefined ? row.pe.toString() : "⚠️ Missing",
      row.dividendYield !== null && row.dividendYield !== undefined ? `${row.dividendYield}%` : "⚠️ Missing",
      row.mktCap || "⚠️ Missing",
      row.revenueGrowth !== null && row.revenueGrowth !== undefined ? `${row.revenueGrowth}%` : "⚠️ Missing",
      typeof row.profitGrowth === 'string' ? row.profitGrowth : (row.profitGrowth !== null && row.profitGrowth !== undefined ? `${row.profitGrowth}%` : "⚠️ Missing"),
      row.ebita || "⚠️ Missing",
      row.pbt || "⚠️ Missing",
      row.pat || "⚠️ Missing",
      row.ohlc || "⚠️ Missing"
    ]);

    autoTable(doc, {
      head: [["Stock", "P/E", "Div Yield", "Mkt Cap", "Rev Growth", "Profit Growth", "EBITA", "PBT", "PAT", "OHLC"]],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [74, 93, 107], textColor: 255 },
    });

    doc.save("sift-screener-results.pdf");
  };

  return (
    <div className="p-4 md:p-10 max-w-[1800px] mx-auto min-h-full pb-20">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center space-x-2 mb-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Advanced Screener</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          Multi-Criteria Stock Screener
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-2">
          Filter stocks by 9 fundamental metrics
        </p>
      </div>

      {/* Large Print Mode Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-muted-foreground">Large Print Mode</span>
          <button
            onClick={() => setLargePrintMode(!largePrintMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              largePrintMode ? "bg-foreground" : "bg-secondary border border-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                largePrintMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Criteria Inputs */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Screening Criteria</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="h-10 px-4 bg-secondary border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-accent transition-all flex items-center gap-2"
              >
                Load Template
                <ChevronDown className="w-4 h-4" />
              </button>

              {showTemplateMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 py-2">
                  {MOCK_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                    >
                      <div className="font-semibold text-sm text-foreground">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Last edited: {template.lastEdited}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSaveModal(true)}
              className="h-10 px-4 bg-card border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center gap-2"
            >
              <BookmarkPlus className="w-4 h-4" />
              Save as Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(criteria).map(([key, value]) => {
            const label = key === "pe" ? "P/E Ratio" :
                         key === "dividendYield" ? "Dividend Yield" :
                         key === "marketCap" ? "Market Cap" :
                         key === "revenueGrowth" ? "Revenue Growth" :
                         key === "profitGrowth" ? "Profit Growth" :
                         key === "ebita" ? "EBITA" :
                         key === "pbt" ? "PBT" :
                         key === "pat" ? "PAT" : "OHLC";

            return (
              <div key={key}>
                <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                  {label}
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    <div className="absolute left-0 top-6 w-72 bg-popover border border-border rounded-lg shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <p className="text-xs text-foreground leading-relaxed">
                        {METRIC_DEFINITIONS[key as keyof typeof METRIC_DEFINITIONS]}
                      </p>
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setCriteria({ ...criteria, [key]: e.target.value })}
                  placeholder={`e.g., ${key === "pe" ? "< 15" : key === "dividendYield" ? "> 3%" : key === "marketCap" ? "> 1B" : "> 5%"}`}
                  className={`w-full ${inputHeight} px-4 bg-input-background border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all flex items-center`}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSearch}
          className="mt-6 h-12 px-8 rounded-lg text-sm font-semibold transition-all"
          style={{ background: "var(--trust-blue)", color: "#0B1015" }}
        >
          Run Screener
        </button>
      </div>

      {/* Results Table */}
      {hasSearched && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Results ({filteredResults.length})</h2>
            <button
              onClick={exportToPDF}
              className="h-10 px-4 bg-card border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF Export
            </button>
          </div>

          {filteredResults.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-2xl shadow-sm">
              <p className="text-muted-foreground font-medium">No stocks match your criteria.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Stock</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">P/E</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Div Yield</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Mkt Cap</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Rev Growth</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Profit Growth</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">EBITA</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">PBT</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">PAT</th>
                      <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">OHLC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredResults.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-accent/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedStock(row)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 bg-secondary text-[10px] font-semibold rounded border border-border text-muted-foreground">{row.exchange}</span>
                            <span className="text-xs font-medium text-muted-foreground font-mono">{row.ticker}</span>
                          </div>
                          <span className="font-semibold text-sm text-foreground">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {row.pe !== null ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.pe}</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.dividendYield !== null ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.dividendYield}%</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.mktCap ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.mktCap}</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.revenueGrowth !== null ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.revenueGrowth}%</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.profitGrowth !== null && row.profitGrowth !== undefined ? (
                          <span className="font-mono text-sm font-medium text-foreground">
                            {typeof row.profitGrowth === 'string' ? row.profitGrowth : `${row.profitGrowth}%`}
                          </span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.ebita ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.ebita}</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.pbt ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.pbt}</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.pat ? (
                          <span className="font-mono text-sm font-medium text-foreground">{row.pat}</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.ohlc ? (
                          <span className="font-mono text-xs font-medium text-foreground">{row.ohlc}</span>
                        ) : (
                          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                            ⚠️ Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center py-2 font-mono">
            Data: Google Finance EOD, updated daily 5pm SGT
          </p>
        </>
      )}

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Save Template</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="w-full h-11 px-4 bg-input-background border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
            />

            <div className="bg-secondary border border-border rounded-lg p-4 mb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#6B8299" }}>
                <Shield className="w-5 h-5 text-background" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">Verification Badge</span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground font-semibold">LOCKED</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upgrade to Pro to verify and share your templates with the community.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveTemplate}
              className="w-full h-11 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "var(--trust-blue)", color: "#0B1015" }}
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      <StockDetailsPanel
        stock={selectedStock}
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
      />
    </div>
  );
}
