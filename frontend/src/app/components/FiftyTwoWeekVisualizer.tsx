export function FiftyTwoWeekVisualizer({ 
  low, 
  high, 
  current 
}: { 
  low: number; 
  high: number; 
  current: number 
}) {
  const range = high - low;
  // Protect against division by zero
  const percentage = range > 0 ? ((current - low) / range) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="flex flex-col space-y-3 w-full pt-1">
      <div className="relative flex-1 h-3 md:h-4 bg-background border border-border rounded-full overflow-visible shadow-inner">
        {/* The Track */}
        <div className="absolute inset-0 bg-muted/30 rounded-full" />
        
        {/* The Indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-2 h-5 md:h-7 bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-background transition-all z-10"
          style={{ left: `calc(${clampedPercentage}% - 4px)` }}
        />
      </div>
      
      <div className="flex items-center justify-between px-0.5">
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">52W Low</span>
          <span className="text-[12px] md:text-[14px] font-mono text-foreground font-medium tabular-nums">${low.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">52W High</span>
          <span className="text-[12px] md:text-[14px] font-mono text-foreground font-medium tabular-nums">${high.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </div>
  );
}
