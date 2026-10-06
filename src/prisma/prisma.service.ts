import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as process from 'process';

const { Pool } = pg;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Khởi tạo Pool kết nối tới PostgreSQL
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    
    // Đưa Pool vào Prisma Adapter
    const adapter = new PrismaPg(pool);
    
    // Truyền adapter vào constructor của PrismaClient (Chuẩn v7)
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
