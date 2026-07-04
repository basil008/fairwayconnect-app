import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// GET - List all courses with their tees
export async function GET() {
  const db = getDb();

  const coursesResult = await db.execute('SELECT * FROM courses ORDER BY name');
  const courses = coursesResult.rows;

  const teesResult = await db.execute('SELECT * FROM course_tees ORDER BY course_id, tee_color');
  const tees = teesResult.rows;

  // Group tees by course
  const coursesWithTees = courses.map(course => ({
    ...course,
    tees: tees.filter(t => t.course_id === course.id)
  }));

  return NextResponse.json(coursesWithTees);
}

// POST - Add a new course or tee
export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'add_course') {
    const courseId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO courses (id, name, location, website) VALUES (?, ?, ?, ?)',
      args: [courseId, body.name, body.location || '', body.website || '']
    });
    return NextResponse.json({ success: true, id: courseId });
  }

  if (body.action === 'add_tee') {
    const teeId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO course_tees (id, course_id, tee_color, slope_rating, course_rating, par) VALUES (?, ?, ?, ?, ?, ?)',
      args: [teeId, body.course_id, body.tee_color, body.slope_rating, body.course_rating, body.par]
    });
    return NextResponse.json({ success: true, id: teeId });
  }

  if (body.action === 'update_tee') {
    await db.execute({
      sql: 'UPDATE course_tees SET slope_rating = ?, course_rating = ?, par = ? WHERE id = ?',
      args: [body.slope_rating, body.course_rating, body.par, body.id]
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
