import { Menu, Heart, MessageSquare, Share2, Plus, Copy, Search, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Community() {
  const [activeTraders, setActiveTraders] = useState<string[]>([]);

  const topTraders = [
    { name: "Alex K.", gain: "+42.5%", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHBlcnNvbiUyMGF2YXRhcnxlbnwxfHx8fDE3Nzg3NDg1MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { name: "Sarah M.", gain: "+28.1%", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBwb3J0cmFpdCUyMGF2YXRhcnxlbnwxfHx8fDE3Nzg3NDg1MjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { name: "James L.", gain: "+35.4%", avatar: "https://images.unsplash.com/photo-1584940120505-117038d90b05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBlcnNvbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc3ODYzNDI5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { name: "Elena R.", gain: "+19.8%", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
    { name: "Marcus T.", gain: "+51.2%", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
    { name: "Sophia W.", gain: "+24.3%", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" },
  ];

  const posts = [
    {
      id: 1,
      user: "Marcus T.",
      handle: "@marcus_alpha",
      time: "2h ago",
      content: "Looking at the recent pull-back in tech. $D05 seems oversold here given their dividend yield and balance sheet strength. I'm increasing my position by 15% today.",
      ticker: "$D05",
      likes: 24,
      comments: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    },
    {
      id: 2,
      user: "Sarah M.",
      handle: "@sm_invest",
      time: "5h ago",
      content: "Interesting institutional flow into renewable energy sectors. Seeing massive accumulation in $KEA. Definitely a long-term hold for the sustainability pivot.",
      ticker: "$KEA",
      likes: 56,
      comments: 12,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBmZW1hbGUlMjBwb3J0cmFpdCUyMGF2YXRhcnxlbnwxfHx8fDE3Nzg3NDg1MjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      id: 3,
      user: "Elena R.",
      handle: "@elena_macro",
      time: "8h ago",
      content: "Macro outlook remains cautious. Diversifying into wholesale bonds to capture the current high-interest environment while minimizing equity exposure. $BOND_ETF looking attractive.",
      ticker: "$BOND_ETF",
      likes: 89,
      comments: 24,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    }
  ];

  const toggleCopy = (name: string) => {
    setActiveTraders(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-background font-sans text-foreground animate-in fade-in duration-500">
      {/* Top Bar - Mobile Local */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 md:hidden">
        <Menu className="w-6 h-6 text-muted-foreground" />
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase">Community</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-10">
        
        {/* Top Traders Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Top Performing Traders
            </h2>
            <button className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:underline">View All</button>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar snap-x">
            {topTraders.map((trader, i) => (
              <div key={i} className="flex flex-col items-center space-y-3 snap-center shrink-0">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full border-2 border-border p-0.5 group-hover:border-foreground transition-all">
                    <ImageWithFallback 
                      src={trader.avatar} 
                      alt={trader.name} 
                      className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#4A5D6B] w-4 h-4 rounded-full border-2 border-background" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold tracking-tight">{trader.name}</p>
                  <p className="text-[10px] font-mono text-[#8BB8C9]">{trader.gain}</p>
                </div>
                <button 
                  onClick={() => toggleCopy(trader.name)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full transition-all flex items-center gap-1.5 ${
                    activeTraders.includes(trader.name)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                  }`}
                >
                  {activeTraders.includes(trader.name) ? <Copy className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {activeTraders.includes(trader.name) ? "Copying" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Search / Create Post */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search discussions or share an insight..." 
            className="w-full bg-card border border-border rounded-sm pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
          />
        </div>

        {/* Social Feed */}
        <section className="space-y-6">
          <div className="flex items-center gap-6 border-b border-border">
            <button className="pb-4 text-[10px] font-bold uppercase tracking-widest text-foreground relative">
              Trending
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            </button>
            <button className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Following</button>
            <button className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Saved</button>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="border-b border-border pb-6 space-y-4 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback 
                      src={post.avatar} 
                      alt={post.user} 
                      className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                    <div>
                      <h4 className="text-sm font-bold">{post.user}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">{post.handle} · {post.time}</p>
                    </div>
                  </div>
                  <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                    {post.content}
                  </p>
                  <span className="inline-block px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                    {post.ticker}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-[#AFA089] transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-[10px] font-mono">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-400 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] font-mono">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 py-10 opacity-30">
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SIFT Community Network</span>
        </div>
      </div>
    </div>
  );
}
