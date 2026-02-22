import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'vorobyeviv@gmail.com';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('User already exists:', existingUser.email);
    // Ensure they are admin
    if (!existingUser.isAdmin) {
      await prisma.user.update({
        where: { email },
        data: { isAdmin: true },
      });
      console.log('Updated to admin');
    }
    return;
  }

  // Create admin user
  // Note: firebaseUid will be updated when they actually log in via Firebase
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Ivan Vorobyev',
      firebaseUid: `pending_${Date.now()}`,
      isAdmin: true,
    },
  });

  console.log('Created admin user:', user.email);
}

seedAdmin()
  .catch((e) => {
    console.error('Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
