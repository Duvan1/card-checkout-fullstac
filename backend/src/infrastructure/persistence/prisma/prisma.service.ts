import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ??
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    console.log('========== DATABASE CONFIG ==========');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_USER:', process.env.DB_USER);
    console.log(
      'DB_PASSWORD:',
      process.env.DB_PASSWORD ? '********' : 'UNDEFINED',
    );
    console.log('=====================================');

    if (!connectionString) {
      throw new Error('No database connection string found');
    }

    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    pool.on('connect', () => {
      console.log('PostgreSQL Pool connected');
    });

    pool.on('error', (err) => {
      console.error('Pool error:', err);
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    console.log('Connecting Prisma...');

    try {
      await this.$connect();
      console.log('✅ Prisma connected successfully');
    } catch (error) {
      console.error('❌ Prisma connection failed');
      console.error(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}