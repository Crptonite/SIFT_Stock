import { useState } from "react";
import { Brain, Plus, Trash2, Edit3, Check, X, Save } from "lucide-react";

interface MemoryEntry {
  id: string;
  category: "risk" | "sector" | "horizon" | "style" | "custom";
  key: string;
  value: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<MemoryEntry["category"], string> = {
  risk: "Risk Tolerance",
  sector: "Preferred Sectors",
  horizon: "Investment Horizon",
  style: "Investment Style",
  custom: "Custom Preference",
};

const CATEGORY_COLORS: Record<MemoryEntry["category"], string> = {
  risk: "var(--trust-blue)",
  sector: "var(--trust-bronze)",
  horizon: "var(--trust-slate)",
  style: "#6B8E9F",
  custom: "var(--muted-foreground)",
};

const PRESETS: { category: MemoryEntry["category"]; key: string; options: string[] }[] = [
  { category: "risk", key: "Risk Tolerance", options: ["Conservative", "Moderate", "Aggressive", "Speculative"] },
  { category: "horizon", key: "Investment Horizon", options: ["< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"] },
  { category: "style", key: "Investment Style", options: ["Value", "Growth", "GARP", "Income", "Momentum", "Index"] },
  { category: "sector", key: "Preferred Sectors", options: ["Technology", "Financials", "Healthcare", "REITs", "Energy", "Consumer"] },
];

export function AIMemory() {
  const [memories, setMemories] = useState<MemoryEntry[]>([
    { id: "1", category: "risk", key: "Risk Tolerance", value: "Moderate-Aggressive", updatedAt: "2024-10-15" },
    { id: "2", category: "sector", key: "Preferred Sectors", value: "Technology, Financials, REITs", updatedAt: "2024-10-14" },
    { id: "3", category: "horizon", key: "Investment Horizon", value: "5-10 years", updatedAt: "2024-10-12" },
    { id: "4", category: "style", key: "Investment Style", value: "Growth at a Reasonable Price (GARP)", updatedAt: "2024-10-10" },
    { id: "5", category: "custom", key: "Market Focus", value: "SGX, NASDAQ, HKEX", updatedAt: "2024-10-08" },
    { id: "6", category: "custom", key: "Exclusions", value: "Fossil fuel companies, Tobacco", updatedAt: "2024-10-05" },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: "custom" as MemoryEntry["category"], key: "", value: "" });
  const [saved, setSaved] = useState(false);

  const startEdit = (id: string, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  const confirmEdit = (id: string) => {
    setMemories((prev) => prev.map((m) => m.id === id ? { ...m, value: editValue, updatedAt: new Date().toISOString().split("T")[0] } : m));
    setEditingId(null);
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const addMemory = () => {
    if (!newEntry.key || !newEntry.value) return;
    const entry: MemoryEntry = {
      id: Date.now().toString(),
      category: newEntry.category,
      key: newEntry.key,
      value: newEntry.value,
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setMemories((prev) => [...prev, entry]);
    setNewEntry({ category: "custom", key: "", value: "" });
    setShowAdd(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const grouped = Object.entries(CATEGORY_LABELS).map(([cat, label]) => ({
    category: cat as MemoryEntry["category"],
    label,
    items: memories.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="h-full overflow-auto custom-scrollbar bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground font-mono flex items-center gap-2">
              <Brain className="w-5 h-5 text-muted-foreground" />
              AI Research Memory
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">Your investment preferences stored for personalized AI analysis</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono transition-all"
              style={{ background: "var(--trust-blue)", color: "#0B1015" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Memory
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border border-border hover:bg-secondary transition-all"
            >
              {saved ? <Check className="w-3.5 h-3.5" style={{ color: "var(--trust-blue)" }} /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="border border-border rounded-xl p-4 flex gap-3" style={{ background: "rgba(139,184,201,0.06)" }}>
          <Brain className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--trust-blue)" }} />
          <div>
            <p className="text-sm text-foreground font-mono">Your stored preferences shape every AI analysis and chat response.</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">When you ask the AI about stocks, it uses this context to provide personalized, relevant insights tailored to your investment profile.</p>
          </div>
        </div>

        {/* Quick presets */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Quick Setup</h3>
          <div className="space-y-3">
            {PRESETS.map((preset) => (
              <div key={preset.key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground font-mono shrink-0 w-40">{preset.key}</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {preset.options.map((opt) => {
                    const existing = memories.find((m) => m.category === preset.category && m.key === preset.key);
                    const isSelected = existing?.value === opt || existing?.value.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (existing) {
                            setMemories((prev) => prev.map((m) => m.id === existing.id ? { ...m, value: opt, updatedAt: new Date().toISOString().split("T")[0] } : m));
                          } else {
                            const entry: MemoryEntry = {
                              id: Date.now().toString(),
                              category: preset.category,
                              key: preset.key,
                              value: opt,
                              updatedAt: new Date().toISOString().split("T")[0],
                            };
                            setMemories((prev) => [...prev, entry]);
                          }
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-mono border transition-all"
                        style={{
                          borderColor: isSelected ? CATEGORY_COLORS[preset.category] : "var(--border)",
                          color: isSelected ? CATEGORY_COLORS[preset.category] : "var(--muted-foreground)",
                          background: isSelected ? `${CATEGORY_COLORS[preset.category]}18` : "transparent",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-foreground font-mono mb-4">Add Custom Preference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Category</label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry((p) => ({ ...p, category: e.target.value as MemoryEntry["category"] }))}
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Key</label>
                <input
                  value={newEntry.key}
                  onChange={(e) => setNewEntry((p) => ({ ...p, key: e.target.value }))}
                  placeholder="e.g. ESG Filter"
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-mono">Value</label>
                <input
                  value={newEntry.value}
                  onChange={(e) => setNewEntry((p) => ({ ...p, value: e.target.value }))}
                  placeholder="e.g. Only high ESG rated stocks"
                  className="bg-secondary border border-border text-foreground text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAdd(false)} className="p-1.5 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              <button onClick={addMemory} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono" style={{ background: "var(--trust-slate)", color: "#fff" }}>
                <Check className="w-3.5 h-3.5" />Add
              </button>
            </div>
          </div>
        )}

        {/* Memory entries grouped by category */}
        {grouped.map(({ category, label, items }) => (
          <div key={category} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[category] }} />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className="divide-y divide-border/50">
              {items.map((mem) => (
                <div key={mem.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors group">
                  <span className="text-sm text-muted-foreground font-mono shrink-0 w-36">{mem.key}</span>
                  {editingId === mem.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && confirmEdit(mem.id)}
                        className="flex-1 bg-secondary text-foreground text-sm px-3 py-1.5 rounded-lg border border-accent/50 focus:outline-none font-mono"
                      />
                      <button onClick={() => confirmEdit(mem.id)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <Check className="w-3.5 h-3.5" style={{ color: "var(--trust-blue)" }} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-foreground font-mono">{mem.value}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <span className="text-xs text-muted-foreground font-mono mr-2">{mem.updatedAt}</span>
                        <button onClick={() => startEdit(mem.id, mem.value)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMemory(mem.id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
