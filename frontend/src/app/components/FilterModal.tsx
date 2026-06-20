import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { SlidersHorizontal, Save, Check, FileEdit } from "lucide-react";

interface FilterCriterion {
  id: string;
  label: string;
  unit?: string;
}

const CRITERIA: FilterCriterion[] = [
  { id: "pe", label: "P/E Ratio" },
  { id: "pb", label: "P/B Ratio" },
  { id: "yield", label: "Dividend Yield", unit: "%" },
  { id: "mktcap", label: "Market Cap", unit: "B" },
  { id: "debteq", label: "Debt / Equity" },
  { id: "roic", label: "ROIC", unit: "%" },
  { id: "profitgrowth", label: "Profit Growth Rate", unit: "%" },
  { id: "divgrowth", label: "Dividend Growth Rate", unit: "%" },
  { id: "fcf", label: "Free Cash Flow", unit: "M" },
];

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border rounded-3xl p-0 overflow-hidden shadow-2xl font-sans">
        <VisuallyHidden>
          <DialogTitle>Custom Filter & Save Template</DialogTitle>
          <DialogDescription>Configure precise numerical boundaries and save them as a custom profile template.</DialogDescription>
        </VisuallyHidden>
        <DialogHeader className="p-8 pb-4 border-b border-border bg-secondary/30">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-sm">
              <SlidersHorizontal className="w-5 h-5 text-background" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Custom Filter & Save Template
            </h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Configure precise numerical boundaries for your active screener criteria
          </p>
        </DialogHeader>

        <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {CRITERIA.map((criterion) => (
              <div key={criterion.id} className="space-y-3 group">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {criterion.label} {criterion.unit && <span className="text-muted-foreground/60 ml-1">({criterion.unit})</span>}
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/70 pointer-events-none">Min</span>
                    <Input 
                      type="number" 
                      placeholder="0.0" 
                      className="h-11 pl-12 bg-background border-border rounded-xl text-sm font-mono font-medium focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="w-2 h-[1px] bg-border" />
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/70 pointer-events-none">Max</span>
                    <Input 
                      type="number" 
                      placeholder="∞" 
                      className="h-11 pl-12 bg-background border-border rounded-xl text-sm font-mono font-medium focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border bg-secondary/10">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-muted-foreground" />
              Template Name
            </Label>
            <Input 
              type="text" 
              placeholder="Enter profile name... (e.g. Julian's High Yield)" 
              className="h-12 bg-background border-muted-foreground/30 rounded-xl text-sm font-medium text-foreground focus:ring-[#188bf6]/20 focus:border-[#188bf6]/50 transition-all"
            />
          </div>
        </div>

        <DialogFooter className="p-8 pt-6 bg-secondary/30 border-t border-border flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-secondary border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-accent transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <Check className="w-4 h-4 text-muted-foreground" />
            <span>Apply Filters</span>
          </button>
          
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-[#188bf6] text-white rounded-xl text-sm font-semibold hover:bg-[#157add] transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Profile</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}