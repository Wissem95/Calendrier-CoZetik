/**
 * API Route: /api/members/[id]
 *
 * Handles individual team member operations:
 * - PATCH: Update a member
 * - DELETE: Remove a member (cascades to events and imports)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase/client';

/**
 * PATCH /api/members/:id
 * Updates an existing team member
 *
 * Request body (all fields optional):
 * {
 *   name?: string
 *   role?: string
 *   color?: string
 *   rotationPattern?: string
 *   avatar?: string
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
        { error: 'Invalid member ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build update object (only include provided fields)
    const updates: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'Name must be non-empty string' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.role !== undefined) {
      if (typeof body.role !== 'string' || body.role.trim().length === 0) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'Role must be non-empty string' },
          { status: 400 }
        );
      }
      updates.role = body.role.trim();
    }

    if (body.color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
        return NextResponse.json(
          { error: 'Validation failed', details: 'Color must be in hex format (#RRGGBB)' },
          { status: 400 }
        );
      }
      updates.color = body.color;
    }

    if (body.rotationPattern !== undefined) {
      if (typeof body.rotationPattern !== 'string') {
        return NextResponse.json(
          { error: 'Validation failed', details: 'Rotation pattern must be a string' },
          { status: 400 }
        );
      }
      updates.rotation_pattern = body.rotationPattern;
    }

    if (body.avatar !== undefined) {
      updates.avatar = body.avatar || null;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Check if member exists
    const { data: existingMember, error: checkError } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Perform update
    const { data, error } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json(
        { error: 'Failed to update member', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { member: data, message: 'Member updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/members/[id]:', error);

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
 * DELETE /api/members/:id
 * Deletes a team member and all associated events and imports (cascade)
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
        { error: 'Invalid member ID format' },
        { status: 400 }
      );
    }

    // Check if member exists
    const { data: existingMember, error: checkError } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .select('id, name')
      .eq('id', id)
      .single();

    if (checkError || !existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Delete member (cascade will handle events and imports)
    const { error } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting member:', error);
      return NextResponse.json(
        { error: 'Failed to delete member', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Member deleted successfully',
        deletedMember: existingMember,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/members/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
