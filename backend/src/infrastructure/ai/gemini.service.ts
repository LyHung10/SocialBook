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

  constructor(private readonly configService: ConfigService) {}

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
${content.substring(0, 25_000)}`;

    return this.generateText(prompt);
  }

  async generateBookRecommendations(preferences: string): Promise<string[]> {
    const prompt = `Based on these reading preferences: "${preferences}", 
please recommend 5 books that the user might enjoy. 
Format your response as a numbered list with book titles only, one per line.
Do not include any additional text or explanations.`;

    const response = await this.generateText(prompt);

    return response
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((t) => t.length > 0);
  }

  async generateChapterTitle(content: string): Promise<string> {
    const prompt = `Based on this chapter content, generate a compelling and appropriate chapter title:

${content.substring(0, 1_000)}

The title should be:
- Engaging and descriptive
- No more than 10 words
- Appropriate for the genre and tone
- In the same language as the content

Respond with only the title, no additional text.`;

    return this.generateText(prompt);
  }

  async extractKeywords(text: string): Promise<string[]> {
    const prompt = `Extract the most important keywords and key phrases from this text:

${text.substring(0, 2_000)}

Please provide:
- 5-10 relevant keywords
- Focus on themes, characters, places, and important concepts
- One keyword per line
- No additional text or explanations

Format as a simple list.`;

    const response = await this.generateText(prompt);

    return response
      .split('\n')
      .map((line) => line.trim())
      .filter((kw) => kw.length > 0)
      .slice(0, 10);
  }
}
