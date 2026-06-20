import { useState } from "react";
import {
  ThemeProvider, Card, CardContent, Typography, TextField,
  InputAdornment, IconButton, Box, Chip, Divider, Skeleton, Alert,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { muiDarkTheme } from "../../lib/muiTheme";

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || "d6fhsm1r01qjq8n1n9e0d6fhsm1r01qjq8n1n9eg";
const FINNHUB    = "https://finnhub.io/api/v1";

interface Quote {
  c:  number; // current price
  o:  number; // open
  h:  number; // high
  l:  number; // low
  pc: number; // previous close
  d:  number; // change
  dp: number; // change %
}

interface Profile {
  name:     string;
  exchange: string;
  currency: string;
  logo:     string;
  industry: string;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} fontFamily="monospace">
        {value}
      </Typography>
    </Box>
  );
}

export function StockSearchWidget() {
  const [input,   setInput]   = useState("");
  const [ticker,  setTicker]  = useState<string | null>(null);
  const [quote,   setQuote]   = useState<Quote | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const search = async (sym = input) => {
    const symbol = sym.trim().toUpperCase();
    if (!symbol) return;
    setLoading(true);
    setError(null);
    setQuote(null);
    setProfile(null);
    setTicker(symbol);

    try {
      const [qRes, pRes] = await Promise.all([
        fetch(`${FINNHUB}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`),
        fetch(`${FINNHUB}/stock/profile2?symbol=${symbol}&token=${FINNHUB_KEY}`),
      ]);
      const q: Quote   = await qRes.json();
      const p: Profile = await pRes.json();

      if (!q.c || q.c === 0) {
        setError(`No data found for "${symbol}". Check the ticker symbol.`);
        setLoading(false);
        return;
      }
      setQuote({ ...q, d: q.c - q.pc, dp: ((q.c - q.pc) / q.pc) * 100 });
      setProfile(p?.name ? p : null);
    } catch {
      setError("Failed to fetch quote. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const isUp    = quote ? quote.d >= 0 : true;
  const color   = isUp ? "#6BAB8E" : "#E07070";
  const fmt     = (n: number, d = 2) => n?.toFixed(d) ?? "—";

  return (
    <ThemeProvider theme={muiDarkTheme}>
      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Typography variant="overline" color="primary" sx={{ letterSpacing: "0.12em", mb: 1.5, display: "block" }}>
            Stock Lookup
          </Typography>

          {/* Search bar */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter ticker (e.g. AAPL, D05.SI, 9988.HK)"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && search()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                sx: { fontFamily: "monospace", fontSize: 13 },
              }}
            />
            <IconButton
              onClick={() => search()}
              disabled={loading}
              sx={{ bgcolor: "primary.main", color: "#000", borderRadius: 2, px: 2, "&:hover": { bgcolor: "primary.light" } }}
            >
              <SearchIcon />
            </IconButton>
          </Box>

          {/* Quick tickers */}
          <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: quote || loading ? 2 : 0 }}>
            {["AAPL", "MSFT", "NVDA", "GOOGL", "D05.SI", "0700.HK"].map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                variant="outlined"
                onClick={() => { setInput(s); search(s); }}
                sx={{ fontSize: 11, cursor: "pointer", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
              />
            ))}
          </Box>

          {/* Error */}
          {error && <Alert severity="warning" sx={{ mt: 1, fontSize: 12 }}>{error}</Alert>}

          {/* Loading skeleton */}
          {loading && (
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="25%" height={24} sx={{ mb: 1 }} />
              <Grid container spacing={1.5}>
                {[1,2,3,4,5,6].map(i => <Grid size={4} key={i}><Skeleton variant="rectangular" height={44} sx={{ borderRadius: 1.5 }} /></Grid>)}
              </Grid>
            </Box>
          )}

          {/* Quote result */}
          {quote && !loading && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Box>
                  <Typography variant="h5" fontWeight={700} fontFamily="monospace" color="text.primary">
                    {profile?.currency || ""} {fmt(quote.c)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.4 }}>
                    {isUp ? <TrendingUpIcon sx={{ color, fontSize: 18 }} /> : <TrendingDownIcon sx={{ color, fontSize: 18 }} />}
                    <Typography variant="body2" sx={{ color, fontWeight: 700, fontFamily: "monospace" }}>
                      {isUp ? "+" : ""}{fmt(quote.d)} ({isUp ? "+" : ""}{fmt(quote.dp)}%)
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    {ticker}
                  </Typography>
                  {profile?.name && (
                    <Typography variant="caption" color="text.secondary">
                      {profile.name}
                    </Typography>
                  )}
                  {profile?.exchange && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {profile.exchange} · {profile.industry || ""}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={4}><StatBox label="Open"       value={`${fmt(quote.o)}`} /></Grid>
                <Grid size={4}><StatBox label="High"       value={`${fmt(quote.h)}`} /></Grid>
                <Grid size={4}><StatBox label="Low"        value={`${fmt(quote.l)}`} /></Grid>
                <Grid size={4}><StatBox label="Prev Close" value={`${fmt(quote.pc)}`} /></Grid>
                <Grid size={4}><StatBox label="Change"     value={`${isUp ? "+" : ""}${fmt(quote.d)}`} /></Grid>
                <Grid size={4}><StatBox label="Change %"   value={`${isUp ? "+" : ""}${fmt(quote.dp)}%`} /></Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    </ThemeProvider>
  );
}
