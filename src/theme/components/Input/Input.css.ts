import { style } from "@/theme";

export const wrapperClass = style(({ colors, fonts }) => ({
  backgroundColor: colors.black,
  border: `1px solid ${colors.gray}`,
  borderRadius: 10,
  boxSizing: "border-box",
  color: colors.white,
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: fonts.normal,
  height: 54,
  padding: "0 16px",
  selectors: {
    "&::placeholder": { color: colors.gray },
    "&:focus-visible": { borderColor: colors.amber, outline: `2px solid ${colors.amber}` },
  },
  width: "100%",
}));
