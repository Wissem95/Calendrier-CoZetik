/**
 * API Route: /api/events/[id]
 *
 * Handles individual event operations:
 * - PATCH: Update an event
 * - DELETE: Remove an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';

const VALID_STATUSES = ['company', 'available', 'school', 'unavailable', 'vacation'] as const;

/**
 * PATCH /api/events/:id
 * Updates an existing event
 *
 * Request body (all fields optional):
 * {
 *   memberId?: string
 *   startDate?: string (ISO date)
 *   endDate?: string (ISO date)
 *   status?: 'available' | 'school' | 'unavailable' | 'vacation'
 *   note?: string
 *   isImported?: boolean
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build update object
    const updates: any = {};

    // Validate memberId if provided
    if (body.memberId !== undefined) {
      if (typeof body.memberId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.memberId)) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'memberId must be a valid UUID' },
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
          { error: 'Member not found' },
          { status: 404 }
        );
      }

      updates.member_id = body.memberId;
    }

    // Validate and normalize startDate if provided
    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'startDate must be a valid ISO date' },
          { status: 400 }
        );
      }
      updates.start_date = startOfDay(startDate).toISOString();
    }

    // Validate and normalize endDate if provided
    if (body.endDate !== undefined) {
      const endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'endDate must be a valid ISO date' },
          { status: 400 }
        );
      }
      updates.end_date = endOfDay(endDate).toISOString();
    }

    // Validate date range if both dates are being updated
    if (updates.start_date && updates.end_date) {
      if (new Date(updates.end_date) < new Date(updates.start_date)) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'endDate must be after or equal to startDate' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: `status must be one of: ${VALID_STATUSES.join(', ')}`,
          },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    // Handle note
    if (body.note !== undefined) {
      updates.note = body.note || null;
    }

    // Handle isImported
    if (body.isImported !== undefined) {
      updates.is_imported = Boolean(body.isImported);
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Perform update
    const { data, error } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json(
        { error: 'Failed to update event', details: error.message },
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
        message: 'Event updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/events/[id]:', error);

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

/**
 * DELETE /api/events/:id
 * Deletes a calendar event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete event
    const { error } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json(
        { error: 'Failed to delete event', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Event deleted successfully',
        deletedEvent: {
          ...existingEvent,
          startDate: new Date(existingEvent.start_date),
          endDate: new Date(existingEvent.end_date),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/events/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
