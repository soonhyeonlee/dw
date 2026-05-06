import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRequestDto, LlmProvider } from './dto/chat.dto';

@Injectable()
export class LlmService {
  private readonly openaiKey: string;
  private readonly geminiKey: string;

  constructor(private config: ConfigService) {
    this.openaiKey = this.config.get<string>('OPENAI_API_KEY', '');
    this.geminiKey = this.config.get<string>('GEMINI_API_KEY', '');
  }

  async chat(dto: ChatRequestDto): Promise<{ reply: string; model: string }> {
    const isGpt = dto.model.startsWith('gpt-');
    if (isGpt) {
      return this.callOpenAI(dto);
    }
    return this.callGemini(dto);
  }

  private async callOpenAI(dto: ChatRequestDto): Promise<{ reply: string; model: string }> {
    if (!this.openaiKey) {
      throw new BadRequestException('OPENAI_API_KEY가 설정되지 않았습니다');
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (dto.systemPrompt) {
      messages.push({ role: 'system', content: dto.systemPrompt });
    }
    messages.push(...dto.messages.map((m) => ({ role: m.role, content: m.content })));

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: dto.model,
        messages,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new BadRequestException(err?.error?.message || 'OpenAI API 호출 실패');
    }

    const data = await res.json();
    return {
      reply: data.choices[0].message.content,
      model: dto.model,
    };
  }

  private async callGemini(dto: ChatRequestDto): Promise<{ reply: string; model: string }> {
    if (!this.geminiKey) {
      throw new BadRequestException('GEMINI_API_KEY가 설정되지 않았습니다');
    }

    const contents = dto.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemInstruction = dto.systemPrompt
      ? { parts: [{ text: dto.systemPrompt }] }
      : undefined;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${dto.model}:generateContent?key=${this.geminiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemInstruction && { systemInstruction }),
        generationConfig: { maxOutputTokens: 4096 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new BadRequestException(err?.error?.message || 'Gemini API 호출 실패');
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      reply: text,
      model: dto.model,
    };
  }

  getAvailableModels() {
    return [
      { id: LlmProvider.GPT_4O, name: 'GPT-4o', provider: 'OpenAI' },
      { id: LlmProvider.GPT_4O_MINI, name: 'GPT-4o Mini', provider: 'OpenAI' },
      { id: LlmProvider.GPT_4_TURBO, name: 'GPT-4 Turbo', provider: 'OpenAI' },
      { id: LlmProvider.GEMINI_2_0_FLASH, name: 'Gemini 2.0 Flash', provider: 'Google' },
      { id: LlmProvider.GEMINI_1_5_PRO, name: 'Gemini 1.5 Pro', provider: 'Google' },
      { id: LlmProvider.GEMINI_1_5_FLASH, name: 'Gemini 1.5 Flash', provider: 'Google' },
    ];
  }
}
