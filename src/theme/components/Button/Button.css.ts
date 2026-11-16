import { recipe, type RecipeVariants } from "@/theme";

export const wrapperClass = recipe(({ colors, devices, fonts }) => ({
  base: {
    alignItems: "center",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontWeight: fonts.medium,
    gap: 8,
    justifyContent: "center",
    padding: "0 16px",
    selectors: {
      "&:disabled": { cursor: "not-allowed", opacity: 0.55 },
      "&:focus-visible": { outline: `2px solid ${colors.amber}`, outlineOffset: 2 },
    },
  },

  defaultVariants: {
    size: "medium",
    template: "primary",
  },

  variants: {
    size: {
      large: {
        height: 36,

        "@media": {
          [devices.tablet]: { height: 42 },
        },
      },

      medium: { height: 36 },
      small: { height: 32 },
    },

    template: {
      primary: { background: colors.blue, color: colors.white },
      secondary: { background: colors.white, color: colors.black },
      tertiary: { background: "transparent", color: colors.white },
    },
  },
}));

export type TButtonVariants = RecipeVariants<typeof wrapperClass>;
