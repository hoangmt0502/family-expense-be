import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService, UploadedFileDto } from '../cloudinary/cloudinary.service.js'; // Đường dẫn tới CloudinaryService của bạn

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadImage(file: UploadedFileDto): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh hợp lệ');
    }

    try {
      const result = await this.cloudinaryService.uploadImage(file);
      return { url: result.secure_url };
    } catch (error: any) {
      throw new BadRequestException('Lỗi tải ảnh lên Cloudinary: ' + error?.message);
    }
  }
}
