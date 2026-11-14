import { style } from "@/theme";

const page = style(({ colors }) => ({
  background: colors.blackCanvas,
  color: colors.text,
  minHeight: "100dvh",
  padding: 28,
}));
const heading = style({ fontSize: 22, fontWeight: 600, margin: "0 0 6px" });
const description = style(({ colors }) => ({ color: colors.textMuted, fontSize: 13, margin: "0 0 24px" }));
const stats = style({
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  marginBottom: 24,
  maxWidth: 880,
});
const stat = style(({ colors }) => ({
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  padding: 16,
}));
const statLabel = style(({ colors }) => ({ color: colors.textMuted, fontSize: 11 }));
const statValue = style(({ colors }) => ({ color: colors.textPrimary, fontSize: 22, fontWeight: 600, marginTop: 8 }));
const runButton = style(({ colors }) => ({
  background: colors.panelRaised,
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: 8,
  color: colors.textPrimary,
  cursor: "pointer",
  marginBottom: 16,
  padding: "10px 14px",
}));
const tableWrap = style({ maxWidth: 1200, overflowX: "auto" });
const table = style({
  borderCollapse: "collapse",
  fontSize: 12,
  minWidth: 900,
});
const cell = style(({ colors }) => ({
  borderBottom: `1px solid ${colors.border}`,
  padding: "10px 12px",
  textAlign: "left",
  verticalAlign: "top",
}));
const error = style(({ colors }) => ({ color: colors.error, fontSize: 12, marginBottom: 12 }));

export { cell, description, error, heading, page, runButton, stat, statLabel, stats, statValue, table, tableWrap };
