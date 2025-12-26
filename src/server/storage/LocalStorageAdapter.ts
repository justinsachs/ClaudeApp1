/**
 * Local File System Storage Adapter
 * For development and EC2-style deployments
 */

import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter, UploadedFile } from './StorageAdapter';

export interface LocalStorageConfig {
  basePath: string;
  baseUrl: string;
}

export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl;
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadedFile> {
    const targetPath = path.join(this.basePath, filename);
    const directory = path.dirname(targetPath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Write file
    await fs.writeFile(targetPath, buffer);

    const stats = await fs.stat(targetPath);

    return {
      filename,
      originalName: metadata?.originalName || filename,
      size: stats.size,
      mimeType,
      url: `${this.baseUrl}/${filename}`,
      path: filename
    };
  }

  async uploadFromPath(
    sourcePath: string,
    targetFilename: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadedFile> {
    const targetPath = path.join(this.basePath, targetFilename);
    const directory = path.dirname(targetPath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Copy file
    await fs.copyFile(sourcePath, targetPath);

    const stats = await fs.stat(targetPath);

    return {
      filename: targetFilename,
      originalName: metadata?.originalName || targetFilename,
      size: stats.size,
      mimeType,
      url: `${this.baseUrl}/${targetFilename}`,
      path: targetFilename
    };
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.readFile(fullPath);
  }

  async getFileUrl(filePath: string, expiresIn?: number): Promise<string> {
    // Local storage doesn't support signed URLs, return public URL
    return `${this.baseUrl}/${filePath}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath);
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(prefix?: string): Promise<UploadedFile[]> {
    const searchPath = prefix
      ? path.join(this.basePath, prefix)
      : this.basePath;

    const files: UploadedFile[] = [];

    async function walkDirectory(dir: string, baseDir: string, baseUrl: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walkDirectory(fullPath, baseDir, baseUrl);
        } else {
          const stats = await fs.stat(fullPath);
          const relativePath = path.relative(baseDir, fullPath);

          files.push({
            filename: entry.name,
            originalName: entry.name,
            size: stats.size,
            mimeType: 'application/octet-stream',
            url: `${baseUrl}/${relativePath}`,
            path: relativePath
          });
        }
      }
    }

    await walkDirectory(searchPath, this.basePath, this.baseUrl);
    return files;
  }
}
