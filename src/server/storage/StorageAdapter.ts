/**
 * Abstract Storage Adapter Interface
 * Allows switching between local file storage, S3, R2, etc.
 */

export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  path: string;
}

export interface StorageAdapter {
  /**
   * Upload a file from a buffer
   */
  uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadedFile>;

  /**
   * Upload a file from a path (for local file moves)
   */
  uploadFromPath(
    sourcePath: string,
    targetFilename: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<UploadedFile>;

  /**
   * Download a file to a buffer
   */
  downloadFile(path: string): Promise<Buffer>;

  /**
   * Get a signed/public URL for a file
   */
  getFileUrl(path: string, expiresIn?: number): Promise<string>;

  /**
   * Delete a file
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Check if file exists
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * List files with optional prefix
   */
  listFiles(prefix?: string): Promise<UploadedFile[]>;
}

export interface StorageAdapterConfig {
  type: 'local' | 's3' | 'r2' | 'gcs';
  [key: string]: any;
}
