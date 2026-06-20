import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Plus, Search, Trash2, Archive, Pin,
  Edit3, Check, X, ChevronRight, Sparkles, TrendingUp,
  BarChart2, Globe, BookOpen, Zap, MoreHorizontal
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  pinned: boolean;
  archived: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What are the key valuation metrics for AAPL right now?",
  "Explain the yield curve inversion and its market impact",
  "Compare PE ratios across S&P 500 sectors",
  "What is the outlook for semiconductor stocks in H2 2025?",
  "Analyze SGX REITs distribution yield trends",
  "How does Fed rate policy affect growth vs value stocks?",
];

const FOLLOW_UP_MAP: Record<string, string[]> = {
  default: [
    "What are the key risks to watch?",
    "How does this compare historically?",
    "Which sectors benefit most from this?",
    "Show me the relevant technical indicators",
  ],
};

function simulateStreamResponse(prompt: string): string {
  const responses: Record<string, string> = {
    aapl: `**Apple Inc. (AAPL)** — Valuation Analysis\n\nAs of the latest data:\n\n**Key Metrics**\n- P/E Ratio: 31.2x (vs. sector avg 24.8x)\n- Forward P/E: 28.6x\n- EV/EBITDA: 22.4x\n- Price/Sales: 8.1x\n- PEG Ratio: 2.3\n\n**Earnings Quality**\nApple continues to generate exceptional free cash flow of $107B TTM, with a FCF yield of 3.8%. The services segment now contributes ~24% of revenue with significantly higher margins (~73%) compared to hardware (~36%).\n\n**Analyst Consensus**\n- Buy: 32 analysts\n- Hold: 9 analysts\n- Sell: 2 analysts\n- 12-month price target: $218 (median)\n\n**Data Sources**: Bloomberg Terminal, SEC 10-K Filing, FactSet`,
    default: `Based on available market intelligence:\n\nThis is a complex question that touches on several dimensions of market analysis. Let me break it down systematically.\n\n**Macro Context**\nCurrent market conditions reflect a period of elevated uncertainty, with central bank policy, geopolitical tensions, and AI-driven productivity shifts all exerting influence simultaneously.\n\n**Key Considerations**\n1. **Valuation compression** in high-multiple sectors has been ongoing since peak liquidity in 2021\n2. **Earnings quality** divergence between companies with genuine pricing power vs. those relying on volume\n3. **Sector rotation** patterns suggest institutional reallocation toward defensive growth\n\n**Quantitative Signal**\nBased on factor models, the current regime favors:\n- Quality (high ROIC, low debt)\n- Low volatility\n- Free cash flow yield above 4%\n\n**Disclaimer**: This analysis is for informational purposes. Always conduct independent due diligence.\n\n*Sources: MSCI Factor Models, Federal Reserve H.4.1, Bloomberg Consensus*`,
  };
  const key = prompt.toLowerCase().includes("aapl") || prompt.toLowerCase().includes("apple") ? "aapl" : "default";
  return responses[key];
}

function generateTitle(firstMessage: string): string {
  const words = firstMessage.split(" ").slice(0, 6).join(" ");
  return words.length < firstMessage.length ? `${words}...` : words;
}

const STORAGE_KEY = "sift_chat_conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((c: Conversation) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function AIChat() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingText]);

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New conversation",
      messages: [],
      createdAt: new Date(),
      pinned: false,
      archived: false,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let convId = activeId;
    if (!convId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: generateTitle(text),
        messages: [],
        createdAt: new Date(),
        pinned: false,
        archived: false,
      };
      setConversations((prev) => [newConv, ...prev]);
      convId = newConv.id;
      setActiveId(convId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const updated = { ...c, messages: [...c.messages, userMsg] };
        if (c.title === "New conversation") updated.title = generateTitle(text);
        return updated;
      })
    );
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    const fullResponse = simulateStreamResponse(text);
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setStreamingText(fullResponse.slice(0, i));
      if (i >= fullResponse.length) {
        clearInterval(interval);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fullResponse,
          timestamp: new Date(),
          sources: ["Bloomberg Terminal", "FactSet", "SEC EDGAR"],
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, aiMsg] } : c))
        );
        setIsStreaming(false);
        setStreamingText("");
      }
    }, 20);
  }, [activeId, isStreaming]);

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    setOpenMenu(null);
  };

  const archiveConversation = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
    setOpenMenu(null);
  };

  const pinConversation = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
    setOpenMenu(null);
  };

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
    setOpenMenu(null);
  };

  const confirmRename = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: renameValue } : c)));
    setRenamingId(null);
  };

  const filteredConvs = conversations.filter(
    (c) => !c.archived && c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedConvs = filteredConvs.filter((c) => c.pinned);
  const unpinnedConvs = filteredConvs.filter((c) => !c.pinned);
  const archivedConvs = conversations.filter((c) => c.archived);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-foreground mt-3 mb-1">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-4 text-muted-foreground list-disc">{formatInline(line.slice(2))}</li>;
      }
      if (/^\d+\./.test(line)) {
        return <li key={i} className="ml-4 text-muted-foreground list-decimal">{formatInline(line.replace(/^\d+\.\s/, ""))}</li>;
      }
      if (line === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-foreground/90 leading-relaxed">{formatInline(line)}</p>;
    });
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 bg-card border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity text-sm font-medium"
              style={{ background: "var(--trust-blue)", color: "#0B1015" }}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-secondary text-foreground text-xs pl-8 pr-3 py-2 rounded-lg border border-border focus:outline-none focus:border-accent/50 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1">
            {pinnedConvs.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-widest font-mono">Pinned</p>
                {pinnedConvs.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    activeId={activeId}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    setActiveId={setActiveId}
                    setRenameValue={setRenameValue}
                    confirmRename={confirmRename}
                    startRename={startRename}
                    pinConversation={pinConversation}
                    archiveConversation={archiveConversation}
                    deleteConversation={deleteConversation}
                  />
                ))}
              </>
            )}

            {unpinnedConvs.length > 0 && (
              <>
                {pinnedConvs.length > 0 && <p className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-widest font-mono mt-2">Recent</p>}
                {unpinnedConvs.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    activeId={activeId}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    setActiveId={setActiveId}
                    setRenameValue={setRenameValue}
                    confirmRename={confirmRename}
                    startRename={startRename}
                    pinConversation={pinConversation}
                    archiveConversation={archiveConversation}
                    deleteConversation={deleteConversation}
                  />
                ))}
              </>
            )}

            {archivedConvs.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-widest font-mono mt-2">Archived</p>
                {archivedConvs.map((conv) => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    activeId={activeId}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    setActiveId={setActiveId}
                    setRenameValue={setRenameValue}
                    confirmRename={confirmRename}
                    startRename={startRename}
                    pinConversation={pinConversation}
                    archiveConversation={archiveConversation}
                    deleteConversation={deleteConversation}
                  />
                ))}
              </>
            )}

            {filteredConvs.length === 0 && archivedConvs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs font-mono">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--trust-blue)" }} />
            <span className="text-sm font-medium text-foreground font-mono">SIFT AI Research</span>
          </div>
          {activeConversation && (
            <span className="text-xs text-muted-foreground font-mono ml-2 truncate">{activeConversation.title}</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="max-w-2xl mx-auto px-4 py-12">
              <div className="text-center mb-10">
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(139,184,201,0.12)" }}>
                  <Sparkles className="w-6 h-6" style={{ color: "var(--trust-blue)" }} />
                </div>
                <h2 className="text-xl font-medium text-foreground mb-2 font-mono">SIFT AI Research</h2>
                <p className="text-sm text-muted-foreground">Ask about stocks, ETFs, earnings, valuations, and market trends. AI responses cite data sources.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left p-3 rounded-lg border border-border bg-card hover:border-accent/30 transition-all text-xs text-muted-foreground hover:text-foreground group"
                  >
                    <div className="flex items-start gap-2">
                      {i % 3 === 0 ? <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent" />
                        : i % 3 === 1 ? <BarChart2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent" />
                        : <Globe className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent" />}
                      <span className="font-mono">{q}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {activeConversation.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(139,184,201,0.15)" }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--trust-blue)" }} />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "bg-secondary rounded-2xl rounded-tr-sm px-4 py-3" : ""}`}>
                    {msg.role === "user" ? (
                      <p className="text-sm text-foreground font-mono">{msg.content}</p>
                    ) : (
                      <div className="text-sm space-y-1 font-mono">
                        {formatMessage(msg.content)}
                        {msg.sources && (
                          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
                            {msg.sources.map((s, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground" style={{ borderColor: "rgba(139,184,201,0.2)" }}>
                                <BookOpen className="w-2.5 h-2.5 inline mr-1" />{s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {isStreaming && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(139,184,201,0.15)" }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--trust-blue)" }} />
                  </div>
                  <div className="max-w-[80%] text-sm font-mono space-y-1">
                    {formatMessage(streamingText)}
                    <span className="inline-block w-1.5 h-4 align-middle ml-0.5 animate-pulse" style={{ background: "var(--trust-blue)" }} />
                  </div>
                </div>
              )}

              {!isStreaming && activeConversation.messages.length > 0 && activeConversation.messages[activeConversation.messages.length - 1].role === "assistant" && (
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Follow-up suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(FOLLOW_UP_MAP.default).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all font-mono"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-card border border-border rounded-xl p-3 focus-within:border-accent/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any stock, ETF, or market trend..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground resize-none focus:outline-none font-mono placeholder:text-muted-foreground max-h-32 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: input.trim() && !isStreaming ? "var(--trust-blue)" : "var(--muted)" }}
              >
                <Send className="w-3.5 h-3.5" style={{ color: input.trim() && !isStreaming ? "#0B1015" : "var(--muted-foreground)" }} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2 font-mono">SIFT AI provides research-grade analysis. Not financial advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConvItem({
  conv, activeId, renamingId, renameValue, openMenu,
  setOpenMenu, setActiveId, setRenameValue, confirmRename,
  startRename, pinConversation, archiveConversation, deleteConversation
}: {
  conv: Conversation;
  activeId: string | null;
  renamingId: string | null;
  renameValue: string;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  setActiveId: (id: string) => void;
  setRenameValue: (v: string) => void;
  confirmRename: (id: string) => void;
  startRename: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}) {
  const isActive = conv.id === activeId;
  const isRenaming = conv.id === renamingId;

  return (
    <div className={`group relative flex items-center px-2 py-2 rounded-lg cursor-pointer transition-all ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}>
      {isRenaming ? (
        <div className="flex items-center gap-1 flex-1">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename(conv.id)}
            className="flex-1 bg-transparent text-xs text-foreground focus:outline-none border-b border-accent font-mono"
          />
          <button onClick={() => confirmRename(conv.id)} className="p-0.5 text-muted-foreground hover:text-foreground">
            <Check className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setActiveId(conv.id)}>
            {conv.pinned && <Pin className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--trust-bronze)" }} />}
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-foreground truncate font-mono">{conv.title}</span>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === conv.id ? null : conv.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {openMenu === conv.id && (
              <div className="absolute right-0 top-6 z-50 w-40 bg-popover border border-border rounded-lg shadow-xl py-1">
                <button onClick={() => pinConversation(conv.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors font-mono">
                  <Pin className="w-3 h-3" />{conv.pinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => startRename(conv.id, conv.title)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors font-mono">
                  <Edit3 className="w-3 h-3" />Rename
                </button>
                <button onClick={() => archiveConversation(conv.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors font-mono">
                  <Archive className="w-3 h-3" />{conv.archived ? "Unarchive" : "Archive"}
                </button>
                <div className="h-px bg-border my-1" />
                <button onClick={() => deleteConversation(conv.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors font-mono" style={{ color: "var(--trust-bronze)" }}>
                  <Trash2 className="w-3 h-3" />Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
