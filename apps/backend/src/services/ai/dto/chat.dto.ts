import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({
    description:
      'Workspace whose uploaded documents should be searched (must match file uploads).',
  })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number = 5;
}

export class ChatResponseDto {
  @ApiProperty()
  response: string;

  @ApiProperty()
  references: Array<{
    content: string;
    source?: string;
  }>;
}
