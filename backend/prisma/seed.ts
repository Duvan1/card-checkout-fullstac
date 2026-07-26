import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: 'Chaqueta de Cueros Wompi Edition',
    description:
      'Chaqueta de cuero genuino con forro interior de seda. Diseño exclusivo de edición limitada.',
    price: 150000,
    stock: 10,
  },
  {
    name: 'Camiseta Algodón Premium',
    description:
      'Camiseta 100% algodón orgánico. Corte slim fit. Disponible en múltiples colores.',
    price: 45000,
    stock: 25,
  },
  {
    name: 'Zapatillas Urban Runner',
    description:
      'Zapatillas deportivas con suela de goma antideslizante y plantilla memory foam.',
    price: 120000,
    stock: 15,
  },
  {
    name: 'Reloj Smart Chrono X',
    description:
      'Smartwatch con monitoreo de ritmo cardíaco, GPS integrado y resistencia al agua IP68.',
    price: 280000,
    stock: 8,
  },
  {
    name: 'Audífonos Noise Cancelling Pro',
    description:
      'Cancelación de ruido activa, 40h de batería y conexión Bluetooth 5.3.',
    price: 195000,
    stock: 12,
  },
  {
    name: 'Mochila Antirrobo TravelSafe',
    description:
      'Mochila con cierre oculto, puerto USB integrado y compartimento acolchado para laptop 15".',
    price: 85000,
    stock: 20,
  },
  {
    name: 'Botella Térmica Acero Inoxidable',
    description:
      'Mantiene bebidas frías 24h o calientes 12h. Capacidad 750ml. Libre de BPA.',
    price: 35000,
    stock: 30,
  },
  {
    name: 'Lámpara LED Escritorio Ajustable',
    description:
      'Brazo flexible, 5 modos de brillo, puerto USB de carga y abrazadera incluida.',
    price: 65000,
    stock: 18,
  },
];

async function main() {
  const count = await prisma.product.count();

  if (count > 0) {
    console.log(
      `Products already exist (${count}). Skipping seed.`
    );
    return;
  }

  await prisma.product.createMany({
    data: products,
  });

  console.log(`Seed completed: ${products.length} products inserted.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });