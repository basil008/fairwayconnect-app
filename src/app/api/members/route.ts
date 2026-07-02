import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

// Columns safe for any visitor. PINs, tokens, and contact details are admin-only.
const PUBLIC_COLUMNS = 'id, name, handicap, member_type, status, handicap_updated_at';
const ADMIN_COLUMNS = PUBLIC_COLUMNS + ', email, phone, member_pin, last_login_at, login_count, joined_date';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const session = await getSessionFromRequest(req);
    const columns = session?.role === 'admin' ? ADMIN_COLUMNS : PUBLIC_COLUMNS;

    const membersResult = await db.execute({
      sql: `SELECT ${columns} FROM members WHERE status = ? ORDER BY name`,
      args: ['active']
    });
    
    // Sort by surname (last word of name) for proper ALGS display
    const members = membersResult.rows.sort((a, b) => {
      const getSurname = (name: string) => {
        const parts = (name || '').trim().split(/\s+/);
        return parts[parts.length - 1].toLowerCase();
      };
      const surnameA = getSurname(a.name as string);
      const surnameB = getSurname(b.name as string);
      return surnameA.localeCompare(surnameB);
    });
    
    return NextResponse.json(members);
    
  } catch (error) {
    console.error('❌ Members API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch members', 
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('📝 Creating new member');
    const db = getDb();
    const body = await req.json();
    const { name, handicap, email, phone, member_type } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const memberId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.execute({
      sql: `
        INSERT INTO members (id, society_id, name, handicap, email, phone, member_type, status, joined_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        memberId, 
        'soc_oscar_001', 
        name, 
        handicap || 28, 
        email || '', 
        phone || '', 
        member_type || 'member',
        'active',
        new Date().toISOString().split('T')[0], // YYYY-MM-DD
        new Date().toISOString() // Full datetime
      ]
    });

    console.log(`✅ Created member: ${name} (${memberId})`);
    
    return NextResponse.json({ 
      id: memberId, 
      name, 
      handicap: handicap || 28, 
      member_type: member_type || 'member' 
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Member creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create member', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}