import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../modules/core/auth/guards/jwt-auth.guard';

@Controller('ai')
@ApiTags('AI Chat')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Query uploaded documents' })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    return await this.aiService.chatWithDocuments(chatRequest);
  }
}