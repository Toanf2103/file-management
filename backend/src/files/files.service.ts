import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { File, FileDocument, FileVisibility, FileType } from './schemas/file.schema';
import { FtpService } from './services/ftp.service';
import { ProjectsService } from '../projects/projects.service';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    private ftpService: FtpService,
    private projectsService: ProjectsService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    projectId: string,
    userId: string,
    visibility: FileVisibility,
    sharedWith: string[] = [],
    userRole: string = 'user',
    name?: string,
    parentFolderId?: string,
  ): Promise<File> {
    // Verify project access
    const project = await this.projectsService.findOne(projectId, userId, userRole);
    if (userRole !== 'admin' && !this.projectsService.isProjectMember(project, userId)) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Generate unique file name
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
    const remotePath = `projects/${projectId}/${uniqueFileName}`;

    // Save file temporarily
    const tempPath = path.join(process.cwd(), 'temp', uniqueFileName);
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, file.buffer);

    try {
      // Upload to FTP
      await this.ftpService.uploadFile(tempPath, remotePath);

      // Validate parent folder if provided
      let parentFolder: Types.ObjectId | null = null;
      if (parentFolderId) {
        const parent = await this.fileModel.findById(parentFolderId);
        if (!parent || !parent.isActive || parent.type !== FileType.FOLDER) {
          throw new BadRequestException('Invalid parent folder');
        }
        if (parent.projectId.toString() !== projectId) {
          throw new ForbiddenException('Parent folder does not belong to this project');
        }
        parentFolder = new Types.ObjectId(parentFolderId);
      }

      // Create file record
      const fileRecord = new this.fileModel({
        fileName: uniqueFileName,
        originalName: file.originalname,
        name: name || file.originalname,
        type: FileType.FILE,
        parentFolder,
        filePath: remotePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        projectId: new Types.ObjectId(projectId),
        uploadedBy: new Types.ObjectId(userId),
        visibility,
        sharedWith: sharedWith.map(id => new Types.ObjectId(id)),
        versions: [{
          version: 1,
          fileName: uniqueFileName,
          filePath: remotePath,
          fileSize: file.size,
          uploadedBy: new Types.ObjectId(userId),
          action: 'create',
          createdAt: new Date(),
        }],
        isActive: true,
      });

      return fileRecord.save();
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  async updateFile(
    fileId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<File> {
    const fileRecord = await this.fileModel.findById(fileId);
    if (!fileRecord || !fileRecord.isActive) {
      throw new NotFoundException('File not found');
    }

    // Only uploader can update
    if (fileRecord.uploadedBy.toString() !== userId) {
      throw new ForbiddenException('Only the uploader can update this file');
    }

    // Generate new file name
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
    const remotePath = `projects/${fileRecord.projectId}/${uniqueFileName}`;

    // Save file temporarily
    const tempPath = path.join(process.cwd(), 'temp', uniqueFileName);
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });
    fs.writeFileSync(tempPath, file.buffer);

    try {
      // Upload new version to FTP
      await this.ftpService.uploadFile(tempPath, remotePath);

      // Add version history
      const newVersion = fileRecord.versions.length + 1;
      fileRecord.versions.push({
        version: newVersion,
        fileName: uniqueFileName,
        filePath: remotePath,
        fileSize: file.size,
        uploadedBy: new Types.ObjectId(userId),
        action: 'update',
        createdAt: new Date(),
      });

      // Update file record
      fileRecord.fileName = uniqueFileName;
      fileRecord.originalName = file.originalname;
      fileRecord.filePath = remotePath;
      fileRecord.fileSize = file.size;
      fileRecord.mimeType = file.mimetype;

      return fileRecord.save();
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  async deleteFile(fileId: string, userId: string, userRole: string): Promise<void> {
    const fileRecord = await this.fileModel.findById(fileId);
    if (!fileRecord || !fileRecord.isActive) {
      throw new NotFoundException('File not found');
    }

    // Only uploader or admin can delete
    if (fileRecord.uploadedBy.toString() !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Only the uploader can delete this file');
    }

    // Add delete version to history
    fileRecord.versions.push({
      version: fileRecord.versions.length + 1,
      fileName: fileRecord.fileName,
      filePath: fileRecord.filePath,
      fileSize: fileRecord.fileSize,
      uploadedBy: new Types.ObjectId(userId),
      action: 'delete',
      createdAt: new Date(),
    });

    // Mark as inactive (soft delete)
    fileRecord.isActive = false;
    await fileRecord.save();

    // Optionally delete from FTP
    // await this.ftpService.deleteFile(fileRecord.filePath);
  }

  async getFiles(
    projectId: string,
    userId: string,
    userRole: string,
    parentFolderId?: string,
  ): Promise<File[]> {
    // Verify project access (this will throw if user doesn't have access)
    const project = await this.projectsService.findOne(projectId, userId, userRole);

    const query: any = {
      projectId: new Types.ObjectId(projectId),
      isActive: true,
    };

    // Filter by parent folder
    if (parentFolderId) {
      query.parentFolder = new Types.ObjectId(parentFolderId);
    } else {
      query.parentFolder = null;
    }

    if (userRole !== 'admin') {
      const isOwner = this.projectsService.isProjectOwner(project, userId);
      
      if (isOwner) {
        // Owner can see all files
      } else {
        // Regular members can only see files with visibility 'all' or files shared with them
        // Folders are always visible to all members
        query.$or = [
          { type: FileType.FOLDER },
          { visibility: FileVisibility.ALL },
          { sharedWith: new Types.ObjectId(userId) },
        ];
      }
    }

    return this.fileModel.find(query).populate('uploadedBy', 'email fullName').sort({ type: 1, name: 1 }).exec();
  }

  async getFile(fileId: string, userId: string, userRole: string): Promise<File> {
    const fileRecord = await this.fileModel.findById(fileId).populate('uploadedBy', 'email fullName');
    if (!fileRecord || !fileRecord.isActive) {
      throw new NotFoundException('File not found');
    }

    // Check access
    if (userRole === 'admin') {
      return fileRecord;
    }

    const project = await this.projectsService.findOne(
      fileRecord.projectId.toString(),
      userId,
      userRole
    );

    const isOwner = this.projectsService.isProjectOwner(project, userId);
    const isShared = fileRecord.sharedWith.some(id => id.toString() === userId);

    if (
      fileRecord.visibility === FileVisibility.ALL ||
      isOwner ||
      isShared ||
      fileRecord.uploadedBy.toString() === userId
    ) {
      return fileRecord;
    }

    throw new ForbiddenException('You do not have access to this file');
  }

  async downloadFile(fileId: string, userId: string, userRole: string): Promise<{ stream: NodeJS.ReadableStream; fileName: string; mimeType: string; tempPath: string }> {
    const fileRecord = await this.getFile(fileId, userId, userRole);

    const tempPath = path.join(process.cwd(), 'temp', `${crypto.randomUUID()}-${fileRecord.fileName}`);
    fs.mkdirSync(path.dirname(tempPath), { recursive: true });

    await this.ftpService.downloadFile(fileRecord.filePath, tempPath);

    const stream = fs.createReadStream(tempPath);
    
    return {
      stream,
      fileName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      tempPath,
    };
  }

  async getFileHistory(fileId: string, userId: string, userRole: string): Promise<any> {
    const fileRecord = await this.getFile(fileId, userId, userRole);
    return fileRecord.versions;
  }

  async createFolder(
    projectId: string,
    userId: string,
    name: string,
    parentFolderId?: string,
    userRole: string = 'user',
  ): Promise<File> {
    // Verify project access
    const project = await this.projectsService.findOne(projectId, userId, userRole);
    if (userRole !== 'admin' && !this.projectsService.isProjectMember(project, userId)) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Validate parent folder if provided
    let parentFolder: Types.ObjectId | null = null;
    if (parentFolderId) {
      const parent = await this.fileModel.findById(parentFolderId);
      if (!parent || !parent.isActive || parent.type !== FileType.FOLDER) {
        throw new BadRequestException('Invalid parent folder');
      }
      if (parent.projectId.toString() !== projectId) {
        throw new ForbiddenException('Parent folder does not belong to this project');
      }
      parentFolder = new Types.ObjectId(parentFolderId);
    }

    // Check if folder with same name already exists in same location
    const existingFolder = await this.fileModel.findOne({
      projectId: new Types.ObjectId(projectId),
      parentFolder: parentFolder || null,
      name,
      type: FileType.FOLDER,
      isActive: true,
    });

    if (existingFolder) {
      throw new ConflictException('Folder with this name already exists in this location');
    }

    // Create folder record
    const folder = new this.fileModel({
      fileName: name,
      originalName: name,
      name,
      type: FileType.FOLDER,
      parentFolder,
      filePath: `folders/${projectId}/${name}`, // Dummy path for folder
      fileSize: 0,
      mimeType: '',
      projectId: new Types.ObjectId(projectId),
      uploadedBy: new Types.ObjectId(userId),
      visibility: FileVisibility.ALL,
      sharedWith: [],
      versions: [{
        version: 1,
        fileName: name,
        filePath: `folders/${projectId}/${name}`, // Dummy path for folder
        fileSize: 0,
        uploadedBy: new Types.ObjectId(userId),
        action: 'create',
        createdAt: new Date(),
      }],
      isActive: true,
    });

    return folder.save();
  }

  async moveItem(
    itemId: string,
    targetFolderId: string | null,
    userId: string,
    userRole: string,
  ): Promise<File> {
    const item = await this.fileModel.findById(itemId);
    if (!item || !item.isActive) {
      throw new NotFoundException('Item not found');
    }

    // Check if user can move this item
    const project = await this.projectsService.findOne(
      item.projectId.toString(),
      userId,
      userRole,
    );
    const isOwner = this.projectsService.isProjectOwner(project, userId);

    if (userRole !== 'admin' && !isOwner) {
      // Regular users can only move their own folders
      if (item.type !== FileType.FOLDER || item.uploadedBy.toString() !== userId) {
        throw new ForbiddenException('You can only move your own folders');
      }
    }

    // Validate target folder if provided
    let targetFolder: Types.ObjectId | null = null;
    if (targetFolderId) {
      const target = await this.fileModel.findById(targetFolderId);
      if (!target || !target.isActive || target.type !== FileType.FOLDER) {
        throw new BadRequestException('Invalid target folder');
      }
      if (target.projectId.toString() !== item.projectId.toString()) {
        throw new ForbiddenException('Target folder does not belong to this project');
      }
      // Prevent moving folder into itself or its children
      if (target._id.toString() === itemId) {
        throw new BadRequestException('Cannot move folder into itself');
      }
      // Check if target is a child of the item being moved
      let currentParent = target.parentFolder;
      while (currentParent) {
        if (currentParent.toString() === itemId) {
          throw new BadRequestException('Cannot move folder into its own subfolder');
        }
        const parent = await this.fileModel.findById(currentParent);
        if (!parent) break;
        currentParent = parent.parentFolder;
      }
      targetFolder = new Types.ObjectId(targetFolderId);
    }

    // Check if item with same name already exists in target location
    const existingItem = await this.fileModel.findOne({
      projectId: item.projectId,
      parentFolder: targetFolder || null,
      name: item.name,
      type: item.type,
      isActive: true,
      _id: { $ne: itemId },
    });

    if (existingItem) {
      throw new ConflictException('An item with this name already exists in the target location');
    }

    // Update parent folder
    item.parentFolder = targetFolder;
    await item.save();

    return item;
  }
}

