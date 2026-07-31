import type { ComponentType } from "react";

/**
 * A component-based icon prop type broad enough for both lucide-react icons
 * (ForwardRefExoticComponent<LucideProps>) and the Animate UI icon
 * components (plain function components with their own IconProps) -
 * structurally compatible with both, unlike lucide-react's own `LucideIcon`
 * type which only accepts its own icons.
 */
export type IconComponent = ComponentType<{
  className?: string;
  size?: number;
  strokeWidth?: number;
}>;
