import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiConsumes,
  ApiProduces,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  RegisterSwagger,
  LoginSwagger,
  RefreshTokenSwagger,
  LogoutSwagger,
  GetProfileSwagger,
  CreateWorkspaceSwagger,
  GetWorkspacesSwagger,
  GetWorkspaceSwagger,
  UpdateWorkspaceSwagger,
  DeleteWorkspaceSwagger,
  InviteWorkspaceMemberSwagger,
  GetWorkspaceMembersSwagger,
  UpdateWorkspaceMemberSwagger,
  RemoveWorkspaceMemberSwagger,
} from './swagger/auth.swagger.decorators';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
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
import { User, UserRole } from '@prisma/client';
import { UserResponseDto } from '../user/dto/user-response.dto';

@Controller('auth')
@ApiTags('Authentication')
@ApiProduces('application/json')
@ApiConsumes('application/json')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @RegisterSwagger()
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @LoginSwagger()
  async login(
    @Request() req,
    @Body() loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @RefreshTokenSwagger()
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @LogoutSwagger()
  async logout(@CurrentUser() user: User): Promise<void> {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @GetProfileSwagger()
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<User> {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(
    @Body() _resendVerificationDto: ResendVerificationDto,
  ): Promise<void> {
    // TODO: Implement resend verification logic
    return;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid reset token' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  // ========================================
  // WORKSPACE MANAGEMENT ENDPOINTS
  // ========================================

  @Post('workspaces')
  @CreateWorkspaceSwagger()
  async createWorkspace(
    @CurrentUser() user: User,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.authService.createWorkspace(
      user.id,
      createWorkspaceDto,
    );
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      slug: workspace.slug,
      isPublic: workspace.isPublic,
      role: 'OWNER',
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  @Get('workspaces')
  @GetWorkspacesSwagger()
  async getUserWorkspaces(
    @CurrentUser() user: User,
  ): Promise<WorkspaceListResponseDto> {
    const workspaces = await this.authService.getUserWorkspaces(user.id);
    return {
      workspaces,
      total: workspaces.length,
    };
  }

  @Get('workspaces/:workspaceId')
  @GetWorkspaceSwagger()
  async getWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.authService.getWorkspace(workspaceId, user.id);
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      slug: workspace.slug,
      isPublic: workspace.isPublic,
      role: 'MEMBER', // This should be determined from membership
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  @Put('workspaces/:workspaceId')
  @UpdateWorkspaceSwagger()
  async updateWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.authService.updateWorkspace(
      workspaceId,
      user.id,
      updateWorkspaceDto,
    );
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      slug: workspace.slug,
      isPublic: workspace.isPublic,
      role: 'OWNER',
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  @Delete('workspaces/:workspaceId')
  @DeleteWorkspaceSwagger()
  async deleteWorkspace(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ): Promise<void> {
    return this.authService.deleteWorkspace(workspaceId, user.id);
  }

  @Post('workspaces/:workspaceId/members')
  @InviteWorkspaceMemberSwagger()
  async inviteWorkspaceMember(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() inviteDto: InviteWorkspaceMemberDto,
  ): Promise<void> {
    return this.authService.inviteWorkspaceMember(
      workspaceId,
      user.id,
      inviteDto,
    );
  }

  @Get('workspaces/:workspaceId/members')
  @GetWorkspaceMembersSwagger()
  async getWorkspaceMembers(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return this.authService.getWorkspaceMembers(workspaceId, user.id);
  }

  @Put('workspaces/:workspaceId/members/:memberId')
  @UpdateWorkspaceMemberSwagger()
  async updateWorkspaceMember(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateWorkspaceMemberDto,
  ): Promise<void> {
    return this.authService.updateWorkspaceMember(
      workspaceId,
      memberId,
      user.id,
      updateDto,
    );
  }

  @Delete('workspaces/:workspaceId/members/:memberId')
  @RemoveWorkspaceMemberSwagger()
  async removeWorkspaceMember(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    return this.authService.removeWorkspaceMember(
      workspaceId,
      memberId,
      user.id,
    );
  }

  // Admin-only endpoints
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsers(): Promise<User[]> {
    // TODO: Implement get all users logic
    return [];
  }
}
