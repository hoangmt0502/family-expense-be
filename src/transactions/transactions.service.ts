import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService, UploadedFileDto } from '../cloudinary/cloudinary.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(dto: CreateTransactionDto, file?: UploadedFileDto) {
    let imageUrl: string | null = null;

    if (file) {
      const uploadResult = await this.cloudinary.uploadImage(file);
      imageUrl = uploadResult.secure_url;
    }

    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        note: dto.note,
        imageUrl,
        userId: dto.userId,
        familyId: dto.familyId,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
        user: { select: { id: true, fullName: true, avatar: true } },
      },
    });
  }

  async findAllByFamily(familyId: string) {
    return this.prisma.transaction.findMany({
      where: { familyId },
      orderBy: { date: 'desc' },
      include: {
        category: true,
        user: { select: { id: true, fullName: true } },
      },
    });
  }
}
