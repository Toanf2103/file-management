import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/interfaces/user.interface';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false }) // Không bắt buộc nếu đăng nhập bằng Google
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ unique: true, sparse: true }) // Google ID, unique nhưng có thể null
  googleId: string;

  @Prop({ default: false })
  isGoogleUser: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

