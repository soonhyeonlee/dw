import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LlmService } from './llm.service';
import { ChatRequestDto } from './dto/chat.dto';

@ApiTags('LLM')
@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('models')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getModels() {
    return { success: true, data: this.llmService.getAvailableModels() };
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async chat(@Body() dto: ChatRequestDto) {
    const result = await this.llmService.chat(dto);
    return { success: true, data: result };
  }
}
