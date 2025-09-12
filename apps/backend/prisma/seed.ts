/* eslint-disable */
import { PrismaClient, UserRole, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobboard.com' },
    update: {},
    create: {
      email: 'admin@jobboard.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      provider: AuthProvider.CREDENTIALS,
      isEmailVerified: true,
      mfaEnabled: false,
      isOnboarded: true,
    },
  });

  // Create job seeker user
  const jobSeekerUser = await prisma.user.upsert({
    where: { email: 'developer@example.com' },
    update: {},
    create: {
      email: 'developer@example.com',
      password: hashedPassword,
      fullName: 'Alex Chen',
      role: UserRole.JOB_SEEKER,
      provider: AuthProvider.CREDENTIALS,
      isEmailVerified: true,
      mfaEnabled: false,
      isOnboarded: true,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Created users:');
  console.log('- Admin:', adminUser.email);
  console.log('- Job Seeker:', jobSeekerUser.email);
  console.log('\nAll users have password: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
