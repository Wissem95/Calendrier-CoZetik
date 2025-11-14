/**
 * API Route: /api/members
 *
 * Handles team member operations:
 * - GET: List all members
 * - POST: Create a new member
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase/client';
import { MEMBER_COLORS } from '@/lib/types';

/**
 * GET /api/members
 * Returns all team members sorted by creation date
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/members
 * Creates a new team member
 *
 * Request body:
 * {
 *   name: string (required)
 *   role: string (required)
 *   rotationPattern: string (required)
 *   color?: string (optional, auto-assigned if not provided)
 *   avatar?: string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Name is required and must be non-empty' },
        { status: 400 }
      );
    }

    if (!body.role || typeof body.role !== 'string' || body.role.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Role is required and must be non-empty' },
        { status: 400 }
      );
    }

    if (!body.rotationPattern || typeof body.rotationPattern !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Rotation pattern is required' },
        { status: 400 }
      );
    }

    // Auto-assign color if not provided
    let color = body.color;
    if (!color) {
      // Get current member count to determine next color
      const { count } = await supabase
        .from(TABLES.TEAM_MEMBERS)
        .select('*', { count: 'exact', head: true });

      const colorIndex = (count || 0) % MEMBER_COLORS.length;
      color = MEMBER_COLORS[colorIndex];
    }

    // Validate color format (must be hex)
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Color must be in hex format (#RRGGBB)' },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from(TABLES.TEAM_MEMBERS)
      .insert({
        name: body.name.trim(),
        role: body.role.trim(),
        color,
        rotation_pattern: body.rotationPattern,
        avatar: body.avatar || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return NextResponse.json(
        { error: 'Failed to create member', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { member: data, message: 'Member created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/members:', error);

    // Handle JSON parse errors
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
