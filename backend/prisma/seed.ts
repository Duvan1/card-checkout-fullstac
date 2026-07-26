import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findFirst();

  if (existing) {
    console.log('Products already seeded. Skipping.');
    return;
  }

  await prisma.product.create({
    data: {
      name: 'Chaqueta de Cueros Wompi Edition',
      description:
        'Chaqueta de cuero genuino con forro interior de seda. Diseño exclusivo de edición limitada.',
      price: 150000,
      stock: 10,
    },
  });

  console.log('Seed completed: 1 product inserted.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
