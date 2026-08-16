import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST: Create or update course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, location, hole_type, nine_names, tee_colors } = body;

    if (!name || !hole_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, hole_type' },
        { status: 400 }
      );
    }

    const db = getDb();

    if (id) {
      // Update existing course
      await db.execute({
        sql: `UPDATE courses 
              SET name = ?, location = ?, hole_type = ?, nine_names = ?
              WHERE id = ?`,
        args: [name, location || '', hole_type, nine_names || '', id]
      });
    } else {
      // Create new course
      // If 27 or 36 hole course, ONLY create combination entries (not the parent)
      if (hole_type === '27' || hole_type === '36') {
        const ninesList = (nine_names || '').split(',').map(n => n.trim());
        
        if (ninesList.length >= 3) {
          // Generate all 18-hole combinations
          const combinations: string[][] = [];
          
          if (hole_type === '27' && ninesList.length === 3) {
            // 3 nines = 3 combinations
            combinations.push([ninesList[0], ninesList[1]]);
            combinations.push([ninesList[0], ninesList[2]]);
            combinations.push([ninesList[1], ninesList[2]]);
          } else if (hole_type === '36' && ninesList.length === 4) {
            // 4 nines = 6 combinations
            for (let i = 0; i < ninesList.length; i++) {
              for (let j = i + 1; j < ninesList.length; j++) {
                combinations.push([ninesList[i], ninesList[j]]);
              }
            }
          }

          // Create course entries for each combination
          for (const combo of combinations) {
            const comboName = `${name} (${combo.join('/')})`;
            const comboId = `course_${comboName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
            await db.execute({
              sql: `INSERT INTO courses (id, name, location, hole_type, nine_names)
                    VALUES (?, ?, ?, ?, ?)`,
              args: [comboId, comboName, location || '', '18', combo.join(',')]
            });
          }
        }
      } else {
        // For 18-hole courses, create single entry
        const courseId = `course_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
        
        await db.execute({
          sql: `INSERT INTO courses (id, name, location, hole_type, nine_names)
                VALUES (?, ?, ?, ?, ?)`,
          args: [courseId, name, location || '', hole_type, nine_names || '']
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: id ? 'Course updated' : 'Course created'
    });

  } catch (error) {
    console.error('Error saving course:', error);
    return NextResponse.json(
      { error: 'Failed to save course' },
      { status: 500 }
    );
  }
}

// DELETE: Remove course
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing course ID' },
        { status: 400 }
      );
    }

    const db = getDb();

    await db.execute({
      sql: 'DELETE FROM courses WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
