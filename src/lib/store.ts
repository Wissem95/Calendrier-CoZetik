/**
 * Team Calendar - Zustand Store with Supabase API Integration
 *
 * Migrated from localStorage to Supabase backend.
 * All mutations now go through API routes.
 * Local state is synced with database via API calls and Realtime subscriptions.
 */

import { create } from 'zustand';
import {
  CalendarStore,
  TeamMember,
  CalendarEvent,
  ImportedCalendar,
  AvailabilityStatus,
  WeekSummary,
} from './types';
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  getWeek,
  getWeekYear,
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * API helper: generic fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.details || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Main calendar store (no persist middleware)
 * State is loaded from API on mount and synced via Realtime
 */
export const useCalendarStore = create<CalendarStore>()((set, get) => ({
  // ========== Initial State ==========

  members: [],
  events: [],
  importedCalendars: [],
  selectedWeek: new Date(),

  // ========== Member Actions (API-backed) ==========

  /**
   * Add a new team member via API
   */
  addMember: async (member) => {
    try {
      const response = await apiFetch<{ member: any }>('/api/members', {
        method: 'POST',
        body: JSON.stringify({
          name: member.name,
          role: member.role,
          rotationPattern: member.rotationPattern,
          color: member.color,
          avatar: member.avatar,
        }),
      });

      // Convert snake_case from DB to camelCase for frontend
      const newMember: TeamMember = {
        id: response.member.id,
        name: response.member.name,
        role: response.member.role,
        color: response.member.color,
        rotationPattern: response.member.rotation_pattern,
        avatar: response.member.avatar,
      };

      // Optimistic update: add to local state immediately
      set((state) => ({
        members: [...state.members, newMember],
      }));

      return newMember;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  },

  /**
   * Update an existing team member via API
   */
  updateMember: async (id, updates) => {
    try {
      // Convert camelCase to snake_case for API
      const apiUpdates: any = {};
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.role !== undefined) apiUpdates.role = updates.role;
      if (updates.color !== undefined) apiUpdates.color = updates.color;
      if (updates.rotationPattern !== undefined) {
        apiUpdates.rotationPattern = updates.rotationPattern;
      }
      if (updates.avatar !== undefined) apiUpdates.avatar = updates.avatar;

      const response = await apiFetch<{ member: any }>(`/api/members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(apiUpdates),
      });

      // Convert response to camelCase
      const updatedMember: TeamMember = {
        id: response.member.id,
        name: response.member.name,
        role: response.member.role,
        color: response.member.color,
        rotationPattern: response.member.rotation_pattern,
        avatar: response.member.avatar,
      };

      // Update local state
      set((state) => ({
        members: state.members.map((member) =>
          member.id === id ? updatedMember : member
        ),
      }));

      return updatedMember;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  /**
   * Remove a team member via API (cascades to events and imports)
   */
  removeMember: async (id) => {
    try {
      await apiFetch(`/api/members/${id}`, {
        method: 'DELETE',
      });

      // Remove from local state (cascade handled by API/DB)
      set((state) => ({
        members: state.members.filter((member) => member.id !== id),
        events: state.events.filter((event) => event.memberId !== id),
        importedCalendars: state.importedCalendars.filter(
          (calendar) => calendar.memberId !== id
        ),
      }));
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  // ========== Event Actions (API-backed) ==========

  /**
   * Add a new calendar event via API
   */
  addEvent: async (event) => {
    try {
      const response = await apiFetch<{ event: any }>('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          memberId: event.memberId,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          status: event.status,
          note: event.note,
          isImported: event.isImported || false,
        }),
      });

      // Convert response to camelCase with Date objects
      const newEvent: CalendarEvent = {
        id: response.event.id,
        memberId: response.event.member_id,
        startDate: new Date(response.event.startDate || response.event.start_date),
        endDate: new Date(response.event.endDate || response.event.end_date),
        status: response.event.status,
        note: response.event.note,
        isImported: response.event.is_imported || response.event.isImported,
      };

      // Add to local state
      set((state) => ({
        events: [...state.events, newEvent],
      }));

      return newEvent;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  },

  /**
   * Update an existing calendar event via API
   */
  updateEvent: async (id, updates) => {
    try {
      // Convert camelCase to API format
      const apiUpdates: any = {};
      if (updates.memberId !== undefined) apiUpdates.memberId = updates.memberId;
      if (updates.startDate !== undefined) {
        apiUpdates.startDate = updates.startDate.toISOString();
      }
      if (updates.endDate !== undefined) {
        apiUpdates.endDate = updates.endDate.toISOString();
      }
      if (updates.status !== undefined) apiUpdates.status = updates.status;
      if (updates.note !== undefined) apiUpdates.note = updates.note;
      if (updates.isImported !== undefined) apiUpdates.isImported = updates.isImported;

      const response = await apiFetch<{ event: any }>(`/api/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(apiUpdates),
      });

      // Convert response
      const updatedEvent: CalendarEvent = {
        id: response.event.id,
        memberId: response.event.member_id,
        startDate: new Date(response.event.startDate || response.event.start_date),
        endDate: new Date(response.event.endDate || response.event.end_date),
        status: response.event.status,
        note: response.event.note,
        isImported: response.event.is_imported || response.event.isImported,
      };

      // Update local state
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? updatedEvent : event
        ),
      }));

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  /**
   * Remove a calendar event via API
   */
  removeEvent: async (id) => {
    try {
      await apiFetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      // Remove from local state
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
      }));
    } catch (error) {
      console.error('Error removing event:', error);
      throw error;
    }
  },

  // ========== Import Actions (API-backed) ==========

  /**
   * Import a calendar file via API
   * Handles upload, parsing, and event creation
   */
  importCalendar: async (calendar) => {
    try {
      // For file imports, we need to use FormData
      // This will be called from CalendarUpload component with a File object
      // The component will handle the FormData and file upload directly

      // This method is kept for compatibility but won't be used directly
      // Instead, components will call the API directly for file uploads

      console.warn('importCalendar: Use direct API call for file uploads');

      // Add to local state (events should already be there from API response)
      set((state) => {
        // Remove old imported events from this member
        const eventsWithoutOldImports = state.events.filter(
          (event) => !(event.memberId === calendar.memberId && event.isImported)
        );

        // Add new events
        const newEvents = calendar.events.map((event) => ({
          ...event,
          isImported: true,
        }));

        // Update calendars list
        const calendarsWithoutOld = state.importedCalendars.filter(
          (c) => c.memberId !== calendar.memberId
        );

        return {
          events: [...eventsWithoutOldImports, ...newEvents],
          importedCalendars: [...calendarsWithoutOld, calendar],
        };
      });
    } catch (error) {
      console.error('Error importing calendar:', error);
      throw error;
    }
  },

  /**
   * Remove an imported calendar via API
   */
  removeImportedCalendar: async (memberId, fileName, deleteEvents = true) => {
    try {
      await apiFetch(
        `/api/import/${memberId}?fileName=${encodeURIComponent(fileName)}&deleteEvents=${deleteEvents}`,
        {
          method: 'DELETE',
        }
      );

      // Update local state
      set((state) => ({
        importedCalendars: state.importedCalendars.filter(
          (calendar) =>
            !(calendar.memberId === memberId && calendar.fileName === fileName)
        ),
        events: deleteEvents
          ? state.events.filter(
              (event) => !(event.memberId === memberId && event.isImported)
            )
          : state.events,
      }));
    } catch (error) {
      console.error('Error removing imported calendar:', error);
      throw error;
    }
  },

  // ========== Navigation Actions (local only) ==========

  /**
   * Set the currently selected week (normalized to Monday)
   */
  setSelectedWeek: (date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1, locale: fr });
    set({ selectedWeek: weekStart });
  },

  /**
   * Navigate to the current week (today)
   */
  goToToday: () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1, locale: fr });
    set({ selectedWeek: weekStart });
  },

  // ========== Helper Methods (local calculations) ==========

  /**
   * Get all events for a specific team member within a date range
   */
  getEventsForMember: (memberId: string, startDate?: Date, endDate?: Date) => {
    const { events } = get();

    if (!startDate || !endDate) {
      return events.filter((event) => event.memberId === memberId);
    }

    return events.filter((event) => {
      if (event.memberId !== memberId) return false;

      const eventStart = startOfDay(event.startDate);
      const eventEnd = startOfDay(event.endDate);
      const rangeStart = startOfDay(startDate);
      const rangeEnd = startOfDay(endDate);

      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    });
  },

  /**
   * Get a summary of team availability for a specific week
   */
  getWeekSummary: (weekStart) => {
    const { members } = get();
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1, locale: fr });

    const summary: WeekSummary = {
      weekNumber: getWeek(weekStart, { weekStartsOn: 1, locale: fr }),
      year: getWeekYear(weekStart, { weekStartsOn: 1, locale: fr }),
      startDate: weekStart,
      endDate: weekEnd,
      availableMembers: [],
      unavailableMembers: [],
      schoolMembers: [],
    };

    members.forEach((member) => {
      const memberEvents = get().getEventsForMember(member.id, weekStart, weekEnd);

      if (memberEvents.length === 0) {
        summary.availableMembers.push(member);
        return;
      }

      // Count occurrences of each status
      const statusCounts = memberEvents.reduce(
        (acc, event) => {
          acc[event.status] = (acc[event.status] || 0) + 1;
          return acc;
        },
        {} as Record<AvailabilityStatus, number>
      );

      // Get the dominant status
      const dominantStatus = Object.entries(statusCounts).sort(
        ([, a], [, b]) => b - a
      )[0][0] as AvailabilityStatus;

      switch (dominantStatus) {
        case 'school':
          summary.schoolMembers.push(member);
          break;
        case 'unavailable':
        case 'vacation':
          summary.unavailableMembers.push(member);
          break;
        case 'available':
        default:
          summary.availableMembers.push(member);
      }
    });

    return summary;
  },

  /**
   * Get the current status of a team member for a specific date
   */
  getMemberStatus: (memberId, date) => {
    const { events } = get();
    const targetDate = startOfDay(date);

    const event = events.find((e) => {
      if (e.memberId !== memberId) return false;

      const eventStart = startOfDay(e.startDate);
      const eventEnd = startOfDay(e.endDate);

      return targetDate >= eventStart && targetDate <= eventEnd;
    });

    return event ? event.status : null;
  },
}));

/**
 * Load initial data from API
 * Call this once when the app mounts
 */
export async function loadInitialData() {
  try {
    // Load members
    const membersResponse = await apiFetch<{ members: any[] }>('/api/members');
    const members: TeamMember[] = membersResponse.members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      color: m.color,
      rotationPattern: m.rotation_pattern,
      avatar: m.avatar,
    }));

    // Load events
    const eventsResponse = await apiFetch<{ events: any[] }>('/api/events');
    const events: CalendarEvent[] = eventsResponse.events.map((e) => ({
      id: e.id,
      memberId: e.member_id,
      startDate: new Date(e.start_date || e.startDate),
      endDate: new Date(e.end_date || e.endDate),
      status: e.status,
      note: e.note,
      isImported: e.is_imported || e.isImported || false,
    }));

    // Update store
    useCalendarStore.setState({
      members,
      events,
    });

    console.log('✅ Initial data loaded:', {
      members: members.length,
      events: events.length,
    });
  } catch (error) {
    console.error('❌ Error loading initial data:', error);
    throw error;
  }
}
