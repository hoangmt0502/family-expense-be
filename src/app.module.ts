import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FamiliesModule } from './families/families.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { BudgetsModule } from './budgets/budgets.module.js';
import { UsersModule } from './users/users.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    TransactionsModule,
    AuthModule,
    FamiliesModule,
    CategoriesModule,
    BudgetsModule,
    UsersModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}