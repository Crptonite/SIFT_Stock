import { useState } from "react";
import { Plus, Trash2, Search, Star, ArrowUpDown, TrendingUp, TrendingDown, X, Edit3, Check } from "lucide-react";

interface WatchlistStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap: string;
  pe: number;
  addedAt: string;
}

interface WatchlistItem {
  id: string;
  name: string;
  stocks: WatchlistStock[];
}

const INITIAL_WATCHLISTS: WatchlistItem[] = [
  {
    id: "1",
    name: "Core Holdings",
    stocks: [
      { ticker: "AAPL", name: "Apple Inc.", price: 189.84, change: 2.14, changePct: 1.14, volume: "54.2M", marketCap: "2.93T", pe: 31.2, addedAt: "2024-01-15" },
      { ticker: "MSFT", name: "Microsoft Corp.", price: 415.60, change: -1.24, changePct: -0.30, volume: "18.7M", marketCap: "3.09T", pe: 36.8, addedAt: "2024-01-15" },
      { ticker: "NVDA", name: "NVIDIA Corp.", price: 878.35, change: 15.40, changePct: 1.78, volume: "42.1M", marketCap: "2.16T", pe: 74.5, addedAt: "2024-02-20" },
      { ticker: "GOOGL", name: "Alphabet Inc.", price: 176.95, change: -0.85, changePct: -0.48, volume: "22.4M", marketCap: "2.21T", pe: 26.3, addedAt: "2024-01-22" },
    ],
  },
  {
    id: "2",
    name: "SGX Watchlist",
    stocks: [
      { ticker: "D05.SI", name: "DBS Group Holdings", price: 38.45, change: 0.25, changePct: 0.65, volume: "3.2M", marketCap: "98.7B", pe: 12.4, addedAt: "2024-03-01" },
      { ticker: "O39.SI", name: "OCBC Bank", price: 15.82, change: -0.08, changePct: -0.50, volume: "5.6M", marketCap: "70.2B", pe: 10.8, addedAt: "2024-03-01" },
      { ticker: "Z74.SI", name: "Singapore Telecom", price: 2.48, change: 0.02, changePct: 0.81, volume: "12.4M", marketCap: "40.1B", pe: 19.5, addedAt: "2024-03-15" },
    ],
  },
  {
    id: "3",
    name: "AI & Tech",
    stocks: [
      { ticker: "AMD", name: "Advanced Micro Devices", price: 162.40, change: 3.20, changePct: 2.01, volume: "38.9M", marketCap: "262.3B", pe: 285.6, addedAt: "2024-04-01" },
      { ticker: "SMCI", name: "Super Micro Computer", price: 794.60, change: -12.40, changePct: -1.54, volume: "4.5M", marketCap: "46.8B", pe: 32.1, addedAt: "2024-04-10" },
      { ticker: "META", name: "Meta Platforms", price: 519.23, change: 6.78, changePct: 1.32, volume: "14.8M", marketCap: "1.33T", pe: 27.8, addedAt: "2024-02-28" },
    ],
  },
];

type SortField = "ticker" | "price" | "changePct" | "volume" | "pe";
type SortDir = "asc" | "desc";

export function Watchlist() {
  const [watchlists, setWatchlists] = useState<WatchlistItem[]>(INITIAL_WATCHLISTS);
  const [activeId, setActiveId] = useState("1");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addStockInput, setAddStockInput] = useState("");
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const activeList = watchlists.find((w) => w.id === activeId);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedStocks = [...(activeList?.stocks || [])].filter((s) =>
    s.ticker.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sortField === "ticker") return mult * a.ticker.localeCompare(b.ticker);
    if (sortField === "price") return mult * (a.price - b.price);
    if (sortField === "changePct") return mult * (a.changePct - b.changePct);
    if (sortField === "volume") return mult * (parseFloat(a.volume) - parseFloat(b.volume));
    if (sortField === "pe") return mult * (a.pe - b.pe);
    return 0;
  });

  const removeStock = (ticker: string) => {
    setWatchlists((prev) =>
      prev.map((w) => w.id === activeId ? { ...w, stocks: w.stocks.filter((s) => s.ticker !== ticker) } : w)
    );
  };

  const addStock = () => {
    if (!addStockInput.trim() || !activeList) return;
    const ticker = addStockInput.toUpperCase().trim();
    if (activeList.stocks.find((s) => s.ticker === ticker)) return;
    const newStock: WatchlistStock = {
      ticker,
      name: `${ticker} Corp.`,
      price: Math.random() * 500 + 50,
      change: (Math.random() - 0.5) * 10,
      changePct: (Math.random() - 0.5) * 5,
      volume: `${(Math.random() * 50 + 1).toFixed(1)}M`,
      marketCap: `${(Math.random() * 500 + 10).toFixed(0)}B`,
      pe: Math.random() * 40 + 10,
      addedAt: new Date().toISOString().split("T")[0],
    };
    setWatchlists((prev) =>
      prev.map((w) => w.id === activeId ? { ...w, stocks: [...w.stocks, newStock] } : w)
    );
    setAddStockInput("");
  };

  const createList = () => {
    if (!newListName.trim()) return;
    const newList: WatchlistItem = {
      id: Date.now().toString(),
      name: newListName.trim(),
      stocks: [],
    };
    setWatchlists((prev) => [...prev, newList]);
    setActiveId(newList.id);
    setNewListName("");
    setShowAddList(false);
  };

  const deleteList = (id: string) => {
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
    if (activeId === id) setActiveId(watchlists[0]?.id || "");
  };

  const confirmRename = (id: string) => {
    setWatchlists((prev) => prev.map((w) => w.id === id ? { ...w, name: renameValue } : w));
    setRenamingId(null);
  };

  const formatChange = (val: number) => {
    const abs = Math.abs(val);
    const sign = val >= 0 ? "+" : "−";
    return `${sign}${abs.toFixed(2)}`;
  };

  const changeStyle = (val: number) => ({
    color: val >= 0 ? "var(--trust-blue)" : "var(--trust-bronze)",
  });

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortField === field ? "opacity-100" : "opacity-30 group-hover:opacity-60"}`} />
    </button>
  );

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Watchlists</span>
            <button
              onClick={() => setShowAddList(!showAddList)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {showAddList && (
            <div className="flex gap-1">
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createList()}
                placeholder="List name..."
                className="flex-1 bg-secondary text-foreground text-xs px-2 py-1.5 rounded-lg border border-border focus:outline-none font-mono"
              />
              <button onClick={createList} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {watchlists.map((w) => (
            <div
              key={w.id}
              className={`group flex items-center px-2 py-2 rounded-lg cursor-pointer transition-all ${activeId === w.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
              onClick={() => setActiveId(w.id)}
            >
              {renamingId === w.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmRename(w.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-xs text-foreground focus:outline-none border-b border-accent font-mono"
                />
              ) : (
                <>
                  <Star className="w-3 h-3 mr-2 shrink-0" style={{ color: "var(--trust-bronze)" }} />
                  <span className="flex-1 text-xs font-mono text-foreground truncate">{w.name}</span>
                  <span className="text-xs font-mono text-muted-foreground mr-1">{w.stocks.length}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); setRenamingId(w.id); setRenameValue(w.name); }} className="p-0.5 text-muted-foreground hover:text-foreground">
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteList(w.id); }} className="p-0.5 text-muted-foreground hover:text-foreground">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-medium text-foreground font-mono">{activeList?.name || "Watchlist"}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{activeList?.stocks.length || 0} securities tracked</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter..."
                  className="bg-card border border-border text-foreground text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none font-mono w-40"
                />
              </div>
              <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-2 py-1.5">
                <input
                  value={addStockInput}
                  onChange={(e) => setAddStockInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStock()}
                  placeholder="Add ticker..."
                  className="bg-transparent text-foreground text-xs focus:outline-none font-mono w-24 uppercase placeholder:normal-case placeholder:text-muted-foreground"
                />
                <button onClick={addStock} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-card border-b border-border z-10">
              <tr>
                <th className="text-left px-6 py-3"><SortBtn field="ticker" label="Ticker" /></th>
                <th className="text-left px-4 py-3 hidden md:table-cell"><span className="text-xs text-muted-foreground font-mono">Company</span></th>
                <th className="text-right px-4 py-3"><SortBtn field="price" label="Price" /></th>
                <th className="text-right px-4 py-3"><SortBtn field="changePct" label="Change" /></th>
                <th className="text-right px-4 py-3 hidden lg:table-cell"><SortBtn field="volume" label="Volume" /></th>
                <th className="text-right px-4 py-3 hidden lg:table-cell"><span className="text-xs text-muted-foreground font-mono">Mkt Cap</span></th>
                <th className="text-right px-4 py-3 hidden xl:table-cell"><SortBtn field="pe" label="P/E" /></th>
                <th className="text-right px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock) => (
                <tr key={stock.ticker} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground font-mono">{stock.ticker}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground font-mono truncate max-w-[200px] block">{stock.name}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-medium text-foreground font-mono">{stock.price.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {stock.changePct >= 0
                        ? <TrendingUp className="w-3 h-3" style={{ color: "var(--trust-blue)" }} />
                        : <TrendingDown className="w-3 h-3" style={{ color: "var(--trust-bronze)" }} />}
                      <span className="text-sm font-mono" style={changeStyle(stock.changePct)}>
                        {formatChange(stock.changePct)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground font-mono">{stock.volume}</span>
                  </td>
                  <td className="px-4 py-4 text-right hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground font-mono">{stock.marketCap}</span>
                  </td>
                  <td className="px-4 py-4 text-right hidden xl:table-cell">
                    <span className="text-sm text-muted-foreground font-mono">{stock.pe.toFixed(1)}x</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => removeStock(stock.ticker)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedStocks.length === 0 && (
            <div className="text-center py-20 text-muted-foreground font-mono text-sm">
              {search ? "No matching securities" : "Add tickers above to track them here"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
