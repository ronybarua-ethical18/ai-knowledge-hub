export const SWAGGER_API_ROOT = 'api/docs';
export const SWAGGER_API_NAME = 'AI Knowledge Hub API';
export const SWAGGER_API_DESCRIPTION = `
# AI Knowledge Hub API

A comprehensive API for managing AI-powered document workspaces with intelligent chat capabilities.

## Features
- **User Authentication**: JWT-based authentication with email verification
- **Workspace Management**: Create and manage personal/team workspaces
- **Document Processing**: Upload and process documents for AI analysis
- **AI Chat**: Intelligent conversations with your documents
- **Role-Based Access**: Granular permissions for workspace collaboration

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Workspace Roles
- **OWNER**: Full control over workspace and members
- **MEMBER**: Can upload documents and chat with AI
- **VIEWER**: Read-only access to workspace content
`;
export const SWAGGER_API_CURRENT_VERSION = '1.0.0';
