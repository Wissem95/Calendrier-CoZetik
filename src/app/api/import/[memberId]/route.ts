/**
 * API Route: /api/import/[memberId]
 *
 * GET: List all imports for a member
 * DELETE: Remove import and its events (query param: fileName)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES, BUCKETS } from '@/lib/supabase/client';

/**
 * GET /api/import/:memberId
 * Returns all imported calendars for a specific member
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

    // Fetch imports
    const { data, error } = await supabase
      .from(TABLES.IMPORTED_CALENDARS)
      .select('*')
      .eq('member_id', memberId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching imports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch imports', details: error.message },
        { status: 500 }
      );
    }

    // For each import, count associated events
    const importsWithCounts = await Promise.all(
      (data || []).map(async (importRecord) => {
        const { count } = await supabase
          .from(TABLES.CALENDAR_EVENTS)
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('is_imported', true);

        return {
          ...importRecord,
          eventsCount: count || 0,
        };
      })
    );

    return NextResponse.json(
      {
        member: {
          id: member.id,
          name: member.name,
        },
        imports: importsWithCounts,
        totalImports: importsWithCounts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/import/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/import/:memberId?fileName=xxx
 * Deletes an imported calendar and optionally its events
 *
 * Query parameters:
 * - fileName: string (required) - Name of the file to delete
 * - deleteEvents: boolean (optional, default: true) - Whether to delete associated events
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const { memberId } = params;
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const deleteEventsParam = searchParams.get('deleteEvents');
    const deleteEvents = deleteEventsParam !== 'false'; // Default: true

    // Validate UUID format
    if (!memberId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID format' },
        { status: 400 }
      );
    }

    // Validate fileName
    if (!fileName) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'fileName query parameter is required' },
        { status: 400 }
      );
    }

    // Check if import exists
    const { data: importRecord, error: checkError } = await supabase
      .from(TABLES.IMPORTED_CALENDARS)
      .select('*')
      .eq('member_id', memberId)
      .eq('file_name', fileName)
      .single();

    if (checkError || !importRecord) {
      return NextResponse.json(
        { error: 'Import not found' },
        { status: 404 }
      );
    }

    // Delete events if requested
    let deletedEventsCount = 0;
    if (deleteEvents) {
      const { data: deletedEvents, error: deleteEventsError } = await supabase
        .from(TABLES.CALENDAR_EVENTS)
        .delete()
        .eq('member_id', memberId)
        .eq('is_imported', true)
        .select('id');

      if (deleteEventsError) {
        console.error('Error deleting events:', deleteEventsError);
        return NextResponse.json(
          { error: 'Failed to delete events', details: deleteEventsError.message },
          { status: 500 }
        );
      }

      deletedEventsCount = deletedEvents?.length || 0;
    }

    // Delete file from storage (if exists)
    if (importRecord.file_url) {
      try {
        // Extract file path from URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/calendar-files/path
        const urlParts = importRecord.file_url.split('/calendar-files/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];

          const { error: storageError } = await supabase
            .storage
            .from(BUCKETS.CALENDAR_FILES)
            .remove([filePath]);

          if (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue anyway (non-critical)
          }
        }
      } catch (storageError) {
        console.error('Error parsing file URL for deletion:', storageError);
        // Continue anyway (non-critical)
      }
    }

    // Delete import record
    const { error: deleteImportError } = await supabase
      .from(TABLES.IMPORTED_CALENDARS)
      .delete()
      .eq('id', importRecord.id);

    if (deleteImportError) {
      console.error('Error deleting import record:', deleteImportError);
      return NextResponse.json(
        { error: 'Failed to delete import record', details: deleteImportError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Import deleted successfully',
        deletedImport: {
          fileName: importRecord.file_name,
          fileType: importRecord.file_type,
          uploadDate: importRecord.upload_date,
        },
        deletedEventsCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/import/[memberId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
