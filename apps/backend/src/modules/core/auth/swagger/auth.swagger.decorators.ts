import {
  applyDecorators,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  CreateWorkspaceDto,
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from '../dto/auth.dto';
import {
  AuthResponseDto,
  TokenResponseDto,
  WorkspaceResponseDto,
  WorkspaceListResponseDto,
  WorkspaceMemberResponseDto,
} from '../dto/auth-response.dto';

// ========================================
// AUTHENTICATION SWAGGER DECORATORS
// ========================================

export const RegisterSwagger = () =>
  applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Creates a new user account and automatically creates a default personal workspace.',
    }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully',
      type: AuthResponseDto,
    }),
    ApiResponse({ status: 409, description: 'User already exists' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  );

export const LoginSwagger = () =>
  applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Login with email and password',
      description: 'Authenticates a user with email and password credentials.',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      type: AuthResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or email not verified',
    }),
  );

export const RefreshTokenSwagger = () =>
  applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Generates new access and refresh tokens using a valid refresh token.',
    }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully',
      type: TokenResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Invalid refresh token' }),
  );

export const LogoutSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Logout user',
      description:
        'Logs out the authenticated user and invalidates their session.',
    }),
    ApiResponse({ status: 200, description: 'Logout successful' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );

export const GetProfileSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get current user profile',
      description:
        'Retrieves the profile information of the authenticated user.',
    }),
    ApiResponse({ status: 200, description: 'User profile retrieved' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );

// ========================================
// WORKSPACE SWAGGER DECORATORS
// ========================================

export const CreateWorkspaceSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create a new workspace',
      description:
        'Creates a new workspace for document management and AI chat.',
      tags: ['Workspaces'],
    }),
    ApiBody({ type: CreateWorkspaceDto }),
    ApiResponse({
      status: 201,
      description: 'Workspace created successfully',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  );

export const GetWorkspacesSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get user workspaces',
      description:
        'Retrieves all workspaces that the authenticated user has access to.',
      tags: ['Workspaces'],
    }),
    ApiResponse({
      status: 200,
      description: 'Workspaces retrieved successfully',
      type: WorkspaceListResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );

export const GetWorkspaceSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get workspace details',
      description: 'Retrieves detailed information about a specific workspace.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiResponse({
      status: 200,
      description: 'Workspace retrieved successfully',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 404,
      description: 'Workspace not found or access denied',
    }),
  );

export const UpdateWorkspaceSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Update workspace',
      description:
        'Updates workspace information. Only workspace owners can update.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiResponse({
      status: 200,
      description: 'Workspace updated successfully',
      type: WorkspaceResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only workspace owners can update',
    }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  );

export const DeleteWorkspaceSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete workspace',
      description:
        'Deletes a workspace and all its content. Only workspace owners can delete.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiResponse({ status: 200, description: 'Workspace deleted successfully' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only workspace owners can delete',
    }),
    ApiResponse({ status: 404, description: 'Workspace not found' }),
  );

export const InviteWorkspaceMemberSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Invite member to workspace',
      description: 'Invites a user to join a workspace with a specific role.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiBody({ type: InviteWorkspaceMemberDto }),
    ApiResponse({ status: 201, description: 'Member invited successfully' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only workspace owners can invite members',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
    ApiResponse({
      status: 400,
      description: 'User already a member or validation error',
    }),
  );

export const GetWorkspaceMembersSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get workspace members',
      description:
        'Retrieves all members of a specific workspace with their roles.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiResponse({
      status: 200,
      description: 'Members retrieved successfully',
      type: [WorkspaceMemberResponseDto],
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Access denied to workspace',
    }),
  );

export const UpdateWorkspaceMemberSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Update workspace member role',
      description:
        'Updates the role of a workspace member. Only workspace owners can update roles.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiParam({
      name: 'memberId',
      description: 'Unique identifier of the member',
    }),
    ApiResponse({
      status: 200,
      description: 'Member role updated successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only workspace owners can update member roles',
    }),
    ApiResponse({ status: 404, description: 'Member not found' }),
  );

export const RemoveWorkspaceMemberSwagger = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Remove workspace member',
      description:
        'Removes a member from the workspace. Only workspace owners can remove members.',
      tags: ['Workspaces'],
    }),
    ApiParam({
      name: 'workspaceId',
      description: 'Unique identifier of the workspace',
    }),
    ApiParam({
      name: 'memberId',
      description: 'Unique identifier of the member',
    }),
    ApiResponse({ status: 200, description: 'Member removed successfully' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Only workspace owners can remove members',
    }),
    ApiResponse({ status: 404, description: 'Member not found' }),
  );
