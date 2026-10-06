import { PrismaClient, TransactionType, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Đang xoá dữ liệu cũ...');
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  console.log('🌱 Đang tạo dữ liệu mẫu...');

  // 1. Tạo Gia đình mẫu
  const family = await prisma.family.create({
    data: {
      name: 'Gia đình Mẫu',
      inviteCode: 'FAM2026',
    },
  });

  // 2. Tạo User mẫu
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@family.com',
      password: hashedPassword,
      fullName: 'Nguyễn Văn A',
      role: Role.ADMIN,
      familyId: family.id,
    },
  });

  // 3. Tạo Danh mục mẫu
  const categories = await prisma.category.createManyAndReturn({
    data: [
      { name: 'Ăn uống', type: TransactionType.EXPENSE, icon: 'utensils', familyId: family.id },
      { name: 'Đi lại & Xăng xe', type: TransactionType.EXPENSE, icon: 'car', familyId: family.id },
      { name: 'Mua sắm', type: TransactionType.EXPENSE, icon: 'shopping-bag', familyId: family.id },
      { name: 'Lương & Thưởng', type: TransactionType.INCOME, icon: 'wallet', familyId: family.id },
    ],
  });

  const expenseCategory = categories.find((c) => c.type === TransactionType.EXPENSE);
  const incomeCategory = categories.find((c) => c.type === TransactionType.INCOME);

  // 4. Tạo Giao dịch mẫu
  if (expenseCategory && incomeCategory) {
    await prisma.transaction.createMany({
      data: [
        {
          amount: 15000000,
          type: TransactionType.INCOME,
          note: 'Lương tháng này',
          userId: user.id,
          familyId: family.id,
          categoryId: incomeCategory.id,
        },
        {
          amount: 250000,
          type: TransactionType.EXPENSE,
          note: 'Đi siêu thị mua đồ ăn',
          userId: user.id,
          familyId: family.id,
          categoryId: expenseCategory.id,
        },
      ],
    });
  }

  console.log('✅ Seed dữ liệu mẫu thành công!');
  console.log('🔑 Tài khoản mẫu: demo@family.com | Mật khẩu: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
  