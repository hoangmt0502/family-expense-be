import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js'; // Thay đường dẫn phù hợp

@Module({
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [UploadService],
})
export class UploadModule {}
