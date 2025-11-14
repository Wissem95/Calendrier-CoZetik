/**
 * API Route: /api/events/member/[memberId]
 *
 * GET: Fetch all events for a specific member with optional date filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase/client';

/**
 * GET /api/events/member/:memberId
 * Returns all events for a specific member
 *
 * Query parameters:
 * - startDate?: string (ISO date, filter events that overlap with date range)
 * - endDate?: string (ISO date, filter events that overlap with date range)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;

    // Validate UUID format
    if (!memberId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID format' },
        { status: 400 }
      );
    }

    // Check if member exists
    const { data: member, error: memberError } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .select('id, name')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from(TABLES.CALENDAR_EVENTS)
      .select('*')
      .eq('member_id', memberId)
      .order('start_date', { ascending: true });

    // Filter by date range if both dates provided
    if (startDateParam && endDateParam) {
      try {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          // Event overlaps with range if: event.start_date <= endDate AND event.end_date >= startDate
          query = query
            .lte('start_date', endDate.toISOString())
            .gte('end_date', startDate.toISOString());
        }
      } catch (error) {
        console.warn('Invalid date parameters:', error);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching member events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }

    // Convert database dates to Date objects
    const events = (data || []).map((event) => ({
      ...event,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
    }));

    return NextResponse.json(
      {
        member: {
          id: member.id,
          name: member.name,
        },
        events,
        count: events.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/events/member/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
