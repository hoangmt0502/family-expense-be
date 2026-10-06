import { Module } from '@nestjs/common';
import { FamiliesController } from './families.controller.js';
import { FamiliesService } from './families.service.js';
import { CategoriesModule } from '../categories/categories.module.js';

@Module({
  imports: [CategoriesModule],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
