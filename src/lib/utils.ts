/**
 * Team Calendar - Utility Functions
 *
 * Collection of reusable utility functions for the team calendar application.
 * Includes class merging, date formatting, color generation, and file operations.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 *
 * @param {...ClassValue[]} inputs - Class values to merge (strings, objects, arrays)
 * @returns {string} Merged and deduplicated class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // Conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date according to French locale standards
 *
 * @param {Date} date - The date to format
 * @param {'short' | 'long'} format - Format type
 *   - 'short': "25/01" (day/month)
 *   - 'long': "jeudi 25 janvier 2025" (weekday day month year)
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate(new Date('2025-01-25'), 'short') // Returns: "25/01"
 * formatDate(new Date('2025-01-25'), 'long') // Returns: "samedi 25 janvier 2025"
 */
export function formatDate(date: Date, format: 'short' | 'long'): string {
  if (format === 'short') {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }

  // Format long: "jeudi 25 janvier 2025"
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a date range as a compact string
 *
 * @param {Date} start - Start date of the range
 * @param {Date} end - End date of the range
 * @returns {string} Formatted date range (e.g., "25/01 - 31/01")
 *
 * @example
 * formatDateRange(new Date('2025-01-25'), new Date('2025-01-31'))
 * // Returns: "25/01 - 31/01"
 */
export function formatDateRange(start: Date, end: Date): string {
  const startFormatted = formatDate(start, 'short');
  const endFormatted = formatDate(end, 'short');
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Extract initials from a full name
 * Takes the first letter of the first two words
 *
 * @param {string} name - Full name to extract initials from
 * @returns {string} Uppercase initials (max 2 letters)
 *
 * @example
 * getInitials('Jean Dupont') // Returns: "JD"
 * getInitials('Marie') // Returns: "M"
 * getInitials('Jean-Pierre Martin') // Returns: "JM"
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return initials;
}

/**
 * Generate a color for a team member based on their index
 * Uses HSL color space for equitable distribution around the color wheel
 *
 * The function distributes colors evenly across the hue spectrum (0-360°)
 * using the formula: hue = (index / totalColors) * 360
 * This ensures maximum visual distinction between team members
 *
 * @param {number} index - Index of the member (0-based)
 * @param {number} totalColors - Total number of colors to distribute
 * @returns {string} HSL color string with 70% saturation and 60% lightness
 *
 * @example
 * generateMemberColor(0, 8) // Returns: "hsl(0, 70%, 60%)" (red)
 * generateMemberColor(1, 8) // Returns: "hsl(45, 70%, 60%)" (orange)
 * generateMemberColor(4, 8) // Returns: "hsl(180, 70%, 60%)" (cyan)
 */
export function generateMemberColor(index: number, totalColors: number): string {
  // Distribute hue evenly across the color wheel (0-360 degrees)
  const hue = Math.round((index / totalColors) * 360);

  // Use consistent saturation and lightness for visual harmony
  const saturation = 70; // Vibrant but not overwhelming
  const lightness = 60;  // Balanced brightness for readability

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Download a file to the user's device
 * Creates a temporary blob URL and triggers a download
 *
 * @param {BlobPart} content - File content (string, ArrayBuffer, Blob, etc.)
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type of the file (e.g., 'text/csv', 'application/json')
 *
 * @example
 * downloadFile('Hello, World!', 'greeting.txt', 'text/plain')
 * downloadFile(jsonData, 'data.json', 'application/json')
 * downloadFile(csvContent, 'export.csv', 'text/csv')
 */
export function downloadFile(
  content: BlobPart,
  filename: string,
  mimeType: string
): void {
  // Create blob with specified MIME type
  const blob = new Blob([content], { type: mimeType });

  // Create temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup: remove link and revoke blob URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Check if two date ranges overlap
 * Returns true if there is any overlap between the two periods
 *
 * @param {Date} start1 - Start date of first period
 * @param {Date} end1 - End date of first period
 * @param {Date} start2 - Start date of second period
 * @param {Date} end2 - End date of second period
 * @returns {boolean} True if the date ranges overlap, false otherwise
 *
 * @example
 * datesOverlap(
 *   new Date('2025-01-10'),
 *   new Date('2025-01-20'),
 *   new Date('2025-01-15'),
 *   new Date('2025-01-25')
 * ) // Returns: true
 *
 * datesOverlap(
 *   new Date('2025-01-10'),
 *   new Date('2025-01-20'),
 *   new Date('2025-01-25'),
 *   new Date('2025-01-30')
 * ) // Returns: false
 */
export function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  // Two ranges overlap if start1 <= end2 AND start2 <= end1
  return start1 <= end2 && start2 <= end1;
}
