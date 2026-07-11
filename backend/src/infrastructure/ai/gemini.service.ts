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
    const prompt = `Dựa trên những sở thích đọc sách sau: "${preferences}", 
vui lòng đề xuất 5 cuốn sách mà người dùng có thể thích. 
Định dạng câu trả lời của bạn dưới dạng một danh sách đánh số chỉ gồm tên sách, mỗi tên sách trên một dòng.
Không bao gồm bất kỳ văn bản bổ sung hoặc giải thích nào.`;

    const response = await this.generateText(prompt);

    return response
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((t) => t.length > 0);
  }

  async generateChapterTitle(content: string): Promise<string> {
    const prompt = `Dựa trên nội dung chương sau đây, hãy tạo ra một tiêu đề chương hấp dẫn và phù hợp:

${content.substring(0, 1_000)}

Tiêu đề phải:
- Hấp dẫn và có tính mô tả
- Không quá 10 từ
- Phù hợp với thể loại và văn phong
- Sử dụng cùng ngôn ngữ với nội dung

Chỉ trả lời bằng tiêu đề, không có thêm bất kỳ văn bản nào khác.`;

    return this.generateText(prompt);
  }

  async extractKeywords(text: string): Promise<string[]> {
    const prompt = `Trích xuất các từ khóa và cụm từ khóa quan trọng nhất từ đoạn văn bản sau:

${text.substring(0, 2_000)}

Vui lòng cung cấp:
- 5-10 từ khóa liên quan
- Tập trung vào chủ đề, nhân vật, địa điểm và các khái niệm quan trọng
- Mỗi từ khóa trên một dòng
- Không có thêm bất kỳ văn bản hoặc giải thích nào khác

Định dạng dưới dạng một danh sách đơn giản.`;

    const response = await this.generateText(prompt);

    return response
      .split('\n')
      .map((line) => line.trim())
      .filter((kw) => kw.length > 0)
      .slice(0, 10);
  }
}
