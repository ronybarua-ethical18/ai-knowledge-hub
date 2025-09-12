import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { DatabaseService } from '../../../database/database.service';
import {
  User,
  AuthProvider,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '@prisma/client';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  TokenResponseDto,
  WorkspaceResponseDto,
  WorkspaceListResponseDto,
  WorkspaceMemberResponseDto,
} from './dto/auth-response.dto';
import { env } from '../../../config/env.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const tokens = await this.generateTokens(user);
    const workspaces = await this.getUserWorkspaces(user.id);

    return {
      user,
      ...tokens,
      workspaces,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.userService.createUser({
      email: registerDto.email,
      password: registerDto.password,
      fullName: registerDto.fullName,
      role: registerDto.role,
      avatarUrl: registerDto.avatarUrl,
      preferences: registerDto.preferences,
    });

    // Create default workspace for new user
    const defaultWorkspace = await this.createWorkspace(user.id, {
      name: `${user.fullName}'s Workspace`,
      description: 'My personal workspace',
    });

    // TODO: Send email verification
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    const tokens = await this.generateTokens(user);
    const workspaces = await this.getUserWorkspaces(user.id);

    return {
      user,
      ...tokens,
      workspaces,
    };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: env.config.JWT_SECRET,
      });

      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(_userId: string): Promise<void> {
    // TODO: Implement token blacklisting or refresh token rotation
    // For now, we'll just return void as the client should delete the tokens
  }

  async verifyEmail(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: env.config.JWT_SECRET,
      });

      if (payload.type !== 'email-verification') {
        throw new BadRequestException('Invalid token type');
      }

      return await this.userService.verifyEmail(payload.sub);
    } catch (error) {
      throw new BadRequestException('Invalid verification token');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    const _resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // TODO: Send password reset email
    // await this.emailService.sendPasswordResetEmail(user.email, _resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: env.config.JWT_SECRET,
      });

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid token type');
      }

      await this.userService.updatePassword(payload.sub, newPassword);
    } catch (error) {
      throw new BadRequestException('Invalid reset token');
    }
  }

  async handleOAuthLogin(
    profile: { email: string; name: string },
    provider: AuthProvider,
  ): Promise<AuthResponseDto> {
    let user = await this.userService.findByEmail(profile.email);

    if (!user) {
      // Create new user from OAuth profile
      user = await this.userService.createUser({
        email: profile.email,
        fullName: profile.name,
        provider,
        isEmailVerified: true, // OAuth users are pre-verified
      });
    } else if (user.provider !== provider) {
      // User exists but with different provider
      throw new BadRequestException(
        `Account already exists with ${user.provider} provider`,
      );
    }

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  private async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  // Workspace Management Methods
  async createWorkspace(
    userId: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    const slug = this.generateSlug(createWorkspaceDto.name);

    return this.databaseService.workspace.create({
      data: {
        name: createWorkspaceDto.name,
        description: createWorkspaceDto.description,
        slug,
        settings: createWorkspaceDto.settings,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
    });
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceResponseDto[]> {
    const memberships = await this.databaseService.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    return memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      description: membership.workspace.description,
      slug: membership.workspace.slug,
      isPublic: membership.workspace.isPublic,
      role: membership.role,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
    }));
  }

  async getWorkspace(workspaceId: string, userId: string): Promise<Workspace> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    return membership.workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only workspace owners can update workspace',
      );
    }

    return this.databaseService.workspace.update({
      where: { id: workspaceId },
      data: {
        name: updateWorkspaceDto.name,
        description: updateWorkspaceDto.description,
        settings: updateWorkspaceDto.settings,
      },
    });
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only workspace owners can delete workspace',
      );
    }

    await this.databaseService.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async inviteWorkspaceMember(
    workspaceId: string,
    userId: string,
    inviteDto: InviteWorkspaceMemberDto,
  ): Promise<void> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only workspace owners can invite members');
    }

    const invitedUser = await this.userService.findByEmail(inviteDto.email);
    if (!invitedUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMembership =
      await this.databaseService.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: invitedUser.id,
        },
      });

    if (existingMembership) {
      throw new BadRequestException(
        'User is already a member of this workspace',
      );
    }

    await this.databaseService.workspaceMember.create({
      data: {
        userId: invitedUser.id,
        workspaceId,
        role: inviteDto.role as WorkspaceRole,
      },
    });

    // TODO: Send invitation email
  }

  async getWorkspaceMembers(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied to workspace');
    }

    const members = await this.databaseService.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      workspaceId: member.workspaceId,
      role: member.role,
      user: member.user,
      createdAt: member.createdAt,
    }));
  }

  async updateWorkspaceMember(
    workspaceId: string,
    memberId: string,
    userId: string,
    updateDto: UpdateWorkspaceMemberDto,
  ): Promise<void> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only workspace owners can update member roles',
      );
    }

    await this.databaseService.workspaceMember.update({
      where: { id: memberId },
      data: {
        role: updateDto.role as WorkspaceRole,
      },
    });
  }

  async removeWorkspaceMember(
    workspaceId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.databaseService.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: WorkspaceRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only workspace owners can remove members');
    }

    await this.databaseService.workspaceMember.delete({
      where: { id: memberId },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
