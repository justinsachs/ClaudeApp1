/**
 * Storage Adapter Factory
 * Creates the appropriate storage adapter based on environment configuration
 */

import { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { S3StorageAdapter } from './S3StorageAdapter';
import { R2StorageAdapter } from './R2StorageAdapter';

export type StorageType = 'local' | 's3' | 'r2';

export interface StorageConfig {
  type: StorageType;
  local?: {
    basePath: string;
    baseUrl: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl?: string;
  };
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    publicUrl?: string;
  };
}

export class StorageFactory {
  private static instance: StorageAdapter | null = null;

  /**
   * Get storage adapter based on environment configuration
   */
  static getAdapter(): StorageAdapter {
    if (this.instance) {
      return this.instance;
    }

    const config = this.getConfigFromEnv();
    this.instance = this.createAdapter(config);
    return this.instance;
  }

  /**
   * Create adapter from explicit configuration
   */
  static createAdapter(config: StorageConfig): StorageAdapter {
    switch (config.type) {
      case 'local':
        if (!config.local) {
          throw new Error('Local storage config is required when type is "local"');
        }
        return new LocalStorageAdapter(config.local);

      case 's3':
        if (!config.s3) {
          throw new Error('S3 storage config is required when type is "s3"');
        }
        return new S3StorageAdapter(config.s3);

      case 'r2':
        if (!config.r2) {
          throw new Error('R2 storage config is required when type is "r2"');
        }
        return new R2StorageAdapter(config.r2);

      default:
        throw new Error(`Unknown storage type: ${config.type}`);
    }
  }

  /**
   * Load configuration from environment variables
   */
  private static getConfigFromEnv(): StorageConfig {
    const type = (process.env.STORAGE_TYPE || 'local') as StorageType;

    const config: StorageConfig = { type };

    switch (type) {
      case 'local':
        config.local = {
          basePath: process.env.STORAGE_LOCAL_PATH || './data/uploads',
          baseUrl: process.env.STORAGE_LOCAL_URL || 'http://localhost:3000/uploads'
        };
        break;

      case 's3':
        config.s3 = {
          bucket: process.env.S3_BUCKET || '',
          region: process.env.S3_REGION || 'us-east-1',
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          publicUrl: process.env.S3_PUBLIC_URL
        };
        break;

      case 'r2':
        config.r2 = {
          accountId: process.env.R2_ACCOUNT_ID || '',
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
          bucket: process.env.R2_BUCKET || '',
          publicUrl: process.env.R2_PUBLIC_URL
        };
        break;
    }

    return config;
  }

  /**
   * Reset instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
