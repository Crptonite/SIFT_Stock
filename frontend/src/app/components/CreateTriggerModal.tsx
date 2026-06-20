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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { BellPlus, Zap } from "lucide-react";

interface CreateTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTriggerModal({ isOpen, onClose }: CreateTriggerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl font-sans">
        <VisuallyHidden>
          <DialogTitle>Create New Alert Trigger</DialogTitle>
          <DialogDescription>Set up a specific mathematical rule to trigger a WhatsApp or Telegram notification.</DialogDescription>
        </VisuallyHidden>
        
        <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/30">
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 bg-[#188bf6]/10 rounded-xl flex items-center justify-center shadow-sm border border-[#188bf6]/20">
              <Zap className="w-5 h-5 text-[#188bf6]" />
            </div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              Create New Trigger
            </h2>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Configure a precise mathematical rule for off-app notifications.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Stock Code</Label>
            <Select>
              <SelectTrigger className="h-12 bg-background border-border rounded-xl text-sm font-medium focus:ring-[#188bf6]/20 focus:border-[#188bf6]/50 transition-all w-full data-[state=open]:border-[#188bf6]/50">
                <SelectValue placeholder="Select an asset..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-xl shadow-xl z-50">
                <SelectItem value="d05" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">D05.SI - DBS Group Holdings</SelectItem>
                <SelectItem value="o39" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">O39.SI - OCBC Bank</SelectItem>
                <SelectItem value="u11" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">U11.SI - United Overseas Bank</SelectItem>
                <SelectItem value="z74" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">Z74.SI - Singtel</SelectItem>
                <SelectItem value="tsla" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">TSLA - Tesla Inc.</SelectItem>
                <SelectItem value="aapl" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">AAPL - Apple Inc.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-muted-foreground">Metric</Label>
            <Select>
              <SelectTrigger className="h-12 bg-background border-border rounded-xl text-sm font-medium focus:ring-[#188bf6]/20 focus:border-[#188bf6]/50 transition-all w-full data-[state=open]:border-[#188bf6]/50">
                <SelectValue placeholder="Select metric to monitor..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-xl shadow-xl z-50">
                <SelectItem value="price" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">Price (Current)</SelectItem>
                <SelectItem value="dividend_yield" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">Dividend Yield</SelectItem>
                <SelectItem value="pe_ratio" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">P/E Ratio</SelectItem>
                <SelectItem value="pb_ratio" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">P/B Ratio</SelectItem>
                <SelectItem value="rsi" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">RSI (14-Day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground">Condition</Label>
              <Select>
                <SelectTrigger className="h-12 bg-background border-border rounded-xl text-sm font-medium focus:ring-[#188bf6]/20 focus:border-[#188bf6]/50 transition-all w-full data-[state=open]:border-[#188bf6]/50">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl shadow-xl z-50">
                  <SelectItem value="drops_below" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">Drops below</SelectItem>
                  <SelectItem value="crosses_above" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">Crosses above</SelectItem>
                  <SelectItem value="exactly_equals" className="focus:bg-secondary focus:text-foreground cursor-pointer rounded-md">Equals exactly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-muted-foreground">Target Value</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="h-12 pl-4 pr-12 bg-background border-border rounded-xl text-sm font-mono font-medium focus:ring-[#188bf6]/20 focus:border-[#188bf6]/50 transition-all w-full"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-muted-foreground font-semibold">VAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-secondary/30 border-t border-border">
          <button 
            onClick={onClose}
            className="w-full h-12 bg-[#188bf6] text-white rounded-xl text-sm font-semibold hover:bg-[#157add] transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <BellPlus className="w-4 h-4" />
            <span>Save Trigger</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
