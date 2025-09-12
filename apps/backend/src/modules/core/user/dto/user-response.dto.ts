import { ApiProperty } from '@nestjs/swagger';
import { UserRole, AuthProvider } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: AuthProvider })
  provider: AuthProvider;

  @ApiProperty()
  isEmailVerified: boolean;

  @ApiProperty()
  mfaEnabled: boolean;

  @ApiProperty()
  isOnboarded: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
