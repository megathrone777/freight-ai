import { rgba, style } from "@/theme";

export const wrapperClass = style(({ colors }) => ({
  backgroundColor: rgba(colors.black, 0.96),
  border: `1px solid ${colors.gray}`,
  borderRadius: 16,
  bottom: 24,
  boxShadow: `0 14px 40px ${rgba(colors.black, 0.55)}`,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  left: "50%",
  maxHeight: "min(72dvh, 620px)",
  maxWidth: 760,
  padding: 16,
  position: "absolute",
  transform: "translateX(-50%)",
  width: "calc(100% - 32px)",
  zIndex: 2,
}));

export const historyClass = style(({ colors }) => ({
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  paddingRight: 12,
  scrollbarColor: `${colors.white} ${colors.gray}`,
  scrollbarWidth: "thin",
}));

export const historyContentClass = style({
  display: "flex",
  flexDirection: "column",
  gap: 12,
});

export const conversationHeaderClass = style(({ colors, fonts }) => ({
  alignItems: "center",
  color: colors.white,
  display: "flex",
  fontSize: 14,
  fontWeight: fonts.semiBold,
  justifyContent: "space-between",
}));

export const collapseButtonClass = style({
  flexShrink: 0,
});

export const messageClass = style(({ colors }) => ({
  borderRadius: 12,
  color: colors.white,
  fontSize: 15,
  lineHeight: 1.55,
  maxWidth: "90%",
  padding: "12px 14px",
  whiteSpace: "pre-wrap",
}));

export const userMessageClass = style(({ colors }) => ({
  alignSelf: "flex-end",
  backgroundColor: colors.blue,
}));

export const assistantMessageClass = style(({ colors }) => ({
  alignSelf: "flex-start",
  backgroundColor: colors.gray,
}));

export const labelClass = style(({ fonts }) => ({
  fontSize: 12,
  fontWeight: fonts.semiBold,
}));

export const partsClass = style({
  marginTop: 4,
});

export const inputRowClass = style({
  alignItems: "center",
  display: "flex",
  gap: 10,
});

export const statusClass = style(({ colors }) => ({
  alignItems: "center",
  color: colors.white,
  display: "flex",
  fontSize: 14,
  gap: 10,
}));

export const errorClass = style(({ colors }) => ({
  color: colors.red,
  fontSize: 14,
}));
