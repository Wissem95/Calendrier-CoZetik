/**
 * Dialog Component System
 *
 * A fully-featured modal dialog with animations, accessibility, and flexible composition.
 * Uses Framer Motion for smooth animations and React Portals for proper rendering.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Dialog open={isOpen} onOpenChange={setIsOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description text</DialogDescription>
 *     </DialogHeader>
 *     <DialogBody>
 *       Main content goes here
 *     </DialogBody>
 *     <DialogFooter>
 *       <Button onClick={() => setIsOpen(false)}>Close</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dialog root component props
 */
export interface DialogProps {
  /** Whether the dialog is open */
  open?: boolean;
  /** Callback when the open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Child elements (typically DialogContent) */
  children?: React.ReactNode;
}

/**
 * Dialog - Root container component
 *
 * Manages the open/close state and provides context to child components.
 * Uses React Portals to render outside the parent DOM hierarchy.
 *
 * @param props - Dialog properties
 */
export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogRoot>
  );
}

/**
 * Internal context for dialog state management
 */
interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
});

/**
 * Internal root component with context provider
 */
function DialogRoot({ open = false, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open: open ?? false, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

/**
 * Hook to access dialog context
 */
function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
}

/**
 * DialogContent props
 */
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show the close button */
  showCloseButton?: boolean;
}

/**
 * DialogContent - Main content container with overlay
 *
 * Features:
 * - Portal rendering for proper z-index stacking
 * - Animated backdrop with blur effect
 * - Fade and scale animations
 * - Escape key to close
 * - Click outside to close
 * - Focus trap (basic implementation)
 * - Scroll lock (prevents body scroll when open)
 *
 * @param props - Content properties
 * @param ref - Forwarded ref to the content div
 */
export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, showCloseButton = true, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false);

    // Ensure component is mounted (for portal)
    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // Handle Escape key press
    React.useEffect(() => {
      if (!open) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onOpenChange?.(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onOpenChange]);

    // Prevent body scroll when dialog is open
    React.useEffect(() => {
      if (!open) return;

      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }, [open]);

    // Focus trap - focus first focusable element when opened
    React.useEffect(() => {
      if (!open || !contentRef.current) return;

      const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      if (firstElement) {
        firstElement.focus();
      }
    }, [open]);

    // Handle backdrop click
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onOpenChange?.(false);
      }
    };

    if (!mounted) return null;

    const dialogContent = (
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            {/* Backdrop overlay with blur */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            />

            {/* Dialog content */}
            <motion.div
              ref={contentRef}
              className={cn(
                'relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg',
                className
              )}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
            >
              {children}

              {/* Close button */}
              {showCloseButton && (
                <button
                  onClick={() => onOpenChange?.(false)}
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );

    // Render in portal
    return createPortal(dialogContent, document.body);
  }
);
DialogContent.displayName = 'DialogContent';

/**
 * DialogHeader - Header section of the dialog
 *
 * Contains the title and optional description with proper spacing.
 *
 * @param props - Extends all HTML div element props
 */
export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}
DialogHeader.displayName = 'DialogHeader';

/**
 * DialogTitle - Title heading within the dialog
 *
 * Primary heading for the dialog. Uses semantic h2 element.
 *
 * @param props - Extends all HTML heading element props
 */
export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}
DialogTitle.displayName = 'DialogTitle';

/**
 * DialogDescription - Descriptive text within the dialog
 *
 * Secondary text providing context or instructions.
 *
 * @param props - Extends all HTML paragraph element props
 */
export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
DialogDescription.displayName = 'DialogDescription';

/**
 * DialogBody - Main content area of the dialog
 *
 * Primary content container for the dialog's main information.
 *
 * @param props - Extends all HTML div element props
 */
export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('py-4', className)} {...props} />
  );
}
DialogBody.displayName = 'DialogBody';

/**
 * DialogFooter - Footer section of the dialog
 *
 * Bottom section typically containing action buttons.
 *
 * @param props - Extends all HTML div element props
 */
export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  );
}
DialogFooter.displayName = 'DialogFooter';
