import { rgba, style } from "@/theme";

export const wrapperClass = style(({ colors }) => ({
  backgroundColor: rgba(colors.black, 0.96),
  border: `1px solid ${colors.gray}`,
  borderRadius: 12,
  color: colors.white,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  maxHeight: "calc(100% - 180px)",
  overflowY: "auto",
  padding: 16,
  position: "absolute",
  right: 12,
  top: 12,
  width: "min(340px, calc(100% - 24px))",
  zIndex: 2,
}));

export const headingClass = style(({ fonts }) => ({
  fontSize: 18,
  fontWeight: fonts.semiBold,
  margin: 0,
}));

export const routeClass = style(({ colors, fonts }) => ({
  color: colors.white,
  fontSize: 16,
  fontWeight: fonts.semiBold,
}));

export const metaClass = style(({ colors }) => ({
  color: colors.gray,
  fontSize: 14,
  lineHeight: 1.5,
}));

export const statusClass = style(({ colors, fonts }) => ({
  color: colors.amber,
  fontSize: 13,
  fontWeight: fonts.semiBold,
  textTransform: "uppercase",
}));

export const messagesClass = style(({ colors }) => ({
  borderTop: `1px solid ${colors.gray}`,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingTop: 10,
}));

export const messageClass = style({
  display: "flex",
  fontSize: 14,
  justifyContent: "space-between",
});

export const actionsClass = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
});

export const noticeClass = style(({ colors }) => ({
  color: colors.orange,
  fontSize: 14,
}));

export const errorClass = style(({ colors }) => ({
  color: colors.red,
  fontSize: 14,
}));

export const loadingClass = style({
  alignItems: "center",
  display: "flex",
  gap: 10,
});
