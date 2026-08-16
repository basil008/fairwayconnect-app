import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 Members API called');
    const db = getDb();
    
    // Get all members with proper error handling
    const membersResult = await db.execute({
      sql: 'SELECT * FROM members WHERE status = ? ORDER BY name',
      args: ['active']
    });
    
    console.log(`✅ Found ${membersResult.rows.length} active members`);
    
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
    
    console.log(`📊 Returning ${members.length} sorted members`);
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