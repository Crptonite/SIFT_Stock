import { createTheme } from "@mui/material/styles";

export const muiDarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#8BB8C9" },
    secondary:  { main: "#AFA089" },
    success:    { main: "#6BAB8E" },
    error:      { main: "#E07070" },
    warning:    { main: "#EF9E4A" },
    background: { default: "transparent", paper: "rgba(255,255,255,0.04)" },
    text:       { primary: "#F0EBE3", secondary: "#8A9BAE" },
    divider:    "rgba(255,255,255,0.08)",
  },
  typography: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: 13,
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: "rgba(255,255,255,0.06)", fontSize: 12 },
        head: { color: "#8A9BAE", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontSize: 11, fontWeight: 600, height: 22 } },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, fontFamily: "inherit" },
      },
    },
  },
});
