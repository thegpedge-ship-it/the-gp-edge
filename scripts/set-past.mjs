import 'dotenv/config';
import { readFileSync } from 'fs';

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

try {
  const pastDate = new Date('2026-07-31T04:00:00Z');
  const res = await prisma.subscriptions.update({
    where: { id: 'ace42936-3ceb-47ef-9ee2-17248209dc59' },
    data: { access_expires_at: pastDate, status: 'active' }
  });
  console.log('Successfully set access_expires_at to UTC past for testing:', res.access_expires_at);
} catch (e) {
  console.error(e);
} finally {
  await prisma.$disconnect();
}
