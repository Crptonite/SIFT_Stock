import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";
import { Shield, Sparkles, SlidersHorizontal } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlueChip: () => void;
  onSelectCustom: () => void;
}

export function OnboardingModal({ isOpen, onClose, onSelectBlueChip, onSelectCustom }: OnboardingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-md bg-card border-border rounded-2xl p-0 overflow-hidden shadow-2xl font-sans [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Welcome to SIFT</DialogTitle>
          <DialogDescription>Let's set up your first screener to get started.</DialogDescription>
        </VisuallyHidden>
        
        <div className="p-8 pb-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#188bf6]/10 rounded-2xl flex items-center justify-center shadow-sm border border-[#188bf6]/20 mb-6">
            <Shield className="w-8 h-8 text-[#188bf6]" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Welcome to SIFT.
          </h2>
          <p className="text-base text-muted-foreground max-w-sm mx-auto">
            Let's set up your first screener to give you instant market clarity without the noise.
          </p>
        </div>

        <div className="p-6 pt-2 space-y-4">
          <button 
            onClick={onSelectBlueChip}
            className="w-full h-14 bg-[#188bf6] text-white rounded-xl text-sm font-semibold hover:bg-[#157add] transition-all flex items-center justify-center space-x-2 shadow-md relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <Sparkles className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Start with Blue Chip Baseline</span>
            <span className="relative z-10 ml-1 text-white/70 font-normal">(Recommended)</span>
          </button>

          <button 
            onClick={onSelectCustom}
            className="w-full h-14 bg-transparent border-2 border-border text-foreground rounded-xl text-sm font-semibold hover:bg-secondary hover:border-muted-foreground/30 transition-all flex items-center justify-center space-x-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span>Create Custom Screener from Scratch</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}