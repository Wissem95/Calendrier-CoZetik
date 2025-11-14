/**
 * Card Component System
 *
 * A collection of composable card components for building content containers.
 * Follows a semantic structure with header, content, and footer sections.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Main content goes here
 *   </CardContent>
 *   <CardFooter>
 *     Footer content or actions
 *   </CardFooter>
 * </Card>
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card - Main container component
 *
 * The root card element with border, shadow, and rounded corners.
 * Provides the foundational structure for all card content.
 *
 * @param props - Extends all HTML div element props
 * @param ref - Forwarded ref to the div element
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-200',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

/**
 * CardHeader - Header section of the card
 *
 * Contains the title and optional description.
 * Typically used at the top of the card with appropriate spacing.
 *
 * @param props - Extends all HTML div element props
 * @param ref - Forwarded ref to the div element
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Title heading within the card header
 *
 * Primary heading for the card. Uses semantic h3 element by default.
 * Provides consistent typography and spacing.
 *
 * @param props - Extends all HTML heading element props
 * @param ref - Forwarded ref to the heading element
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Descriptive text within the card header
 *
 * Secondary text providing context or additional information about the card.
 * Uses muted color scheme for visual hierarchy.
 *
 * @param props - Extends all HTML paragraph element props
 * @param ref - Forwarded ref to the paragraph element
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Main content area of the card
 *
 * Primary content container with consistent padding.
 * Houses the main information or interactive elements of the card.
 *
 * @param props - Extends all HTML div element props
 * @param ref - Forwarded ref to the div element
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer section of the card
 *
 * Bottom section typically containing actions, buttons, or metadata.
 * Uses flexbox for horizontal layout with consistent spacing.
 *
 * @param props - Extends all HTML div element props
 * @param ref - Forwarded ref to the div element
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
