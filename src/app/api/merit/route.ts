import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('🏆 Merit/GOTY API called');
    const db = getDb();
    
    // Get all active members for merit order (GOTY leaderboard)
    const membersResult = await db.execute({
      sql: 'SELECT id, name, handicap FROM members WHERE status = ? ORDER BY name',
      args: ['active']
    });
    
    const members = membersResult.rows;
    console.log(`👥 Found ${members.length} members for merit calculation`);
    
    // Create merit order with simulated scores (will be real tournament results later)
    const meritOrder = members.map((member: any, index: number) => {
      // Simulate some tournament results for demo
      const simulatedPoints = Math.floor(Math.random() * 200) + 50; // 50-250 points
      const eventsPlayed = Math.floor(Math.random() * 3); // 0-2 events played so far
      
      return {
        name: member.name,
        total_points: simulatedPoints,
        position: index + 1, // Will be re-sorted
        handicap: member.handicap,
        events_played: eventsPlayed,
        average_points: eventsPlayed > 0 ? Math.round(simulatedPoints / eventsPlayed) : 0
      };
    });

    // Sort by total points (descending) and update positions
    meritOrder.sort((a, b) => b.total_points - a.total_points);
    meritOrder.forEach((player, index) => {
      player.position = index + 1;
    });

    console.log(`🏆 GOTY leader: ${meritOrder[0]?.name || 'TBD'} (${meritOrder[0]?.total_points || 0} pts)`);

    return NextResponse.json(meritOrder);
    
  } catch (error) {
    console.error('❌ Merit API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch merit order', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}