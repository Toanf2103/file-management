import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { UserRole } from '../interfaces/user.interface';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  async createDefaultAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminFullName = process.env.ADMIN_FULL_NAME || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await this.userModel.findOne({ 
      email: adminEmail,
      role: UserRole.ADMIN 
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Check if any admin exists
    const anyAdmin = await this.userModel.findOne({ role: UserRole.ADMIN });
    if (anyAdmin) {
      console.log('Admin user already exists with different email');
      return;
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = new this.userModel({
      email: adminEmail,
      password: hashedPassword,
      fullName: adminFullName,
      role: UserRole.ADMIN,
    });

    await admin.save();
    console.log('Default admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the password after first login!');
  }
}

