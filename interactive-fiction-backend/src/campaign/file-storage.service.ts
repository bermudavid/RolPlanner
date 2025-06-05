import { Injectable } from '@nestjs/common';
import { diskStorage, StorageEngine } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

@Injectable()
export class FileStorageService {
  getModelStorage(): StorageEngine {
    return diskStorage({
      destination: './uploads/models',
      filename: (_req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  async saveModelFile(file: Express.Multer.File): Promise<string> {
    const uploadsDir = join('uploads', 'models');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const filePath = join(uploadsDir, filename);
    await fs.writeFile(filePath, file.buffer);
    return `/models/${filename}`;
  }
}
