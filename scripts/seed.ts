import { seedData } from '../lib/seed-data';

async function main() {
  try {
    await seedData();
    process.exit(0);
  } catch (error) {
    console.error('Error running seed script:', error);
    process.exit(1);
  }
}

main(); 