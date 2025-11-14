/**
 * Team Calendar - Complete TypeScript Type Definitions
 *
 * This file contains all type definitions for the team calendar application.
 * Includes types for team members, events, imports, and the Zustand store.
 */

/**
 * Availability status for team members
 * @typedef {'available' | 'unavailable' | 'school' | 'vacation' | 'company'} AvailabilityStatus
 */
export type AvailabilityStatus = 'available' | 'unavailable' | 'school' | 'vacation' | 'company';

/**
 * Represents a team member in the calendar system
 * @interface TeamMember
 * @property {string} id - Unique identifier for the team member
 * @property {string} name - Display name of the team member
 * @property {string} role - Job role or position
 * @property {string} color - Hex color code for visual identification (e.g., '#3B82F6')
 * @property {string} [avatar] - Optional URL to avatar image
 * @property {string} rotationPattern - Work rotation pattern description (e.g., '2 weeks on, 1 week off')
 */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar?: string;
  rotationPattern: string;
}

/**
 * Represents a calendar event for a team member
 * @interface CalendarEvent
 * @property {string} id - Unique identifier for the event
 * @property {string} memberId - ID of the team member this event belongs to
 * @property {Date} startDate - Event start date and time
 * @property {Date} endDate - Event end date and time
 * @property {AvailabilityStatus} status - Availability status for this event
 * @property {string} [note] - Optional note or description for the event
 * @property {boolean} [isImported] - Whether this event was imported from a file
 */
export interface CalendarEvent {
  id: string;
  memberId: string;
  startDate: Date;
  endDate: Date;
  status: AvailabilityStatus;
  note?: string;
  isImported?: boolean;
}

/**
 * Represents an imported calendar file with its metadata
 * @interface ImportedCalendar
 * @property {string} memberId - ID of the team member this calendar belongs to
 * @property {string} fileName - Original name of the imported file
 * @property {'ics' | 'xlsx' | 'csv'} fileType - Type of the imported file
 * @property {Date} uploadDate - Date and time when the file was uploaded
 * @property {CalendarEvent[]} events - Array of events parsed from the file
 */
export interface ImportedCalendar {
  memberId: string;
  fileName: string;
  fileType: 'ics' | 'xlsx' | 'csv';
  uploadDate: Date;
  events: CalendarEvent[];
}

/**
 * Weekly summary of team availability
 * @interface WeekSummary
 * @property {number} weekNumber - ISO week number (1-53)
 * @property {number} year - Year of the week
 * @property {Date} startDate - Start date of the week (Monday)
 * @property {Date} endDate - End date of the week (Sunday)
 * @property {TeamMember[]} availableMembers - Members available during this week
 * @property {TeamMember[]} unavailableMembers - Members unavailable during this week
 * @property {TeamMember[]} schoolMembers - Members on school/training during this week
 */
export interface WeekSummary {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  availableMembers: TeamMember[];
  unavailableMembers: TeamMember[];
  schoolMembers: TeamMember[];
}

/**
 * Result of parsing an imported calendar file
 * @interface CalendarParseResult
 * @property {boolean} success - Whether the parsing was successful
 * @property {CalendarEvent[]} events - Array of successfully parsed events
 * @property {string[]} [errors] - Optional array of error messages
 * @property {string[]} [warnings] - Optional array of warning messages
 */
export interface CalendarParseResult {
  success: boolean;
  events: CalendarEvent[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Zustand store interface for calendar state management
 * Contains all state, actions, and helper methods for the calendar application
 * @interface CalendarStore
 */
export interface CalendarStore {
  // ========== State ==========

  /**
   * Array of all team members
   */
  members: TeamMember[];

  /**
   * Array of all calendar events
   */
  events: CalendarEvent[];

  /**
   * Array of all imported calendars with their metadata
   */
  importedCalendars: ImportedCalendar[];

  /**
   * Currently selected week (Date representing the start of the week)
   */
  selectedWeek: Date;

  // ========== Member Actions ==========

  /**
   * Add a new team member
   * @param {TeamMember} member - The team member to add
   */
  addMember: (member: TeamMember) => void;

  /**
   * Update an existing team member
   * @param {string} id - ID of the member to update
   * @param {Partial<TeamMember>} updates - Partial member object with fields to update
   */
  updateMember: (id: string, updates: Partial<TeamMember>) => void;

  /**
   * Remove a team member and all their associated events
   * @param {string} id - ID of the member to remove
   */
  removeMember: (id: string) => void;

  // ========== Event Actions ==========

  /**
   * Add a new calendar event
   * @param {CalendarEvent} event - The event to add
   */
  addEvent: (event: CalendarEvent) => void;

  /**
   * Update an existing calendar event
   * @param {string} id - ID of the event to update
   * @param {Partial<CalendarEvent>} updates - Partial event object with fields to update
   */
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;

  /**
   * Remove a calendar event
   * @param {string} id - ID of the event to remove
   */
  removeEvent: (id: string) => void;

  // ========== Import Actions ==========

  /**
   * Import a calendar file and add its events
   * @param {ImportedCalendar} calendar - The imported calendar with its events
   */
  importCalendar: (calendar: ImportedCalendar) => void;

  /**
   * Remove an imported calendar and optionally delete its events
   * @param {string} memberId - ID of the member whose calendar to remove
   * @param {string} fileName - Name of the file to remove
   * @param {boolean} deleteEvents - Whether to delete associated events
   */
  removeImportedCalendar: (memberId: string, fileName: string, deleteEvents: boolean) => void;

  // ========== Navigation Actions ==========

  /**
   * Set the currently selected week
   * @param {Date} date - Date within the week to select
   */
  setSelectedWeek: (date: Date) => void;

  /**
   * Navigate to the current week (today)
   */
  goToToday: () => void;

  // ========== Helper Methods ==========

  /**
   * Get all events for a specific team member
   * @param {string} memberId - ID of the team member
   * @param {Date} [startDate] - Optional start date for filtering
   * @param {Date} [endDate] - Optional end date for filtering
   * @returns {CalendarEvent[]} Array of events for the member
   */
  getEventsForMember: (memberId: string, startDate?: Date, endDate?: Date) => CalendarEvent[];

  /**
   * Get a summary of team availability for a specific week
   * @param {Date} weekStart - Start date of the week to summarize
   * @returns {WeekSummary} Summary of the week's availability
   */
  getWeekSummary: (weekStart: Date) => WeekSummary;

  /**
   * Get the current status of a team member for a specific date
   * @param {string} memberId - ID of the team member
   * @param {Date} date - Date to check status for
   * @returns {AvailabilityStatus | null} Current status or null if no event found
   */
  getMemberStatus: (memberId: string, date: Date) => AvailabilityStatus | null;
}

// ========== Constants ==========

/**
 * Color configuration for each availability status
 * Includes background, text, border colors and display label
 */
export const STATUS_COLORS: Record<AvailabilityStatus, {
  bg: string;
  text: string;
  border: string;
  label: string;
}> = {
  available: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Disponible'
  },
  unavailable: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Indisponible'
  },
  school: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'École'
  },
  vacation: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'Vacances'
  },
  company: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Entreprise'
  }
};

/**
 * Predefined color palette for team members
 * Array of 8 distinct hex colors for visual differentiation
 */
export const MEMBER_COLORS: string[] = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316'  // Orange
];
