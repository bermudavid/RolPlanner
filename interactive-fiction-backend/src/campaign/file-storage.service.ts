import { Injectable } from '@nestjs/common';
import { diskStorage, StorageEngine } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

// Decompression library is ESM only. Use dynamic import to avoid commonjs issues.
type Decompress = (input: Buffer, output: string) => Promise<unknown>;

// Lazily load the decompress function when needed
// Using eval avoids TypeScript transforming the dynamic import into a CJS
// require, which would fail because the library is ESM only.
async function getDecompress(): Promise<Decompress> {
  const mod = await eval("import('@xhmikosr/decompress')");
  return (mod.default ?? mod) as Decompress;
}

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

      const decompress = await getDecompress();
      await decompress(file.buffer, dirPath);

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

  async deleteModel(pathFromDb?: string): Promise<void> {
    if (!pathFromDb) return;
    const trimmed = pathFromDb.replace(/^\/models\//, '');
    const parts = trimmed.split(/[/\\]/);
    const base = join('uploads', 'models', parts[0]);
    try {
      await fs.rm(base, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
