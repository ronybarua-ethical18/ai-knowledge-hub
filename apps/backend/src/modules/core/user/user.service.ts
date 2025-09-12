import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { User, Prisma, UserRole, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(data: {
    email: string;
    password?: string;
    fullName: string;
    role?: UserRole;
    provider?: AuthProvider;
    isEmailVerified?: boolean;
    avatarUrl?: string;
    preferences?: Record<string, any>;
  }): Promise<User> {
    const existingUser = await this.databaseService.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 12)
      : null;

    const user = await this.databaseService.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role || UserRole.USER,
        provider: data.provider || AuthProvider.CREDENTIALS,
        isEmailVerified: data.isEmailVerified || false,
        avatarUrl: data.avatarUrl,
        preferences: data.preferences,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.databaseService.user.update({
      where: { id },
      data,
    });
  }

  async verifyEmail(id: string): Promise<User> {
    return this.databaseService.user.update({
      where: { id },
      data: { isEmailVerified: true },
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.databaseService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
