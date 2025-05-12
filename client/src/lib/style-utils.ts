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

// Border classes
export const borderClasses = {
  none: "border-0",
  thin: "border border-[#D6D6D6]",
  accent: "border-l-4 border-[#F2A71B]",
  accentTop: "border-t-4 border-[#F2A71B]",
  accentBottom: "border-b-4 border-[#F2A71B]",
  rounded: "rounded-lg"
};

// Consistent dashboard card styling
export const cardStyles = {
  base: "bg-white rounded-lg transition-all",
  border: borderClasses.thin,
  accent: borderClasses.accent,
  accentTop: borderClasses.accentTop,
  accentBottom: borderClasses.accentBottom,
  shadow: shadowClasses.md,
  hover: "hover:shadow-md hover:translate-y-[-2px]",
  active: "active:shadow-sm active:translate-y-0",
  minHeight: "min-h-[180px]",
  padding: "p-5"
};

// Generate card class string (with hover effect by default)
export function getCardClass({
  withAccent = false,
  accentPosition = "left",
  withHover = true,
  withBorder = true,
  shadowSize = "md",
  minHeight = false
} = {}) {
  const accentClass = 
    accentPosition === "top" ? cardStyles.accentTop : 
    accentPosition === "bottom" ? cardStyles.accentBottom : 
    accentPosition === "left" ? cardStyles.accent : "";

  return `${cardStyles.base} ${shadowClasses[shadowSize as keyof typeof shadowClasses]} ${
    withBorder ? cardStyles.border : ""
  } ${withAccent ? accentClass : ""} ${
    withHover ? cardStyles.hover : ""
  } ${minHeight ? cardStyles.minHeight : ""}`;
}

// Consistent placeholder chart styling
export const placeholderChartStyles = {
  base: "flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4",
  height: "h-64",
  text: "text-gray-400 text-sm font-medium",
  subtext: "text-gray-500 text-xs mt-1"
};

// Spacing tokens (follows the 8px grid)
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
  h1: "text-3xl font-bold leading-tight text-gray-900 dark:text-gray-50",
  h2: "text-2xl font-bold leading-tight text-gray-900 dark:text-gray-50",
  h3: "text-xl font-semibold leading-tight text-gray-900 dark:text-gray-50",
  h4: "text-lg font-semibold leading-tight text-gray-900 dark:text-gray-50",
  h5: "text-base font-medium leading-tight text-gray-900 dark:text-gray-50",
  cardTitle: "text-lg font-medium leading-tight text-[#025E73] dark:text-[#F2A71B]",
  body: "text-base font-normal leading-normal text-gray-700 dark:text-gray-300",
  small: "text-sm font-normal leading-normal text-gray-600 dark:text-gray-400",
  tiny: "text-xs font-normal leading-normal text-gray-500 dark:text-gray-500",
  value: "text-lg font-medium text-gray-900 dark:text-gray-100",
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
  background: {
    light: "#F1FAFB",
    dark: "#162231"
  },
  text: {
    primary: "#025E73",
    secondary: "#F2A71B",
    dark: "#011F26",
    light: "#FFFFFF"
  }
};

// Metric card specific styles
export const metricCardStyles = {
  title: "text-sm font-medium text-gray-500 whitespace-normal",
  value: "text-lg font-medium text-gray-900 dark:text-gray-100",
  description: "text-sm flex items-center",
  iconContainer: "flex-shrink-0 rounded-md p-3",
  grid: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
};

// Button styles based on brand guidelines
export const buttonStyles = {
  primary: "bg-[#025E73] hover:bg-[#011F26] text-white rounded-md transition-all duration-200",
  secondary: "bg-[#F2A71B] hover:bg-[#412754] text-white rounded-md transition-all duration-200",
  outline: "border border-[#025E73] text-[#025E73] hover:bg-[#025E73] hover:text-white rounded-md transition-all duration-200"
};