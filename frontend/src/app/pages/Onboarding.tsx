import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronRight, Briefcase, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

const TEMPLATES = [
  {
    id: "blue-chip",
    title: "Blue Chip Essentials",
    description: "Stable, large-cap companies with a history of reliable earnings and dividends.",
    icon: ShieldCheck,
    criteria: [
      { name: "Market Cap", value: "> $100B" },
      { name: "P/E Ratio", value: "< 25" },
      { name: "Dividend Yield", value: "> 2%" },
    ],
  },
  {
    id: "value",
    title: "Deep Value",
    description: "Structurally sound businesses currently trading below their intrinsic value.",
    icon: Briefcase,
    criteria: [
      { name: "P/B Ratio", value: "< 1.5" },
      { name: "Debt/Equity", value: "< 0.5" },
      { name: "Free Cash Flow", value: "> $500M" },
    ],
  },
  {
    id: "growth",
    title: "Sustainable Growth",
    description: "Companies exhibiting consistent top and bottom-line expansion without excessive leverage.",
    icon: TrendingUp,
    criteria: [
      { name: "Revenue Growth", value: "> 15% YoY" },
      { name: "Gross Margin", value: "> 40%" },
      { name: "ROE", value: "> 15%" },
    ],
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-semibold text-foreground mb-3 tracking-tight">Configure Baseline</h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Select a starting template. SIFT will automatically apply these parameters to your daily automated screen. You can customize them later.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {TEMPLATES.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative cursor-pointer rounded-2xl border p-6 transition-all ${
                isSelected
                  ? "border-foreground bg-card shadow-sm ring-1 ring-foreground"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 h-6 w-6 bg-foreground rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-background" strokeWidth={3} />
                </div>
              )}
              <div className={`p-3 rounded-xl inline-flex mb-4 ${isSelected ? "bg-secondary text-foreground" : "bg-secondary text-muted-foreground"}`}>
                <template.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{template.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {template.description}
              </p>

              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default Criteria</p>
                {template.criteria.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">{c.name}</span>
                    <span className="font-semibold text-foreground">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-6 border-t border-border">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-foreground text-background px-8 py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center font-semibold text-sm shadow-md"
        >
          Generate Screener
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}