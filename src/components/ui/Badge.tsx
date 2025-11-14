/**
 * Badge Component
 *
 * A compact label component for displaying status, categories, or counts.
 * Supports multiple color variants for different semantic meanings.
 *
 * @example
 * ```tsx
 * <Badge variant="default">New</Badge>
 * <Badge variant="success">Active</Badge>
 * <Badge variant="destructive">Error</Badge>
 * <Badge variant="warning">Pending</Badge>
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge variant definitions using class-variance-authority
 * Provides consistent styling across different badge types
 */
const badgeVariants = cva(
  // Base styles applied to all badges with hover brightness effect
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:brightness-110',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500 text-white shadow hover:bg-green-600',
        warning:
          'border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600',
        info:
          'border-transparent bg-blue-500 text-white shadow hover:bg-blue-600',
        purple:
          'border-transparent bg-purple-500 text-white shadow hover:bg-purple-600',
        orange:
          'border-transparent bg-orange-500 text-white shadow hover:bg-orange-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Badge component props
 * Extends native div attributes with variant system
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component
 *
 * A versatile label component for displaying statuses and categories.
 *
 * Variants:
 * - **default**: Primary brand color
 * - **secondary**: Muted secondary color
 * - **destructive**: Error or danger state (red)
 * - **outline**: Bordered with transparent background
 * - **success**: Positive state (green)
 * - **warning**: Caution state (yellow)
 * - **info**: Informational state (blue)
 *
 * Features:
 * - Rounded-full design for modern aesthetics
 * - Consistent text sizing (xs)
 * - Hover states for interactive badges
 * - Focus ring for accessibility
 * - Seamless integration with theme colors
 *
 * @param props - Badge properties including variant and HTML div attributes
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
