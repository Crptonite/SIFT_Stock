import { Search, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router";

export function SearchHome() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4 animate-in fade-in duration-700 bg-background">
      <div className="w-full max-w-[375px] md:max-w-3xl text-center space-y-10 -mt-20">
        
        <div className="space-y-3">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-foreground" style={{ letterSpacing: '-0.04em' }}>
            SIFT
          </h1>
          <p className="text-[#6488A3] text-sm md:text-xl font-bold uppercase tracking-widest">
            Systematic Investment Filtering Tool
          </p>
        </div>

        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-[#8BB8C9] transition-colors" />
          </div>
          <input
            type="text"
            className="w-full h-14 md:h-16 pl-14 pr-16 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#8BB8C9] focus:border-[#8BB8C9] shadow-lg transition-all text-base md:text-lg font-medium font-mono"
            placeholder="Search tickers, sectors..."
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/dashboard");
            }}
          />
          <button
            onClick={() => navigate("/dashboard")}
            className="absolute inset-y-1.5 md:inset-y-2.5 right-2 md:right-3 w-11 h-11 bg-[#8BB8C9] text-background rounded-full hover:bg-foreground transition-colors flex items-center justify-center shadow-md"
          >
            <ArrowRight className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {[
            "Blue Chip Dividend",
            "Undervalued Growth",
            "High ROIC",
          ].map((template) => (
            <button
              key={template}
              onClick={() => navigate("/dashboard")}
              className="px-5 py-3 text-[11px] md:text-sm font-bold uppercase tracking-widest bg-card border border-border rounded-full text-[#8BB8C9] hover:bg-secondary hover:border-[#8BB8C9]/50 transition-all flex items-center"
            >
              {template}
            </button>
          ))}
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-3 text-[11px] md:text-sm font-bold uppercase tracking-widest bg-transparent border border-dashed border-[#6488A3]/50 rounded-full text-[#6488A3] hover:text-[#8BB8C9] hover:border-[#8BB8C9] transition-all flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Custom Rules
          </button>
        </div>
      </div>
    </div>
  );
}