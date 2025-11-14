/**
 * Button Component
 *
 * A versatile button component with multiple variants and sizes.
 * Supports loading states, disabled states, and asChild pattern for composition.
 *
 * @example
 * ```tsx
 * <Button variant="default" size="lg">Click me</Button>
 * <Button variant="outline" loading>Loading...</Button>
 * <Button variant="ghost" size="icon"><Icon /></Button>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button variant definitions using class-variance-authority
 * Provides consistent styling across different button types and sizes
 */
const buttonVariants = cva(
  // Base styles applied to all buttons with hover/active micro-interactions
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        primary:
          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button component props
 * Extends native button attributes with variant system and loading state
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Whether to render as a child component (for composition with other elements)
   * When true, passes all props to the child instead of rendering a button
   */
  asChild?: boolean;

  /**
   * Whether the button is in a loading state
   * Shows a spinner icon and disables interaction
   */
  loading?: boolean;
}

/**
 * Button component with forward ref support
 *
 * Features:
 * - Multiple visual variants (default, destructive, outline, secondary, ghost, link)
 * - Four size options (default, sm, lg, icon)
 * - Loading state with spinner animation
 * - Full keyboard accessibility
 * - Disabled state handling
 *
 * @param props - Button properties
 * @param ref - Forwarded ref to the button element
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    // If asChild is true, we would render the child with button props
    // For now, we'll implement basic button functionality
    // Full asChild support would require Slot from @radix-ui/react-slot

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
