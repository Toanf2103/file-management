import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileDocument = File & Document;

export enum FileVisibility {
  SHARED = 'shared',
  ALL = 'all',
}

export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
}

@Schema({ timestamps: true })
export class FileVersion {
  @Prop({ required: true })
  version: number;

  @Prop({ required: true })
  fileName: string;

  @Prop({ default: '' })
  filePath: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true })
  action: string; // 'create', 'update', 'delete'

  @Prop({ default: Date.now })
  createdAt: Date;
}

const FileVersionSchema = SchemaFactory.createForClass(FileVersion);

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ default: '' })
  name: string; // Tên tài liệu (mô tả)

  @Prop({ required: true, enum: FileType, default: FileType.FILE })
  type: FileType;

  @Prop({ type: Types.ObjectId, ref: 'File', default: null })
  parentFolder: Types.ObjectId | null;

  @Prop({ default: '' })
  filePath: string;

  @Prop({ required: true, default: 0 })
  fileSize: number;

  @Prop({ default: '' })
  mimeType: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true, enum: FileVisibility, default: FileVisibility.ALL })
  visibility: FileVisibility;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  sharedWith: Types.ObjectId[];

  @Prop({ type: [FileVersionSchema], default: [] })
  versions: FileVersion[];

  @Prop({ default: true })
  isActive: boolean;
}

export const FileSchema = SchemaFactory.createForClass(File);

