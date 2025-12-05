import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

export enum ProjectMemberRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Schema({ timestamps: true })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ProjectMemberRole, default: ProjectMemberRole.MEMBER })
  role: ProjectMemberRole;
}

const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members: ProjectMember[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

