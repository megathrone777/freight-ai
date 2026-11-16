import { Icon } from "@/ui";

import { wrapperClass } from "./Button.css";

import type { TProps } from "./Button.types";

const Button: React.FC<TProps> = ({
  children,
  className,
  iconId,
  size,
  template,
  type = "button",
  ...rest
}) => (
  <button
    className={`
      ${wrapperClass({ size, template })}
      ${className && !!className.length ? ` ${className}` : ""}
    `}
    type={type}
    {...rest}
  >
    {iconId && <Icon id={iconId} />}
    {children}
  </button>
);

export { Button };
