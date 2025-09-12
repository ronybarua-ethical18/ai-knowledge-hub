import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Hello message returned' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Server is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running!',
      version: '1.0.0',
    };
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint for API verification' })
  @ApiResponse({ status: 200, description: 'Test response' })
  testApi() {
    return {
      success: true,
      message: 'API is working correctly!',
      data: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          health: '/health',
          test: '/test',
          auth: '/auth',
          swagger: '/api',
        },
      },
    };
  }
}
