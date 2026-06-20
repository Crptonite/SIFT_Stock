import { useState, useEffect, useCallback } from "react";
import {
  ThemeProvider, Card, CardContent, Typography, Box,
  Grid, CircularProgress, Skeleton, Tooltip, IconButton,
} from "@mui/material";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import RefreshIcon      from "@mui/icons-material/Refresh";
import { muiDarkTheme } from "../../lib/muiTheme";

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || "d6fhsm1r01qjq8n1n9e0d6fhsm1r01qjq8n1n9eg";
const FINNHUB    = "https://finnhub.io/api/v1";

const WATCHLIST = [
  { symbol: "SPY",  label: "S&P 500 ETF",  tag: "Index" },
  { symbol: "QQQ",  label: "Nasdaq-100",   tag: "Index" },
  { symbol: "DIA",  label: "Dow Jones",    tag: "Index" },
  { symbol: "IWM",  label: "Russell 2000", tag: "Index" },
  { symbol: "AAPL", label: "Apple",        tag: "US" },
  { symbol: "NVDA", label: "NVIDIA",       tag: "US" },
  { symbol: "MSFT", label: "Microsoft",    tag: "US" },
  { symbol: "TSLA", label: "Tesla",        tag: "US" },
];

interface QuoteMap { [sym: string]: { c: number; d: number; dp: number } | null }

async function fetchQuote(symbol: string): Promise<{ c: number; pc: number } | null> {
  try {
    const r = await fetch(`${FINNHUB}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function MarketCard({ symbol, label, tag, quote }: {
  symbol: string; label: string; tag: string;
  quote: { c: number; d: number; dp: number } | null | undefined;
}) {
  const loading = quote === undefined;
  const isUp    = quote ? quote.d >= 0 : true;
  const upColor = "#6BAB8E";
  const dnColor = "#E07070";
  const color   = isUp ? upColor : dnColor;

  return (
    <Card elevation={0} sx={{
      height: "100%",
      transition: "border-color 0.2s",
      "&:hover": { borderColor: quote ? (isUp ? upColor : dnColor) : "inherit" },
    }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
              {tag}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} fontFamily="monospace" color="text.primary">
              {symbol}
            </Typography>
          </Box>
          {loading ? (
            <CircularProgress size={14} thickness={5} sx={{ color: "text.secondary", mt: 0.5 }} />
          ) : quote ? (
            isUp
              ? <TrendingUpIcon sx={{ color: upColor, fontSize: 18 }} />
              : <TrendingDownIcon sx={{ color: dnColor, fontSize: 18 }} />
          ) : null}
        </Box>

        {loading ? (
          <>
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="50%" height={18} />
          </>
        ) : quote ? (
          <>
            <Typography variant="h6" fontWeight={700} fontFamily="monospace" color="text.primary" lineHeight={1.1}>
              ${quote.c.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color, fontWeight: 600, fontFamily: "monospace" }}>
              {isUp ? "▲" : "▼"} {Math.abs(quote.d).toFixed(2)} ({isUp ? "+" : ""}{quote.dp.toFixed(2)}%)
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">No data</Typography>
        )}

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8, fontSize: 10 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function MarketOverviewCards() {
  const [quotes,    setQuotes]    = useState<QuoteMap>({});
  const [refreshed, setRefreshed] = useState<Date>(new Date());
  const [spinning,  setSpinning]  = useState(false);

  const loadAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setSpinning(true);
    // Stagger requests to avoid hitting Finnhub rate limit (60/min free)
    for (let i = 0; i < WATCHLIST.length; i++) {
      const { symbol } = WATCHLIST[i];
      const q = await fetchQuote(symbol);
      if (q) {
        const d  = q.c - q.pc;
        const dp = q.pc > 0 ? (d / q.pc) * 100 : 0;
        setQuotes((prev) => ({ ...prev, [symbol]: { c: q.c, d, dp } }));
      } else {
        setQuotes((prev) => ({ ...prev, [symbol]: null }));
      }
      // Small stagger to avoid burst rate limiting
      if (i < WATCHLIST.length - 1) await new Promise((r) => setTimeout(r, 120));
    }
    setRefreshed(new Date());
    if (showSpinner) setSpinning(false);
  }, []);

  // Initial load
  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 90s (respects free Finnhub rate limit)
  useEffect(() => {
    const id = setInterval(() => loadAll(), 90_000);
    return () => clearInterval(id);
  }, [loadAll]);

  return (
    <ThemeProvider theme={muiDarkTheme}>
      <Box sx={{ mb: 2 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: "0.12em" }}>
            Market Overview
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Updated {refreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Typography>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => loadAll(true)} disabled={spinning}>
                <RefreshIcon fontSize="small" sx={{ color: "text.secondary", ...(spinning && { animation: "spin 1s linear infinite" }) }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Cards grid */}
        <Grid container spacing={1.5}>
          {WATCHLIST.map(({ symbol, label, tag }) => (
            <Grid size={{ xs: 6, sm: 3 }} key={symbol}>
              <MarketCard
                symbol={symbol}
                label={label}
                tag={tag}
                quote={symbol in quotes ? quotes[symbol] : undefined}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </ThemeProvider>
  );
}
