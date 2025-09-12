import { ApiProperty } from '@nestjs/swagger';
import { User, Workspace, WorkspaceMember } from '@prisma/client';

export class WorkspaceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  role: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty({ type: [WorkspaceResponseDto], required: false })
  workspaces?: WorkspaceResponseDto[];
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;
}

export class WorkspaceListResponseDto {
  @ApiProperty({ type: [WorkspaceResponseDto] })
  workspaces: WorkspaceResponseDto[];

  @ApiProperty()
  total: number;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };

  @ApiProperty()
  createdAt: Date;
}
