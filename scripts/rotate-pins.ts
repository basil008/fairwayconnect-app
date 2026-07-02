/**
 * Rotate all member PINs and/or the admin PIN.
 * The old PINs shipped in repo database files and must be treated as compromised.
 *
 * Usage:
 *   npx tsx scripts/rotate-pins.ts --members        # new random unique 4-digit PIN per member
 *   npx tsx scripts/rotate-pins.ts --admin 8371     # set a specific admin PIN
 *   npx tsx scripts/rotate-pins.ts --members --admin 8371
 *
 * Prints a member→PIN sheet for the secretary to distribute. Run over
 * `fly ssh console` in production so the sheet never leaves the machine.
 */
import { getDb } from '../src/lib/db';

function randomPin(used: Set<string>): string {
  // Avoid trivially guessable PINs
  const banned = new Set(['0000', '1111', '1234', '4321', '2026', '2025']);
  let pin: string;
  do {
    pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  } while (used.has(pin) || banned.has(pin));
  used.add(pin);
  return pin;
}

async function main() {
  const db = getDb();
  const args = process.argv.slice(2);

  if (args.includes('--members')) {
    const res = await db.execute("SELECT id, name FROM members WHERE status = 'active' ORDER BY name");
    const used = new Set<string>();
    console.log('\n=== NEW MEMBER PINS (distribute securely, then delete this output) ===');
    for (const row of res.rows as unknown as Array<{ id: string; name: string }>) {
      const pin = randomPin(used);
      await db.execute({ sql: 'UPDATE members SET member_pin = ? WHERE id = ?', args: [pin, row.id] });
      console.log(`${row.name.padEnd(30)} ${pin}`);
    }
    console.log(`=== ${res.rows.length} member PINs rotated ===\n`);
  }

  const adminIdx = args.indexOf('--admin');
  if (adminIdx !== -1) {
    const newPin = args[adminIdx + 1];
    if (!newPin || !/^\d{4,8}$/.test(newPin)) {
      console.error('Provide the new admin PIN after --admin (4–8 digits)');
      process.exit(1);
    }
    await db.execute({
      sql: "INSERT OR REPLACE INTO society_settings (key, value) VALUES ('admin_pin', ?)",
      args: [newPin],
    });
    console.log('✅ Admin PIN updated');
  }

  if (!args.includes('--members') && adminIdx === -1) {
    console.log('Nothing to do. Use --members and/or --admin <pin>.');
  }
}

main();
