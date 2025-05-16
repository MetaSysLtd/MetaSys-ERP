import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  /**
   * Whether the select is in an error state
   */
  error?: boolean;
  
  /**
   * Error message to display
   */
  errorMessage?: string;
}

const Select = ({ error, errorMessage, ...props }: SelectProps) => {
  // Pass the error state to the context for use in trigger component
  return (
    <SelectPrimitive.Root {...props} />
  )
}

interface SelectGroupProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group> {
  /**
   * Label for the group of options
   */
  label?: string;
}

const SelectGroup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Group>,
  SelectGroupProps
>(({ className, children, label, ...props }, ref) => (
  <SelectPrimitive.Group ref={ref} className={cn("py-1.5", className)} {...props}>
    {label && <SelectPrimitive.Label className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{label}</SelectPrimitive.Label>}
    {children}
  </SelectPrimitive.Group>
))
SelectGroup.displayName = "SelectGroup"

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Value 
    ref={ref} 
    className={cn("line-clamp-1", className)} 
    {...props} 
  />
))
SelectValue.displayName = "SelectValue"

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  /**
   * Whether the select is in an error state
   */
  error?: boolean;
  
  /**
   * Error message to display
   */
  errorMessage?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, error, errorMessage, required, ...props }, ref) => {
  // Create a unique ID for linking with error message
  const id = React.useId();
  const errorId = error && errorMessage ? `${id}-error` : undefined;
  
  return (
    <div className="relative w-full">
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm shadow-sm",
          "ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
          "focus:border-[#025E73] focus:shadow-[0_0_0_1px_rgba(2,94,115,0.1)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50 [&>span]:line-clamp-1",
          error 
            ? "border-destructive ring-destructive text-destructive" 
            : "border-input",
          "dark:bg-gray-800 dark:border-gray-700 dark:placeholder:text-gray-500 dark:focus:border-[#64D2E5]",
          className
        )}
        aria-roledescription="Dropdown selector"
        aria-invalid={error ? true : undefined}
        aria-errormessage={errorId}
        aria-required={required}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      
      {error && errorMessage && (
        <div 
          id={errorId}
          className="text-xs text-destructive mt-1 flex items-center gap-1" 
          role="alert"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  /**
   * Optional description to provide more context about the option
   */
  description?: string;
  
  /**
   * Icon to display alongside the option text
   */
  icon?: React.ReactNode;
  
  /**
   * Indicates if this is a preferred or recommended option
   */
  recommended?: boolean;
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, description, icon, recommended, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
      "focus:bg-[#025E73]/10 focus:text-[#025E73] data-[highlighted]:bg-[#025E73]/10 data-[highlighted]:text-[#025E73]",
      "focus-visible:ring-1 focus-visible:ring-[#F2A71B] focus-visible:ring-offset-1",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "dark:focus:bg-[#025E73]/20 dark:focus:text-[#64D2E5] dark:data-[highlighted]:bg-[#025E73]/20 dark:data-[highlighted]:text-[#64D2E5]",
      recommended && "border-l-2 border-[#F2A71B]",
      className
    )}
    role="option"
    aria-selected={props.value === props['data-value']}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {icon && <span className="mr-1">{icon}</span>}
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {recommended && (
          <span className="ml-1 text-xs text-[#F2A71B] dark:text-[#F2A71B]" role="note">Recommended</span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
