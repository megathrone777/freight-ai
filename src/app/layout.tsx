import "@/theme/global";

import { font } from "./fonts";

const Layout: React.FC<LayoutProps<"/">> = ({ children }) => (
  <html
    className={font.variable}
    lang="en"
  >
    <body>{children}</body>
  </html>
);

export { metadata } from "./metadata";
export { viewport } from "./viewport";
export default Layout;
