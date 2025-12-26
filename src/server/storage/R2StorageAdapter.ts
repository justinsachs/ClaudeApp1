/**
 * Cloudflare R2 Storage Adapter
 * R2 is S3-compatible, so we extend S3 adapter with R2-specific config
 */

import { S3StorageAdapter, S3StorageConfig } from './S3StorageAdapter';

export interface R2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

export class R2StorageAdapter extends S3StorageAdapter {
  constructor(config: R2StorageConfig) {
    // R2 uses S3-compatible API with custom endpoint
    const s3Config: S3StorageConfig = {
      bucket: config.bucket,
      region: 'auto',
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      publicUrl: config.publicUrl
    };

    super(s3Config);
  }
}
