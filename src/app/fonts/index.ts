import localFont from "next/font/local";

const font = localFont({
  src: [
    {
      path: "./JetBrainsMono-Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./JetBrainsMono-SemiBold.woff2",
      style: "normal",
      weight: "600",
    },
    {
      path: "./JetBrainsMono-Medium.woff2",
      style: "normal",
      weight: "500",
    },
    {
      path: "./JetBrainsMono-Bold.woff2",
      style: "normal",
      weight: "700",
    },
  ],
  variable: "--font-jetbrains-mono",
});

export { font };
