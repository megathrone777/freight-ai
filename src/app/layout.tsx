import "@/theme/global";

import "maplibre-gl/dist/maplibre-gl.css";

import { avenirFont } from "./fonts";

const Layout: React.FC<LayoutProps<"/">> = ({ children }) => (
  <html
    className={avenirFont.variable}
    lang="en"
  >
    <body>{children}</body>
  </html>
);

export { metadata } from "./metadata";
export { viewport } from "./viewport";
export default Layout;
