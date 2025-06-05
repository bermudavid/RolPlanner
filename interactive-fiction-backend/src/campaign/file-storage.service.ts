import { Injectable } from '@nestjs/common';
import { diskStorage, StorageEngine } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

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
    const ext = extname(file.originalname).toLowerCase();
    if (ext === '.zip') {
      const dirName = randomUUID();
      const dirPath = join(uploadsDir, dirName);
      await fs.mkdir(dirPath, { recursive: true });
      const zipPath = join(dirPath, file.originalname);
      await fs.writeFile(zipPath, file.buffer);
      try {
        await exec(`unzip -q ${zipPath} -d ${dirPath}`);
      } finally {
        await fs.unlink(zipPath);
      }
      const files = await fs.readdir(dirPath);
      const modelFile = files.find((f) =>
        f.toLowerCase().endsWith('.gltf') || f.toLowerCase().endsWith('.glb'),
      );
      if (!modelFile) {
        throw new Error('No GLTF/GLB model found in zip');
      }
      return `/models/${dirName}/${modelFile}`;
    }

    const filename = `${randomUUID()}${ext}`;
    const filePath = join(uploadsDir, filename);
    await fs.writeFile(filePath, file.buffer);
    return `/models/${filename}`;
  }
}
