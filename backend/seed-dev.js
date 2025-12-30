/* Seed script to create dev user Dooug with password 525210 (hashed).
   Run with: `node seed-dev.js` from backend/ directory (ensure DATABASE_URL is set)
*/
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function run() {
  const username = 'Dooug';
  const password = '525210';
  try {
    const hash = await bcrypt.hash(password, 10);
    await prisma.devUser.upsert({
      where: { username },
      update: { passwordHash: hash },
      create: { username, passwordHash: hash, role: 'dev' }
    });
    console.log('Dev user upserted:', username);
  } catch (e) {
    console.error('Seed failed', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
