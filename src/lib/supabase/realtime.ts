/**
 * Supabase Realtime Hooks
 *
 * Provides React hooks for real-time synchronization of members and events.
 * Automatically updates Zustand store when database changes occur.
 */

import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, TABLES } from './client';
import { useCalendarStore } from '../store';
import { TeamMember, CalendarEvent } from '../types';

/**
 * Hook: useRealtimeMembers
 *
 * Subscribes to real-time updates on the team_members table.
 * Automatically updates the Zustand store when members are:
 * - Inserted (new member added)
 * - Updated (member modified)
 * - Deleted (member removed)
 *
 * @param enabled - Whether to activate the subscription (default: true)
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useRealtimeMembers(true);
 *   // Component automatically re-renders when members change
 * }
 * ```
 */
export function useRealtimeMembers(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return; // Skip subscription if not enabled

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      console.log('🔄 Setting up realtime subscription for members...');

      // Subscribe to all changes on team_members table
      channel = supabase
        .channel('team_members_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: TABLES.TEAM_MEMBERS,
          },
          (payload) => {
            console.log('📡 Realtime event (members):', payload.eventType, payload);

            const store = useCalendarStore.getState();

            switch (payload.eventType) {
              case 'INSERT': {
                // New member added
                const newMember: TeamMember = {
                  id: payload.new.id,
                  name: payload.new.name,
                  role: payload.new.role,
                  color: payload.new.color,
                  rotationPattern: payload.new.rotation_pattern,
                  avatar: payload.new.avatar,
                };

                // Check if member already exists (avoid duplicates from optimistic updates)
                const exists = store.members.some((m) => m.id === newMember.id);
                if (!exists) {
                  useCalendarStore.setState({
                    members: [...store.members, newMember],
                  });
                  console.log('✅ Member added via realtime:', newMember.name);
                }
                break;
              }

              case 'UPDATE': {
                // Member updated
                const updatedMember: TeamMember = {
                  id: payload.new.id,
                  name: payload.new.name,
                  role: payload.new.role,
                  color: payload.new.color,
                  rotationPattern: payload.new.rotation_pattern,
                  avatar: payload.new.avatar,
                };

                useCalendarStore.setState({
                  members: store.members.map((member) =>
                    member.id === updatedMember.id ? updatedMember : member
                  ),
                });
                console.log('✅ Member updated via realtime:', updatedMember.name);
                break;
              }

              case 'DELETE': {
                // Member deleted
                const deletedId = payload.old.id;

                useCalendarStore.setState({
                  members: store.members.filter((member) => member.id !== deletedId),
                  // Also remove associated events (cascade)
                  events: store.events.filter((event) => event.memberId !== deletedId),
                });
                console.log('✅ Member deleted via realtime:', deletedId);
                break;
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Members subscription status:', status);
        });
    };

    setupSubscription();

    // Cleanup: unsubscribe on unmount
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from members changes');
        supabase.removeChannel(channel);
      }
    };
  }, [enabled]);
}

/**
 * Hook: useRealtimeEvents
 *
 * Subscribes to real-time updates on the calendar_events table.
 * Automatically updates the Zustand store when events are:
 * - Inserted (new event added)
 * - Updated (event modified)
 * - Deleted (event removed)
 *
 * @param enabled - Whether to activate the subscription (default: true)
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useRealtimeEvents(true);
 *   // Component automatically re-renders when events change
 * }
 * ```
 */
export function useRealtimeEvents(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return; // Skip subscription if not enabled

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      console.log('🔄 Setting up realtime subscription for events...');

      // Subscribe to all changes on calendar_events table
      channel = supabase
        .channel('calendar_events_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: TABLES.CALENDAR_EVENTS,
          },
          (payload) => {
            console.log('📡 Realtime event (events):', payload.eventType, payload);

            const store = useCalendarStore.getState();

            switch (payload.eventType) {
              case 'INSERT': {
                // New event added
                const newEvent: CalendarEvent = {
                  id: payload.new.id,
                  memberId: payload.new.member_id,
                  startDate: new Date(payload.new.start_date),
                  endDate: new Date(payload.new.end_date),
                  status: payload.new.status,
                  note: payload.new.note,
                  isImported: payload.new.is_imported,
                };

                // Check if event already exists (avoid duplicates from optimistic updates)
                const exists = store.events.some((e) => e.id === newEvent.id);
                if (!exists) {
                  useCalendarStore.setState({
                    events: [...store.events, newEvent],
                  });
                  console.log('✅ Event added via realtime:', newEvent.id);
                }
                break;
              }

              case 'UPDATE': {
                // Event updated
                const updatedEvent: CalendarEvent = {
                  id: payload.new.id,
                  memberId: payload.new.member_id,
                  startDate: new Date(payload.new.start_date),
                  endDate: new Date(payload.new.end_date),
                  status: payload.new.status,
                  note: payload.new.note,
                  isImported: payload.new.is_imported,
                };

                useCalendarStore.setState({
                  events: store.events.map((event) =>
                    event.id === updatedEvent.id ? updatedEvent : event
                  ),
                });
                console.log('✅ Event updated via realtime:', updatedEvent.id);
                break;
              }

              case 'DELETE': {
                // Event deleted
                const deletedId = payload.old.id;

                useCalendarStore.setState({
                  events: store.events.filter((event) => event.id !== deletedId),
                });
                console.log('✅ Event deleted via realtime:', deletedId);
                break;
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Events subscription status:', status);
        });
    };

    setupSubscription();

    // Cleanup: unsubscribe on unmount
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from events changes');
        supabase.removeChannel(channel);
      }
    };
  }, [enabled]);
}

/**
 * Hook: useRealtimeImports (Optional)
 *
 * Subscribes to real-time updates on the imported_calendars table.
 * Can be used to show import history in real-time.
 *
 * @param enabled - Whether to activate the subscription (default: true)
 *
 * Usage:
 * ```tsx
 * function ImportHistory() {
 *   useRealtimeImports(true);
 *   const imports = useCalendarStore(state => state.importedCalendars);
 * }
 * ```
 */
export function useRealtimeImports(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return; // Skip subscription if not enabled

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      console.log('🔄 Setting up realtime subscription for imports...');

      channel = supabase
        .channel('imported_calendars_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLES.IMPORTED_CALENDARS,
          },
          (payload) => {
            console.log('📡 Realtime event (imports):', payload.eventType, payload);

            const store = useCalendarStore.getState();

            switch (payload.eventType) {
              case 'INSERT': {
                const newImport = {
                  memberId: payload.new.member_id,
                  fileName: payload.new.file_name,
                  fileType: payload.new.file_type,
                  uploadDate: new Date(payload.new.upload_date),
                  events: [], // Events will come through events subscription
                };

                useCalendarStore.setState({
                  importedCalendars: [...store.importedCalendars, newImport],
                });
                console.log('✅ Import added via realtime:', newImport.fileName);
                break;
              }

              case 'DELETE': {
                const deletedFileName = payload.old.file_name;
                const deletedMemberId = payload.old.member_id;

                useCalendarStore.setState({
                  importedCalendars: store.importedCalendars.filter(
                    (imp) =>
                      !(imp.memberId === deletedMemberId && imp.fileName === deletedFileName)
                  ),
                });
                console.log('✅ Import deleted via realtime:', deletedFileName);
                break;
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Imports subscription status:', status);
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from imports changes');
        supabase.removeChannel(channel);
      }
    };
  }, [enabled]);
}

/**
 * Combined hook for convenience
 *
 * Subscribes to all realtime updates (members + events + imports).
 * Use this in your main App or Page component.
 *
 * @param enabled - Whether to activate all subscriptions (default: true)
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useRealtimeSync(true);
 *   // All realtime subscriptions active
 * }
 * ```
 */
export function useRealtimeSync(enabled: boolean = true) {
  useRealtimeMembers(enabled);
  useRealtimeEvents(enabled);
  useRealtimeImports(enabled);
}
