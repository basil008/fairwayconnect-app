import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET: Fetch scorecard for a course
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseName = searchParams.get('course');

    if (!courseName) {
      return NextResponse.json(
        { error: 'Missing course parameter' },
        { status: 400 }
      );
    }

    const db = getDb();
    const holes = await db.execute({
      sql: `SELECT hole_number, par, stroke_index 
            FROM course_scorecards 
            WHERE course_name = ?
            ORDER BY hole_number`,
      args: [courseName]
    });

    if (holes.rows.length === 0) {
      return NextResponse.json(
        { exists: false, message: 'No scorecard found' },
        { status: 404 }
      );
    }

    if (holes.rows.length !== 18) {
      return NextResponse.json(
        { exists: false, message: `Incomplete scorecard (${holes.rows.length}/18 holes)` },
        { status: 404 }
      );
    }

    const totalPar = holes.rows.reduce((sum: number, h: any) => sum + h.par, 0);

    // Fetch metadata if it exists
    let metadata = null;
    try {
      const metadataResult = await db.execute({
        sql: 'SELECT slope_rating, course_rating, tee_color FROM course_scorecard_metadata WHERE course_name = ?',
        args: [courseName]
      });
      if (metadataResult.rows.length > 0) {
        metadata = metadataResult.rows[0];
      }
    } catch (error) {
      // Table might not exist yet, that's ok
      console.log('No metadata table yet');
    }

    return NextResponse.json({
      exists: true,
      course: courseName,
      holes: holes.rows,
      totalPar,
      metadata
    });

  } catch (error) {
    console.error('Error fetching course scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard' },
      { status: 500 }
    );
  }
}

// POST: Save scorecard for a course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName, holes, metadata } = body;

    // Strict validation
    if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
      console.error('❌ Invalid courseName:', courseName);
      return NextResponse.json(
        { error: 'Invalid courseName: must be a non-empty string' },
        { status: 400 }
      );
    }
    
    if (!holes || !Array.isArray(holes) || holes.length !== 18) {
      console.error('❌ Invalid holes:', holes);
      return NextResponse.json(
        { error: 'Invalid request: need exactly 18 holes' },
        { status: 400 }
      );
    }

    // Validate metadata if provided
    if (metadata) {
      if (!metadata.slope_rating || !metadata.course_rating || !metadata.tee_color) {
        return NextResponse.json(
          { error: 'Metadata must include slope_rating, course_rating, and tee_color' },
          { status: 400 }
        );
      }
    }
    
    console.log('📥 Saving scorecard for:', courseName, 'with metadata:', metadata);

    const db = getDb();

    // Log what we're about to delete
    console.log('🗑️ DELETE query:', { courseName });
    
    // Check what exists before deleting
    const beforeDelete = await db.execute({
      sql: 'SELECT DISTINCT course_name FROM course_scorecards',
      args: []
    });
    console.log('📊 Before delete:', beforeDelete.rows);

    // Safety check: Verify courseName before deleting
    if (!courseName || courseName.trim() === '') {
      console.error('❌ ABORT: courseName is empty, refusing to delete');
      return NextResponse.json(
        { error: 'Cannot delete: courseName is empty' },
        { status: 400 }
      );
    }

    // Delete existing scorecard for this course ONLY
    const deleteResult = await db.execute({
      sql: 'DELETE FROM course_scorecards WHERE course_name = ?',
      args: [courseName]
    });
    console.log('✅ Deleted rows for:', courseName, 'Result:', deleteResult);
    
    // Check what remains after deleting
    const afterDelete = await db.execute({
      sql: 'SELECT DISTINCT course_name FROM course_scorecards',
      args: []
    });
    console.log('📊 After delete:', afterDelete.rows);

    // Insert new holes
    for (const hole of holes) {
      await db.execute({
        sql: `INSERT INTO course_scorecards 
              (id, course_name, hole_number, par, stroke_index)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          `cs-${courseName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}-${hole.hole_number}`,
          courseName,
          hole.hole_number,
          hole.par,
          hole.stroke_index
        ]
      });
    }

    // Save metadata if provided
    if (metadata) {
      const totalPar = holes.reduce((sum: number, h: any) => sum + h.par, 0);
      
      // Delete existing metadata
      await db.execute({
        sql: 'DELETE FROM course_scorecard_metadata WHERE course_name = ?',
        args: [courseName]
      });

      // Insert new metadata
      await db.execute({
        sql: `INSERT INTO course_scorecard_metadata 
              (course_name, total_par, slope_rating, course_rating, tee_color)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          courseName,
          totalPar,
          metadata.slope_rating,
          metadata.course_rating,
          metadata.tee_color
        ]
      });
      console.log('✅ Saved metadata for:', courseName);
    }

    return NextResponse.json({
      success: true,
      message: `Saved scorecard for ${courseName}`
    });

  } catch (error) {
    console.error('Error saving course scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to save scorecard' },
      { status: 500 }
    );
  }
}
