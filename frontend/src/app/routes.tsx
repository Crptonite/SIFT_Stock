import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SearchHome } from "./pages/SearchHome";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { AIAnalysis } from "./pages/AIAnalysis";
import { Settings } from "./pages/Settings";
import { AuthPage } from "./pages/AuthPage";
import { ProTools } from "./pages/ProTools";
import { WealthAutomation } from "./pages/WealthAutomation";
import { AlternativeAssets } from "./pages/AlternativeAssets";
import { Community } from "./pages/Community";
import { AIChat } from "./pages/AIChat";
import { Watchlist } from "./pages/Watchlist";
import { Portfolio } from "./pages/Portfolio";
import { StockAnalysis } from "./pages/StockAnalysis";
import { NewsIntelligence } from "./pages/NewsIntelligence";
import { AlertsPage } from "./pages/AlertsPage";
import { AIMemory } from "./pages/AIMemory";
import { AdminPanel } from "./pages/AdminPanel";
import { Screener } from "./pages/Screener";

export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────────────
  { path: "/login",    Component: AuthPage },
  { path: "/register", Component: AuthPage },

  // ── Authenticated app shell ───────────────────────────────────────────
  {
    path: "/",
    Component: AppLayout,
    children: [
      // Non-auth routes (public landing)
      { index: true, Component: SearchHome },

      // Auth-required routes — wrapped in ProtectedRoute
      {
        Component: ProtectedRoute,
        children: [
          { path: "onboarding",         Component: Onboarding },
          { path: "dashboard",          Component: Dashboard },
          { path: "screener",           Component: Screener },
          { path: "analysis",           Component: AIAnalysis },
          { path: "settings",           Component: Settings },
          { path: "pro-tools",          Component: ProTools },
          { path: "wealth-automation",  Component: WealthAutomation },
          { path: "alternative-assets", Component: AlternativeAssets },
          { path: "community",          Component: Community },
          { path: "ai-chat",            Component: AIChat },
          { path: "watchlist",          Component: Watchlist },
          { path: "portfolio",          Component: Portfolio },
          { path: "stock-analysis",     Component: StockAnalysis },
          { path: "news",               Component: NewsIntelligence },
          { path: "alerts",             Component: AlertsPage },
          { path: "ai-memory",          Component: AIMemory },
        ],
      },

      // Admin-only route — requires is_admin === true
      {
        Component: () => <ProtectedRoute adminOnly />,
        children: [
          { path: "admin", Component: AdminPanel },
        ],
      },
    ],
  },
]);
