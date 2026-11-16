import { style } from "@/theme";

export const wrapperClass = style({
  height: "100%",
  width: "100%",
});

export const markerClass = style(({ colors }) => ({
  color: colors.yellow,
  display: "block",
  height: 20,
  width: 20,
}));

export const addressMarkerClass = style(({ colors }) => ({
  color: colors.red,
  display: "block",
  height: 20,
  width: 20,
}));
