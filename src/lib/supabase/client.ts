/**
 * Supabase Client Configuration
 *
 * Browser-side client for Supabase with public access (no authentication).
 * Used for accessing the team calendar database and storage.
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase client instance
 *
 * Configuration:
 * - No authentication (persistSession: false)
 * - Realtime enabled with throttling (10 events/second)
 * - Public access (RLS disabled on tables)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth, no session persistence
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Throttle realtime events
    },
  },
  db: {
    schema: 'public', // Default schema
  },
});

/**
 * Database table names (for type safety)
 */
export const TABLES = {
  TEAM_MEMBERS: 'team_members',
  CALENDAR_EVENTS: 'calendar_events',
  IMPORTED_CALENDARS: 'imported_calendars',
} as const;

/**
 * Storage bucket names
 */
export const BUCKETS = {
  CALENDAR_FILES: 'calendar-files',
} as const;

/**
 * Database types (auto-generated from Supabase schema)
 *
 * To regenerate:
 * npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
 */
export interface Database {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string;
          name: string;
          role: string;
          color: string;
          rotation_pattern: string;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          color: string;
          rotation_pattern: string;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          color?: string;
          rotation_pattern?: string;
          avatar?: string | null;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          member_id: string;
          start_date: string;
          end_date: string;
          status: 'available' | 'school' | 'unavailable' | 'vacation';
          note: string | null;
          is_imported: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          start_date: string;
          end_date: string;
          status: 'available' | 'school' | 'unavailable' | 'vacation';
          note?: string | null;
          is_imported?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          start_date?: string;
          end_date?: string;
          status?: 'available' | 'school' | 'unavailable' | 'vacation';
          note?: string | null;
          is_imported?: boolean;
          updated_at?: string;
        };
      };
      imported_calendars: {
        Row: {
          id: string;
          member_id: string;
          file_name: string;
          file_type: 'ics' | 'xlsx' | 'csv';
          file_url: string | null;
          upload_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          file_name: string;
          file_type: 'ics' | 'xlsx' | 'csv';
          file_url?: string | null;
          upload_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          file_name?: string;
          file_type?: 'ics' | 'xlsx' | 'csv';
          file_url?: string | null;
        };
      };
    };
  };
}
