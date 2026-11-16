import { wrapperClass } from "./Input.css";

import type { TProps } from "./Input.types";

const Input: React.FC<TProps> = ({ className, ...props }) => (
  <input
    className={`${wrapperClass}${className ? ` ${className}` : ""}`}
    {...props}
  />
);

export { Input };
