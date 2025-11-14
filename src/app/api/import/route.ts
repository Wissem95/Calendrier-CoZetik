/**
 * API Route: /api/import
 *
 * POST: Upload and import a calendar file (ICS, Excel, CSV)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, BUCKETS } from '@/lib/supabase/client';
import { parseCalendarFile } from '@/lib/calendarParser';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * POST /api/import
 * Upload a calendar file, parse it, and create events + import record
 *
 * Request: multipart/form-data
 * - memberId: string (UUID)
 * - file: File (ICS, Excel, or CSV)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const memberId = formData.get('memberId') as string;
    let file = formData.get('file') as File;

    // Validation: memberId
    if (!memberId || typeof memberId !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'memberId is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId)) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'memberId must be a valid UUID' },
        { status: 400 }
      );
    }

    // Validation: file
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!fileExtension || !['ics', 'xlsx', 'xls', 'csv'].includes(fileExtension)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: 'File type must be .ics, .xlsx, .xls, or .csv. PDF support is temporarily disabled.',
        },
        { status: 400 }
      );
    }

    // Normalize file type (xls → xlsx for storage)
    let fileType = fileExtension === 'xls' ? 'xlsx' : fileExtension;

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

    // Parse the calendar file
    console.log(`Parsing calendar file for member ${member.name}:`, fileName);
    const parseResult = await parseCalendarFile(file, memberId);

    if (!parseResult.success || parseResult.events.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to parse calendar file',
          details: parseResult.errors?.join(', ') || 'No events found in file',
          warnings: parseResult.warnings,
        },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    let fileUrl: string | null = null;

    try {
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);

      // Generate unique file path: memberId/timestamp_filename
      const timestamp = Date.now();
      const storagePath = `${memberId}/${timestamp}_${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(BUCKETS.CALENDAR_FILES)
        .upload(storagePath, fileData, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Continue without file URL (non-critical)
      } else {
        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from(BUCKETS.CALENDAR_FILES)
          .getPublicUrl(storagePath);

        fileUrl = publicUrlData.publicUrl;
      }
    } catch (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      // Continue without file URL (non-critical)
    }

    // Delete old imported events from this member
    console.log(`Deleting old imported events for member ${memberId}`);
    const { error: deleteEventsError } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .delete()
      .eq('member_id', memberId)
      .eq('is_imported', true);

    if (deleteEventsError) {
      console.error('Error deleting old imported events:', deleteEventsError);
      // Continue anyway (non-critical)
    }

    // Delete old import record
    const { error: deleteImportError } = await supabase
      .from(TABLES.IMPORTED_CALENDARS)
      .delete()
      .eq('member_id', memberId);

    if (deleteImportError) {
      console.error('Error deleting old import record:', deleteImportError);
      // Continue anyway (non-critical)
    }

    // Insert new events in batch
    console.log(`Inserting ${parseResult.events.length} new events`);
    const eventsToInsert = parseResult.events.map((event) => ({
      member_id: memberId,
      start_date: startOfDay(event.startDate).toISOString(),
      end_date: endOfDay(event.endDate).toISOString(),
      status: event.status,
      note: event.note || null,
      is_imported: true,
    }));

    const { data: insertedEvents, error: insertError } = await supabase
      .from(TABLES.CALENDAR_EVENTS)
      .insert(eventsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting events:', insertError);
      return NextResponse.json(
        { error: 'Failed to create events', details: insertError.message },
        { status: 500 }
      );
    }

    // Create import record
    const { data: importRecord, error: importRecordError } = await supabase
      .from(TABLES.IMPORTED_CALENDARS)
      .insert({
        member_id: memberId,
        file_name: fileName,
        file_type: fileType as 'ics' | 'xlsx' | 'csv',
        file_url: fileUrl,
      })
      .select()
      .single();

    if (importRecordError) {
      console.error('Error creating import record:', importRecordError);
      // Events are already created, so this is non-critical
    }

    return NextResponse.json(
      {
        message: 'Calendar imported successfully',
        import: importRecord,
        eventsCreated: insertedEvents?.length || 0,
        warnings: parseResult.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/import:', error);

    if (error instanceof Error && error.message.includes('form')) {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
