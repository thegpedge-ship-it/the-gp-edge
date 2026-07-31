import 'dotenv/config';
import { readFileSync } from 'fs';

// Manually load .env
const envLocal = readFileSync('.env', 'utf-8');
envLocal.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && key.trim() && !key.startsWith('#')) {
    process.env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { PrismaClient } = await import('../lib/generated/prisma/index.js').catch(() => import('./lib/generated/prisma/index.js'));
const { PrismaPg } = await import('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const now = new Date();
console.log('=== DIAGNOSTIC: Subscription State ===');
console.log('Server NOW (UTC):', now.toISOString());
console.log('Server NOW (local):', now.toString());
console.log('');

try {
  const rows = await prisma.subscriptions.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  if (!rows.length) {
    console.log('❌ NO SUBSCRIPTION ROWS FOUND IN NEON');
  } else {
    console.log(`Found ${rows.length} subscription row(s):\n`);
    rows.forEach((r, i) => {
      const exp = r.access_expires_at ? new Date(r.access_expires_at) : null;
      const isExpired = exp ? exp <= now : null;
      console.log(`--- Row ${i + 1} ---`);
      console.log('  id              :', r.id);
      console.log('  user_id         :', r.user_id);
      console.log('  status          :', r.status);
      console.log('  access_level    :', r.access_level);
      console.log('  access_expires_at (raw):', String(r.access_expires_at));
      console.log('  access_expires_at (UTC):', exp ? exp.toISOString() : 'NULL');
      console.log('  isExpiredByDate :', isExpired === null ? '⚠️  NULL - no expiry set!' : isExpired ? '✅ YES (expired)' : '❌ NO (still active)');
      console.log('  wouldPassFilter :', (r.status === 'active' || r.status === 'trialing') && exp && exp > now ? '✅ PASSES (valid sub)' : '❌ FILTERED OUT');
      console.log('');
    });
  }

  // Also try direct updateMany to test if it works
  console.log('=== Testing updateMany ===');
  const testResult = await prisma.subscriptions.updateMany({
    where: {
      status: { in: ['active', 'trialing'] },
      access_expires_at: { lte: now },
    },
    data: { status: 'expired' },
  });
  console.log(`updateMany result: ${testResult.count} row(s) updated to 'expired'`);

  // Re-read to confirm
  const afterUpdate = await prisma.subscriptions.findMany({
    where: { status: 'expired' },
    select: { id: true, status: true, access_expires_at: true },
  });
  console.log(`Rows with status='expired' after update: ${afterUpdate.length}`);
  afterUpdate.forEach(r => console.log('  ', JSON.stringify(r)));

} catch (err) {
  console.error('ERROR:', err.message);
  console.error(err);
} finally {
  await prisma.$disconnect();
}
