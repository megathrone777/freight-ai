import { colors } from "@/theme/variables";

import { wrapperClass } from "./Spinner.css";

import type { TProps } from "./Spinner.types";

const Spinner: React.FC<TProps> = ({ className, color = colors.amber, template }) => (
  <div
    className={`
      ${wrapperClass({ template })}
      ${className && !!className.length ? ` ${className}` : ""}
    `}
    style={{
      borderColor: color,
      borderTopColor: "transparent",
    }}
  />
);

export { Spinner };
