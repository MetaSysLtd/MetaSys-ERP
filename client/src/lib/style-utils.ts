/**
 * Style utilities for consistent styling across components
 */

// Shadow classes based on design system
export const shadowClasses = {
  sm: "shadow-sm", 
  md: "shadow",
  lg: "shadow-md",
  xl: "shadow-lg",
  none: "shadow-none"
};

// Consistent dashboard card styling
export const cardStyles = {
  base: "bg-white rounded-lg transition-all",
  accent: "border-l-4 border-[#F2A71B]",
  shadow: shadowClasses.md,
  hover: "hover:shadow-md hover:translate-y-[-2px]",
  active: "active:shadow-sm active:translate-y-0",
};

// Generate card class string (with hover effect by default)
export function getCardClass({
  withAccent = false,
  withHover = true,
  shadowSize = "md"
} = {}) {
  return `${cardStyles.base} ${shadowClasses[shadowSize as keyof typeof shadowClasses]} ${
    withAccent ? cardStyles.accent : ""
  } ${withHover ? cardStyles.hover : ""}`;
}

// Spacing tokens
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem",  // 8px
  3: "0.75rem", // 12px 
  4: "1rem",    // 16px
  5: "1.25rem", // 20px
  6: "1.5rem",  // 24px
  8: "2rem",    // 32px
  10: "2.5rem", // 40px
  12: "3rem",   // 48px
};

// Typography styles
export const typography = {
  h1: "text-3xl font-bold leading-tight",
  h2: "text-2xl font-bold leading-tight",
  h3: "text-xl font-semibold leading-tight",
  h4: "text-lg font-semibold leading-tight",
  h5: "text-base font-medium leading-tight",
  body: "text-base font-normal leading-normal",
  small: "text-sm font-normal leading-normal",
  tiny: "text-xs font-normal leading-normal",
};

// Brand colors
export const brandColors = {
  primary: "#025E73",
  secondary: "#F2A71B",
  navy: "#011F26",
  plum: "#412754",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};