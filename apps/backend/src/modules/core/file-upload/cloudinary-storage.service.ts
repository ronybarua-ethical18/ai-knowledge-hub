import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../../config/env.config';

export interface UploadedObject {
  url: string;
  publicId: string;
}

const FOLDER = 'ai-knowledge-hub/uploads';

@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  constructor() {
    cloudinary.config({
      cloud_name: env.config.CLOUDINARY_CLOUD_NAME,
      api_key: env.config.CLOUDINARY_API_KEY,
      api_secret: env.config.CLOUDINARY_API_SECRET,
    });
  }

  // Documents (PDF/DOCX/TXT) must use resource_type "raw" — Cloudinary's
  // default "image" pipeline rejects/mangles non-image, non-video files.
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
  ): Promise<UploadedObject> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: FOLDER,
          filename_override: filename,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message}`);
            return reject(error ?? new Error('Cloudinary upload failed'));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteByPublicId(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }
}
