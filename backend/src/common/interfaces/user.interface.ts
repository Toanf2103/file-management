export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface IUser {
  _id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

