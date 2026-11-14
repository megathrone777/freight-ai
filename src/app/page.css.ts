import { globalStyle, rgba, style } from "@/theme";

const shell = style(({ colors }) => ({
  background: colors.blackCanvas,
  color: colors.text,
  height: "100dvh",
  overflow: "hidden",
  position: "relative",
}));
const map = style({ height: "100%", inset: 0, position: "absolute", width: "100%" });
const top = style({
  left: "50%",
  maxWidth: 680,
  position: "absolute",
  top: 24,
  transform: "translateX(-50%)",
  width: "calc(100% - 48px)",
  zIndex: 2,
});
const search = style(({ colors }) => ({
  alignItems: "center",
  background: rgba(colors.panel, 0.94),
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  boxShadow: `0 12px 40px ${rgba(colors.black, 0.4)}`,
  display: "flex",
  gap: 12,
  padding: "0 16px",
}));
const input = style(({ colors }) => ({
  background: "transparent",
  border: 0,
  color: colors.textPrimary,
  flex: 1,
  fontSize: 15,
  height: 54,
  outline: "none",
  selectors: { "&::placeholder": { color: colors.textFaint } },
}));
const leftPanel = style(({ colors }) => ({
  background: rgba(colors.panel, 0.95),
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  bottom: 20,
  left: 20,
  maxHeight: "calc(100% - 110px)",
  overflow: "auto",
  position: "absolute",
  width: 340,
  zIndex: 1,
}));
const header = style(({ colors }) => ({
  alignItems: "center",
  borderBottom: `1px solid ${colors.border}`,
  display: "flex",
  justifyContent: "space-between",
  padding: 16,
}));
const title = style({ fontSize: 15, fontWeight: 600, margin: 0 });
const list = style({ display: "grid", gap: 0 });
const card = style(({ colors }) => ({
  background: "transparent",
  border: 0,
  borderBottom: `1px solid ${colors.borderSubtle}`,
  color: "inherit",
  cursor: "pointer",
  padding: 16,
  selectors: { "&:hover": { background: colors.panelHover } },
  textAlign: "left",
}));
const route = style(({ colors }) => ({ color: colors.textPrimary, fontSize: 14, fontWeight: 600 }));
const meta = style(({ colors }) => ({ color: colors.textMuted, fontSize: 12, marginTop: 8 }));
const status = style(({ colors }) => ({
  color: colors.blueNew,
  fontSize: 10,
  letterSpacing: ".08em",
  textTransform: "uppercase",
}));
const negotiating = style(({ colors }) => ({
  color: colors.amber,
  fontSize: 10,
  letterSpacing: ".08em",
  textTransform: "uppercase",
}));
const rightPanel = style(({ colors }) => ({
  background: rgba(colors.panel, 0.96),
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  maxHeight: "calc(100% - 110px)",
  overflow: "auto",
  padding: 18,
  position: "absolute",
  right: 20,
  top: 96,
  width: 300,
  zIndex: 2,
}));
const button = style(({ colors }) => ({
  background: colors.panelRaised,
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: 8,
  color: colors.textButton,
  fontSize: 12,
  marginTop: 12,
  padding: "8px 10px",
  selectors: {
    "&:disabled": { cursor: "not-allowed", opacity: 0.45 },
    "&:not(:disabled)": { cursor: "pointer" },
  },
}));
const tools = style({ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 });
const chip = style(({ colors }) => ({
  background: rgba(colors.violet, 0.16),
  border: `1px solid ${rgba(colors.violet, 0.36)}`,
  borderRadius: 99,
  color: colors.violetText,
  fontSize: 11,
  padding: "5px 8px",
}));
const error = style(({ colors }) => ({ color: colors.error, fontSize: 12, marginTop: 8 }));
const brand = style(({ colors }) => ({ color: colors.brand, fontSize: 12, fontWeight: 700, letterSpacing: ".08em" }));
const timeline = style({ display: "grid", gap: 12, marginTop: 16 });
const timelineItem = style(({ colors }) => ({
  borderLeft: `1px solid ${colors.borderStrong}`,
  display: "grid",
  gap: 4,
  paddingLeft: 12,
}));
const negotiationActions = style({ display: "flex", gap: 8, marginTop: 14 });
const success = style(({ colors }) => ({ color: colors.greenLighter, fontSize: 11, textTransform: "uppercase" }));
const warning = style(({ colors }) => ({ color: colors.amber, fontSize: 11, textTransform: "uppercase" }));

globalStyle(".maplibregl-ctrl-group", ({ colors }) => ({ background: colors.panel, border: `1px solid ${colors.border}` }));
globalStyle(".maplibregl-ctrl button", { filter: "invert(1)" });

export {
  brand, button, card, chip, error, header, input, leftPanel, list, map, meta, negotiating, negotiationActions,
  rightPanel, route, search, shell, status, success, timeline, timelineItem, title, tools, top, warning,
};
