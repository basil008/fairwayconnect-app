import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET: Fetch master scorecard for course + tee
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseName = searchParams.get('course');
    const teeColor = searchParams.get('tee');

    if (!courseName || !teeColor) {
      return NextResponse.json(
        { error: 'Missing course or tee parameter' },
        { status: 400 }
      );
    }

    const db = getDb();
    const holes = await db.execute({
      sql: `SELECT hole_number, par, stroke_index, yardage 
            FROM master_course_holes 
            WHERE course_name = ? AND tee_color = ?
            ORDER BY hole_number`,
      args: [courseName, teeColor]
    });

    if (holes.rows.length === 0) {
      return NextResponse.json(
        { exists: false, message: 'No master scorecard found' },
        { status: 404 }
      );
    }

    if (holes.rows.length !== 18) {
      return NextResponse.json(
        { exists: false, message: `Incomplete scorecard (${holes.rows.length}/18 holes)` },
        { status: 404 }
      );
    }

    // Calculate totals
    const frontNine = holes.rows.slice(0, 9);
    const backNine = holes.rows.slice(9, 18);
    
    const frontPar = frontNine.reduce((sum: number, h: any) => sum + h.par, 0);
    const backPar = backNine.reduce((sum: number, h: any) => sum + h.par, 0);
    const totalPar = frontPar + backPar;
    
    const frontYards = frontNine.reduce((sum: number, h: any) => sum + h.yardage, 0);
    const backYards = backNine.reduce((sum: number, h: any) => sum + h.yardage, 0);
    const totalYards = frontYards + backYards;

    return NextResponse.json({
      exists: true,
      course: courseName,
      tee: teeColor,
      holes: holes.rows,
      totals: {
        frontPar,
        backPar,
        totalPar,
        frontYards,
        backYards,
        totalYards
      }
    });

  } catch (error) {
    console.error('Error fetching master scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master scorecard' },
      { status: 500 }
    );
  }
}

// POST: Save new master scorecard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseName, teeColor, holes } = body;

    if (!courseName || !teeColor || !holes || holes.length !== 18) {
      return NextResponse.json(
        { error: 'Invalid request: need courseName, teeColor, and 18 holes' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Delete existing master scorecard for this course + tee
    await db.execute({
      sql: 'DELETE FROM master_course_holes WHERE course_name = ? AND tee_color = ?',
      args: [courseName, teeColor]
    });

    // Insert new holes
    for (const hole of holes) {
      await db.execute({
        sql: `INSERT INTO master_course_holes 
              (id, course_name, tee_color, hole_number, par, stroke_index, yardage)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `mch-${courseName.toLowerCase().replace(/\s+/g, '-')}-${teeColor.toLowerCase()}-${hole.hole_number}`,
          courseName,
          teeColor,
          hole.hole_number,
          hole.par,
          hole.stroke_index,
          hole.yardage
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${holes.length} holes for ${courseName} ${teeColor} tees`
    });

  } catch (error) {
    console.error('Error saving master scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to save master scorecard' },
      { status: 500 }
    );
  }
}
