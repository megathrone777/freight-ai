import { rgba, style } from "@/theme";

export const wrapperClass = style(({ colors, devices }) => ({
  backgroundColor: colors.black,
  borderRight: `1px solid ${colors.gray}`,
  color: colors.white,
  display: "flex",
  flexBasis: 320,
  flexDirection: "column",
  height: "42dvh",
  left: 12,
  minWidth: 0,
  position: "absolute",
  top: 12,
  width: "min(320px, calc(100vw - 24px))",
  zIndex: 1,

  "@media": {
    [devices.tablet]: {
      height: "100%",
      minWidth: 280,
      position: "static",
      width: 280,
      zIndex: "auto",
    },
  },
}));

export const headerClass = style(({ colors }) => ({
  borderBottom: `1px solid ${colors.gray}`,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 22,
}));

export const titleClass = style(({ fonts }) => ({
  fontSize: 20,
  fontWeight: fonts.semiBold,
}));

export const listClass = style(({ colors }) => ({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  overflowY: "auto",
  scrollbarColor: `${colors.white} ${colors.gray}`,
  scrollbarWidth: "thin",
}));

export const cardClass = style(({ colors }) => ({
  alignItems: "stretch",
  backgroundColor: "transparent",
  borderBottom: `1px solid ${colors.gray}`,
  borderLeft: "4px solid transparent",
  borderRadius: 0,
  color: colors.white,
  display: "flex",
  flexDirection: "column",
  gap: 7,
  height: "auto",
  justifyContent: "flex-start",
  padding: "16px 18px",
  selectors: { "&:hover:not(:disabled)": { backgroundColor: rgba(colors.orange, 0.12) } },
  textAlign: "left",
  width: "100%",
}));

export const selectedCardClass = style(({ colors }) => ({
  borderLeftColor: colors.orange,
}));

export const routeClass = style(({ fonts }) => ({
  alignItems: "center",
  display: "flex",
  fontSize: 17,
  fontWeight: fonts.semiBold,
  gap: 7,
}));

export const metaClass = style(({ colors }) => ({
  color: colors.gray,
  fontSize: 14,
}));

export const statusClass = style(({ colors, fonts }) => ({
  color: colors.amber,
  fontSize: 12,
  fontWeight: fonts.semiBold,
  textTransform: "uppercase",
}));
