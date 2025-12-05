import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { FilesService } from './files.service';
import { FtpService } from './services/ftp.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { MoveItemDto } from './dto/move-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileVisibility } from './schemas/file.schema';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly ftpService: FtpService,
  ) {}

  @Post('upload/:projectId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    let sharedWith: string[] = [];
    if (body.sharedWith) {
      try {
        sharedWith = typeof body.sharedWith === 'string' 
          ? JSON.parse(body.sharedWith) 
          : body.sharedWith;
      } catch {
        sharedWith = Array.isArray(body.sharedWith) ? body.sharedWith : [];
      }
    }
    
    return this.filesService.uploadFile(
      file,
      projectId,
      req.user.userId,
      body.visibility || 'all',
      sharedWith,
      req.user.role,
      body.name,
      body.parentFolderId,
    );
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    return this.filesService.updateFile(id, file, req.user.userId);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string, @Request() req) {
    return this.filesService.deleteFile(id, req.user.userId, req.user.role);
  }

  @Get('project/:projectId')
  async getFiles(
    @Param('projectId') projectId: string,
    @Request() req,
  ) {
    const parentFolderId = req.query?.parentFolderId as string | undefined;
    return this.filesService.getFiles(
      projectId,
      req.user.userId,
      req.user.role,
      parentFolderId,
    );
  }

  @Get('download-avatar')
  async downloadAvatar(@Query('path') avatarPath: string, @Res() res: Response) {
    if (!avatarPath) {
      return res.status(400).json({ message: 'Path is required' });
    }

    const tempPath = path.join(process.cwd(), 'temp', `avatar_${crypto.randomUUID()}`);

    try {
      fs.mkdirSync(path.dirname(tempPath), { recursive: true });
      await this.ftpService.downloadFile(avatarPath, tempPath);

      const stream = fs.createReadStream(tempPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      stream.on('end', () => {
        if (fs.existsSync(tempPath)) {
          setTimeout(() => {
            try {
              fs.unlinkSync(tempPath);
            } catch (error) {
              // Ignore cleanup errors
            }
          }, 1000);
        }
      });

      stream.on('error', () => {
        if (fs.existsSync(tempPath)) {
          try {
            fs.unlinkSync(tempPath);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      });

      stream.pipe(res);
    } catch (error) {
      res.status(404).json({ message: 'Avatar not found' });
    }
  }

  @Post('folder/:projectId')
  async createFolder(
    @Param('projectId') projectId: string,
    @Body() createFolderDto: CreateFolderDto,
    @Request() req,
  ) {
    return this.filesService.createFolder(
      projectId,
      req.user.userId,
      createFolderDto.name,
      createFolderDto.parentFolderId,
      req.user.role,
    );
  }

  @Put(':id/move')
  async moveItem(
    @Param('id') id: string,
    @Body() moveItemDto: MoveItemDto,
    @Request() req,
  ) {
    return this.filesService.moveItem(
      id,
      moveItemDto.targetFolderId || null,
      req.user.userId,
      req.user.role,
    );
  }

  @Get(':id')
  async getFile(@Param('id') id: string, @Request() req) {
    return this.filesService.getFile(id, req.user.userId, req.user.role);
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const { stream, fileName, mimeType, tempPath } = await this.filesService.downloadFile(
      id,
      req.user.userId,
      req.user.role,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    const fs = require('fs');
    
    stream.on('end', () => {
      // Clean up temp file after streaming
      if (fs.existsSync(tempPath)) {
        setTimeout(() => {
          try {
            fs.unlinkSync(tempPath);
          } catch (error) {
            // Ignore cleanup errors
          }
        }, 1000);
      }
    });

    stream.on('error', () => {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    stream.pipe(res);
  }

  @Get(':id/history')
  async getFileHistory(@Param('id') id: string, @Request() req) {
    return this.filesService.getFileHistory(id, req.user.userId, req.user.role);
  }
}

