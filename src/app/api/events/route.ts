/**
 * API Route: /api/events
 *
 * Handles calendar event operations:
 * - GET: List all events (with optional filters)
 * - POST: Create a new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

const VALID_STATUSES = ['company', 'available', 'school', 'unavailable', 'vacation'] as const;

/**
 * GET /api/events
 * Returns events with optional filters
 *
 * Query parameters:
 * - memberId?: string (filter by member)
 * - startDate?: string (ISO date, filter events that overlap with date range)
 * - endDate?: string (ISO date, filter events that overlap with date range)
 * - isImported?: boolean (filter imported events only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const isImportedParam = searchParams.get('isImported');

    let query = supabase
      .from(TABLES.CALENDAR_EVENTS)
      .select('*')
      .order('start_date', { ascending: true });

    // Filter by member if provided
    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    // Filter by imported flag if provided
    if (isImportedParam !== null) {
      const isImported = isImportedParam === 'true';
      query = query.eq('is_imported', isImported);
    }

    // Filter by date range if both dates provided
    // Logic: event overlaps with [startDate, endDate] if:
    //   event.start_date <= endDate AND event.end_date >= startDate
    if (startDateParam && endDateParam) {
      try {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          query = query
            .lte('start_date', endDate.toISOString())
            .gte('end_date', startDate.toISOString());
        }
      } catch (error) {
        // Invalid dates, ignore filter
        console.warn('Invalid date parameters:', error);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }

    // Convert database dates to Date objects for consistency
    const events = (data || []).map((event) => ({
      ...event,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
    }));

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Creates a new calendar event
 *
 * Request body:
 * {
 *   memberId: string (required, UUID)
 *   startDate: string (required, ISO date)
 *   endDate: string (required, ISO date)
 *   status: 'available' | 'school' | 'unavailable' | 'vacation' (required)
 *   note?: string (optional)
 *   isImported?: boolean (optional, default: false)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation: memberId
    if (!body.memberId || typeof body.memberId !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'memberId is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.memberId)) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'memberId must be a valid UUID' },
        { status: 400 }
      );
    }

    // Validation: startDate
    if (!body.startDate) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'startDate is required' },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'startDate must be a valid ISO date' },
        { status: 400 }
      );
    }

    // Validation: endDate
    if (!body.endDate) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'endDate is required' },
        { status: 400 }
      );
    }

    const endDate = new Date(body.endDate);
    if (isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'endDate must be a valid ISO date' },
        { status: 400 }
      );
    }

    // Validation: date range
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'endDate must be after or equal to startDate' },
        { status: 400 }
      );
    }

    // Validation: status
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if member exists
    const { data: member, error: memberError } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .select('id')
      .eq('id', body.memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found', details: `No member found with ID: ${body.memberId}` },
        { status: 404 }
      );
    }

    // Normalize dates (start of day / end of day)
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = endOfDay(endDate);

    // Insert event
    const { data, error } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .insert({
        member_id: body.memberId,
        start_date: normalizedStartDate.toISOString(),
        end_date: normalizedEndDate.toISOString(),
        status: body.status,
        note: body.note || null,
        is_imported: body.isImported || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create event', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        event: {
          ...data,
          startDate: new Date(data.start_date),
          endDate: new Date(data.end_date),
        },
        message: 'Event created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/events:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
