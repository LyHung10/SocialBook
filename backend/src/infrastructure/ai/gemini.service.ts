import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { OpenAICompatibleClient } from './openai-compatible.client';

@Injectable()
export class GeminiService implements IGeminiService, OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private client!: OpenAICompatibleClient;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit(): void {
    const apiKey = this.configService.get<string>('env.MODERATION_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'MODERATION_API_KEY is not configured. GeminiService cannot start.',
      );
    }

    this.client = new OpenAICompatibleClient({
      apiKey,
      baseUrl:
        this.configService.get<string>('env.MODERATION_API_BASE_URL') ??
        'https://platform.beeknoee.com/v1',
      model:
        this.configService.get<string>('env.MODERATION_MODEL') ??
        'gemini-2.5-flash-lite',
      timeout:
        this.configService.get<number>('env.MODERATION_TIMEOUT') ?? 15_000,
    });

    this.logger.log(
      `GeminiService initialised with model "${this.configService.get<string>('env.MODERATION_MODEL')}" via Beenoee.`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core primitives
  // ---------------------------------------------------------------------------

  async generateText(prompt: string): Promise<string> {
    return this.client.generateText(prompt);
  }

  async generateJSON<T>(prompt: string): Promise<T> {
    return this.client.generateJSON<T>(prompt);
  }

  async embedText(text: string): Promise<number[]> {
    return this.client.embedText(text);
  }

  // ---------------------------------------------------------------------------
  // Higher-level helpers (built on top of core primitives)
  // ---------------------------------------------------------------------------

  async summarizeChapter(content: string, title?: string): Promise<string> {
    const titlePart = title ? ` có tiêu đề "${title}"` : '';
    const prompt = `Hãy cung cấp một bản tóm tắt ngắn gọn cho nội dung chương sau đây${titlePart}.
Tập trung vào các sự kiện chính, sự phát triển của nhân vật và các điểm cốt truyện quan trọng.
Giữ bản tóm tắt trong 2-3 đoạn văn.
Hãy trả lời bằng tiếng Việt.

Nội dung chương:
${content.substring(0, 20_000)}`;

    return this.generateText(prompt);
  }
}
