/* eslint-disable */
import {
  PrismaClient,
  UserRole,
  AuthProvider,
  WorkspaceRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@knowledgehub.com' },
    update: {},
    create: {
      email: 'admin@knowledgehub.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      provider: AuthProvider.CREDENTIALS,
      isEmailVerified: true,
      mfaEnabled: false,
      isOnboarded: true,
      subscriptionTier: 'ENTERPRISE',
    },
  });

  // Premium demo user (workspace owner)
  const premiumUser = await prisma.user.upsert({
    where: { email: 'premium@knowledgehub.com' },
    update: {},
    create: {
      email: 'premium@knowledgehub.com',
      password: hashedPassword,
      fullName: 'Priya Sharma',
      role: UserRole.PREMIUM_USER,
      provider: AuthProvider.CREDENTIALS,
      isEmailVerified: true,
      mfaEnabled: false,
      isOnboarded: true,
      subscriptionTier: 'PREMIUM',
    },
  });

  // Standard demo user (workspace member)
  const standardUser = await prisma.user.upsert({
    where: { email: 'user@knowledgehub.com' },
    update: {},
    create: {
      email: 'user@knowledgehub.com',
      password: hashedPassword,
      fullName: 'Alex Chen',
      role: UserRole.USER,
      provider: AuthProvider.CREDENTIALS,
      isEmailVerified: true,
      mfaEnabled: false,
      isOnboarded: true,
      subscriptionTier: 'FREE',
    },
  });

  // Demo workspace owned by the premium user
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      description: 'A sample workspace for exploring the AI Knowledge Hub.',
      slug: 'demo-workspace',
      isPublic: false,
      ownerId: premiumUser.id,
    },
  });

  // Workspace memberships
  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: premiumUser.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: premiumUser.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.OWNER,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: standardUser.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: standardUser.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.MEMBER,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Created users:');
  console.log('- Admin:  ', adminUser.email);
  console.log('- Premium:', premiumUser.email);
  console.log('- User:   ', standardUser.email);
  console.log('Created workspace:', workspace.slug);
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
