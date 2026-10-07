import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// 1. Ép nạp file .env ngay lập tức ở Local để mô phỏng hành vi của Production
dotenv.config();

// 2. Bây giờ process.env.DATABASE_URL chắc chắn đã có giá trị
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Vui lòng kiểm tra file .env');
}

// 3. Khởi tạo Pool và Adapter một cách an toàn
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
