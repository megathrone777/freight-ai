import { globalStyle } from "@/theme";

globalStyle(".error", ({ devices }) => ({
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  gap: 30,
  height: "100%",
  justifyContent: "center",
  padding: "35px 10px",
  width: "100%",

  "@media": {
    [devices.desktopLg]: {
      gap: 38,
      marginInline: "auto",
      maxWidth: 1300,
    },

    [devices.desktopXl]: {
      maxWidth: 1400,
    },
  },
}));

globalStyle(".error__image", {
  display: "inline-block",
  height: "100%",
  width: "auto",
});

globalStyle(".error__title", ({ devices, fonts }) => ({
  fontSize: 34,
  fontWeight: fonts.bold,
  lineHeight: 1.2,
  textAlign: "center",

  "@media": {
    [devices.desktop]: {
      fontSize: 36,
    },

    [devices.desktopLg]: {
      fontSize: 42,
    },
  },
}));
