import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateStablefordPoints } from '@/lib/stableford';
import fs from 'fs';
import path from 'path';

const COURSE_DATA = [
  { hole: 1, par: 4, si: 7 },
  { hole: 2, par: 4, si: 3 },
  { hole: 3, par: 3, si: 15 },
  { hole: 4, par: 5, si: 1 },
  { hole: 5, par: 4, si: 11 },
  { hole: 6, par: 4, si: 5 },
  { hole: 7, par: 3, si: 13 },
  { hole: 8, par: 4, si: 9 },
  { hole: 9, par: 5, si: 17 },
  { hole: 10, par: 4, si: 8 },
  { hole: 11, par: 3, si: 16 },
  { hole: 12, par: 4, si: 4 },
  { hole: 13, par: 3, si: 14 },
  { hole: 14, par: 5, si: 2 },
  { hole: 15, par: 4, si: 10 },
  { hole: 16, par: 3, si: 18 },
  { hole: 17, par: 4, si: 6 },
  { hole: 18, par: 4, si: 12 },
];

interface ScanResult {
  scores: (number | null)[];
  confidence: 'high' | 'medium' | 'low';
  notes: string;
  player_name: string | null;
  demo_mode: boolean;
  uncertain_holes: number[];
}

interface HoleResult {
  hole_number: number;
  par: number;
  stroke_index: number;
  gross_score: number | null;
  stableford_points: number | null;
  status: 'confident' | 'uncertain' | 'unreadable';
}

function generateDemoScores(handicap: number): ScanResult {
  const scores: (number | null)[] = [];
  // Pick 1-2 random holes to mark as uncertain
  const uncertainHole1 = Math.floor(Math.random() * 18) + 1;
  let uncertainHole2 = Math.floor(Math.random() * 18) + 1;
  while (uncertainHole2 === uncertainHole1) {
    uncertainHole2 = Math.floor(Math.random() * 18) + 1;
  }
  const uncertainHoles = [uncertainHole1, uncertainHole2];

  for (const hole of COURSE_DATA) {
    // Expected score = par + (handicap/18) adjusted per SI
    const strokesOnHole = handicap >= hole.si ? 1 : 0;
    const expectedGross = hole.par + (strokesOnHole > 0 ? 1 : 0) + Math.round(Math.random() * 2 - 0.5);
    // Clamp between 1 and 10
    const score = Math.max(1, Math.min(10, expectedGross));
    scores.push(score);
  }

  return {
    scores,
    confidence: 'high',
    notes: `Demo mode — simulated scores for handicap ${handicap}. Holes ${uncertainHoles.join(' and ')} marked as uncertain.`,
    player_name: null,
    demo_mode: true,
    uncertain_holes: uncertainHoles,
  };
}

async function scanWithOpenAI(base64Image: string): Promise<{ scores: (number | null)[]; confidence: string; notes: string; player_name: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are analysing a photograph of a golf scorecard. Extract the scores for each hole.

The scorecard is for an 18-hole round at Donabate Golf Club with the following layout:
Hole:  1   2   3   4   5   6   7   8   9  | 10  11  12  13  14  15  16  17  18
Par:   4   4   3   5   4   4   3   4   5  |  4   3   4   3   5   4   3   4   4

Look for handwritten numbers in the score rows. Return ONLY a JSON object with this exact format:
{
  "player_name": "name if visible or null",
  "scores": [score1, score2, ..., score18],
  "confidence": "high" or "medium" or "low",
  "notes": "any issues reading specific holes"
}

If you cannot read a score for a specific hole, use null for that position.
Rules:
- Scores are typically between 2 and 10 for most holes
- A score of 0 means the hole was not played (NR)
- Look for the gross score row, not Stableford points`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');
  return JSON.parse(jsonMatch[0]);
}

async function scanWithAnthropic(base64Image: string): Promise<{ scores: (number | null)[]; confidence: string; notes: string; player_name: string | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `You are analysing a photograph of a golf scorecard. Extract the scores for each hole.

The scorecard is for an 18-hole round at Donabate Golf Club with the following layout:
Hole:  1   2   3   4   5   6   7   8   9  | 10  11  12  13  14  15  16  17  18
Par:   4   4   3   5   4   4   3   4   5  |  4   3   4   3   5   4   3   4   4

Look for handwritten numbers in the score rows. Return ONLY a JSON object with this exact format:
{
  "player_name": "name if visible or null",
  "scores": [score1, score2, ..., score18],
  "confidence": "high" or "medium" or "low",
  "notes": "any issues reading specific holes"
}

If you cannot read a score for a specific hole, use null for that position.
Rules:
- Scores are typically between 2 and 10 for most holes
- A score of 0 means the hole was not played (NR)
- Look for the gross score row, not Stableford points`,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const memberId = formData.get('member_id') as string;
    const eventId = formData.get('event_id') as string;

    if (!file || !memberId || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();

    // Get member handicap
    const memberResult = await db.execute({ sql: 'SELECT handicap, name FROM members WHERE id = ?', args: [memberId] });
    const member = memberResult.rows[0] as unknown as { handicap: number; name: string } | undefined;
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Save the image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `scan_${Date.now()}_${memberId}.jpg`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const base64Image = buffer.toString('base64');
    const imagePath = `/uploads/${filename}`;

    let scanResult: ScanResult;

    // Determine which mode to use
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    if (hasOpenAI || hasAnthropic) {
      // Real AI scan
      try {
        const aiResult = hasAnthropic
          ? await scanWithAnthropic(base64Image)
          : await scanWithOpenAI(base64Image);

        // Determine uncertain holes (where score is null or notes mention issues)
        const uncertainHoles: number[] = [];
        aiResult.scores.forEach((score, i) => {
          if (score === null) uncertainHoles.push(i + 1);
        });

        scanResult = {
          scores: aiResult.scores,
          confidence: aiResult.confidence as 'high' | 'medium' | 'low',
          notes: aiResult.notes,
          player_name: aiResult.player_name,
          demo_mode: false,
          uncertain_holes: uncertainHoles,
        };
      } catch (aiError) {
        // Fall back to demo mode if AI fails
        console.error('AI scan failed, falling back to demo mode:', aiError);
        scanResult = generateDemoScores(member.handicap);
        scanResult.notes = 'AI scan failed — showing simulated scores. ' + scanResult.notes;
      }
    } else {
      // Demo mode — simulate a 2-second processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      scanResult = generateDemoScores(member.handicap);
    }

    // Build hole results with Stableford calculations
    const holeResults: HoleResult[] = COURSE_DATA.map((hole, i) => {
      const score = scanResult.scores[i];
      const isUncertain = scanResult.uncertain_holes.includes(hole.hole);
      const isUnreadable = score === null;

      let pts: number | null = null;
      if (score !== null) {
        pts = calculateStablefordPoints(score, hole.par, hole.si, member.handicap);
      }

      return {
        hole_number: hole.hole,
        par: hole.par,
        stroke_index: hole.si,
        gross_score: score,
        stableford_points: pts,
        status: isUnreadable ? 'unreadable' : isUncertain ? 'uncertain' : 'confident',
      };
    });

    const totalGross = holeResults.reduce((sum, h) => sum + (h.gross_score || 0), 0);
    const totalPoints = holeResults.reduce((sum, h) => sum + (h.stableford_points || 0), 0);

    return NextResponse.json({
      success: true,
      demo_mode: scanResult.demo_mode,
      confidence: scanResult.confidence,
      notes: scanResult.notes,
      player_name: scanResult.player_name,
      image_path: imagePath,
      holes: holeResults,
      total_gross: totalGross,
      total_points: totalPoints,
      member: {
        id: memberId,
        name: member.name,
        handicap: member.handicap,
      },
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Failed to process scorecard image' }, { status: 500 });
  }
}
