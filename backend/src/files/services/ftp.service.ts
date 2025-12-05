import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'basic-ftp';
import * as path from 'path';

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);
  private client: Client;
  private config: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  };
  private enabled: boolean;
  private rootPath: string;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<string>('FTP_ENABLED') !== 'false';
    this.rootPath = this.configService.get<string>('FTP_ROOT_PATH') || '/';
    // Ensure root path ends with /
    if (!this.rootPath.endsWith('/')) {
      this.rootPath += '/';
    }
    
    this.config = {
      host: this.configService.get<string>('FTP_HOST') || 'localhost',
      port: parseInt(this.configService.get<string>('FTP_PORT') || '21'),
      user: this.configService.get<string>('FTP_USER') || 'ftpuser',
      password: this.configService.get<string>('FTP_PASSWORD') || 'ftppassword',
      secure: this.configService.get<string>('FTP_SECURE') === 'true',
    };

    if (!this.enabled) {
      this.logger.warn('FTP service is disabled. Files will not be uploaded to FTP server.');
    }
  }

  private async getClient(): Promise<Client> {
    if (!this.enabled) {
      throw new Error('FTP service is disabled. Please enable it in .env file (FTP_ENABLED=true)');
    }

    if (!this.client) {
      this.client = new Client(10000); // 10 seconds timeout
    }
    
    if (!this.client.closed) {
      return this.client;
    }

    try {
      await this.client.access(this.config);
      this.logger.log(`Connected to FTP server at ${this.config.host}:${this.config.port}`);
      return this.client;
    } catch (error) {
      this.logger.error(`Failed to connect to FTP server: ${error.message}`);
      this.client.close();
      throw new Error(`FTP connection failed: ${error.message}. Please check your FTP server configuration.`);
    }
  }

  private getFullPath(remotePath: string): string {
    // Remove leading slash if exists to avoid double slash
    const cleanPath = remotePath.startsWith('/') ? remotePath.substring(1) : remotePath;
    // Combine root path with remote path
    return path.posix.join(this.rootPath, cleanPath).replace(/\\/g, '/');
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    try {
      const client = await this.getClient();
      const fullPath = this.getFullPath(remotePath);
      const dirPath = path.posix.dirname(fullPath);
      
      // Change to root directory first
      if (this.rootPath !== '/') {
        await client.cd(this.rootPath);
      }
      
      await client.ensureDir(dirPath);
      await client.uploadFrom(localPath, fullPath);
      this.logger.debug(`File uploaded: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to upload file ${remotePath}: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    try {
      const client = await this.getClient();
      const fullPath = this.getFullPath(remotePath);
      
      // Change to root directory first
      if (this.rootPath !== '/') {
        await client.cd(this.rootPath);
      }
      
      await client.downloadTo(localPath, fullPath);
      this.logger.debug(`File downloaded: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to download file ${remotePath}: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(remotePath: string): Promise<void> {
    try {
      const client = await this.getClient();
      const fullPath = this.getFullPath(remotePath);
      
      // Change to root directory first
      if (this.rootPath !== '/') {
        await client.cd(this.rootPath);
      }
      
      await client.remove(fullPath);
      this.logger.debug(`File deleted: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${remotePath}: ${error.message}`);
      throw error;
    }
  }

  async fileExists(remotePath: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const fullPath = this.getFullPath(remotePath);
      
      // Change to root directory first
      if (this.rootPath !== '/') {
        await client.cd(this.rootPath);
      }
      
      await client.size(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client && !this.client.closed) {
      this.client.close();
    }
  }
}

