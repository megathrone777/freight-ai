import { style } from "@/theme";

const wrapperClass = style(({ colors }) => ({
  background: colors.black,
  color: colors.white,
  minHeight: "100dvh",
  padding: 28,
}));

const heading = style({ fontSize: 24, fontWeight: 600, margin: "0 0 8px" });
const description = style(({ colors }) => ({
  color: colors.white,
  fontSize: 15,
  margin: "0 0 24px",
}));
const stats = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 24,
  maxWidth: 880,
});
const stat = style(({ colors }) => ({
  background: colors.black,
  border: `1px solid ${colors.gray}`,
  borderRadius: 10,
  flex: "1 1 200px",
  padding: 18,
}));
const statLabel = style(({ colors }) => ({ color: colors.gray, fontSize: 13 }));
const statValue = style(({ colors }) => ({
  color: colors.white,
  fontSize: 24,
  fontWeight: 600,
  marginTop: 8,
}));
const runButton = style({ marginBottom: 16 });
const tableWrap = style({ maxWidth: 1200, overflowX: "auto" });
const table = style({
  borderCollapse: "collapse",
  fontSize: 14,
  minWidth: 900,
});
const cell = style(({ colors }) => ({
  borderBottom: `1px solid ${colors.gray}`,
  padding: "12px 14px",
  textAlign: "left",
  verticalAlign: "top",
}));
const error = style(({ colors }) => ({
  color: colors.red,
  fontSize: 14,
  marginBottom: 12,
}));

export {
  cell,
  description,
  error,
  heading,
  runButton,
  stat,
  statLabel,
  stats,
  statValue,
  table,
  tableWrap,
  wrapperClass,
};
