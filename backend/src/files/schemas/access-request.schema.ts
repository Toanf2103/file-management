import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccessRequestDocument = AccessRequest & Document;

export enum AccessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class AccessRequest {
  @Prop({ type: Types.ObjectId, ref: 'File' })
  fileId: Types.ObjectId; // File hoặc folder cần truy cập

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy: Types.ObjectId; // Người yêu cầu

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  projectOwner: Types.ObjectId; // Trưởng dự án

  @Prop({ required: true, enum: AccessRequestStatus, default: AccessRequestStatus.PENDING })
  status: AccessRequestStatus;

  @Prop({ default: '' })
  message: string; // Lời nhắn từ người yêu cầu

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId; // Người phê duyệt/từ chối

  @Prop()
  reviewMessage: string; // Lời nhắn từ người phê duyệt
}

export const AccessRequestSchema = SchemaFactory.createForClass(AccessRequest);

