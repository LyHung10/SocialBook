import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IContentModerationService } from '@/domain/content-moderation/interfaces/content-moderation.service.interface';
import { ModerationResult } from '@/domain/content-moderation/interfaces/moderation-result.interface';
import { containsVietnameseToxicWords } from '@/domain/content-moderation/utils/vietnamese-profanity';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { GEMINI_TOKENS } from '@/domain/gemini/tokens/gemini.tokens';

interface ModerationAIResult {
  action: 'ALLOW' | 'REVIEW' | 'BLOCK';
  category: 'toxic' | 'spoiler' | 'spam' | 'hate_speech' | 'none';
  score: number;
  reason: string;
}

@Injectable()
export class ContentModerationService implements IContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  constructor(
    @Inject(GEMINI_TOKENS.GEMINI_SERVICE)
    private readonly geminiService: IGeminiService,
    private readonly configService: ConfigService,
  ) {}

  async checkContent(text: string): Promise<ModerationResult> {
    if (!text?.trim()) {
      return {
        isSafe: true,
        isSpoiler: false,
        isToxic: false,
        action: 'ALLOW',
        category: 'none',
        score: 0,
      };
    }

    // 1. Kiểm tra nhanh bằng Regex (Các từ cực kỳ thô tục)
    const quickCheck = containsVietnameseToxicWords(text);
    if (quickCheck) {
      this.logger.debug(
        `[Regex] Phát hiện nội dung thô tục: ${quickCheck.group}`,
      );
      return {
        isSafe: false,
        isSpoiler: false,
        isToxic: true,
        action: 'BLOCK',
        category: 'toxic',
        score: 100,
        reason: 'Nội dung chứa từ ngữ thô tục không phù hợp.',
      };
    }

    // 2. Sử dụng AI để đánh giá ngữ cảnh (Tiếng Việt)
    try {
      this.logger.debug(
        `[AI] Đang đánh giá nội dung: "${text.substring(0, 50)}..."`,
      );

      const prompt = `
        Bạn là một chuyên gia kiểm duyệt nội dung cho mạng xã hội về sách SocialBook.
        Hãy đánh giá nội dung sau đây (tiếng Việt) dựa trên các tiêu chí:
        1. toxic: Chứa từ ngữ thô tục, xúc phạm, công kích cá nhân, ngôn ngữ thù ghét, hoặc bạo lực.
        2. spoiler: Tiết lộ các tình tiết quan trọng của sách (kết thúc, cái chết của nhân vật, v.v.) mà không có cảnh báo rõ ràng.
        3. spam: Nội dung lặp đi lặp lại, quảng cáo rác, hoặc không có ý nghĩa.
        4. hate_speech: Ngôn ngữ thù ghét, phân biệt đối xử.

        Dưới đây là nội dung cần đánh giá:
        "${text}"

        Hãy trả về kết quả dưới định dạng JSON sau:
        {
          "action": "ALLOW" | "REVIEW" | "BLOCK",
          "category": "toxic" | "spoiler" | "spam" | "hate_speech" | "none",
          "score": number (0-100),
          "reason": "Giải thích ngắn gọn bằng tiếng Việt lý do vi phạm (nếu có), nếu an toàn hãy trả về chuỗi rỗng"
        }

        Quy tắc quyết định (action):
        - ALLOW: Nội dung an toàn, tích cực.
        - REVIEW: Có nghi vấn spoiler, toxic nhẹ, hoặc cần admin kiểm tra thêm.
        - BLOCK: Vi phạm nghiêm trọng (toxic nặng, hate speech, spam).
      `;

      const moderationApiKey = this.configService.get<string>(
        'env.MODERATION_API_KEY',
      );

      let result: ModerationAIResult;

      if (moderationApiKey) {
        this.logger.debug(
          '[AI] Sử dụng API Key riêng cho moderation (OpenAI-compatible).',
        );
        const moderationApiBaseUrl =
          this.configService.get<string>('env.MODERATION_API_BASE_URL') ||
          'https://api.beeknoee.com/v1';
        const moderationModel =
          this.configService.get<string>('env.MODERATION_MODEL') ||
          'gemini-2.5-flash';
        const moderationTimeout =
          this.configService.get<number>('env.MODERATION_TIMEOUT') || 30000;

        const response = await axios.post(
          `${moderationApiBaseUrl}/chat/completions`,
          {
            model: moderationModel,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${moderationApiKey}`,
            },
            timeout: moderationTimeout,
          },
        );

        const responseData = response.data as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const responseContent =
          responseData.choices?.[0]?.message?.content ?? null;
        if (!responseContent) {
          throw new Error(
            'Không nhận được nội dung phản hồi từ API kiểm duyệt.',
          );
        }

        try {
          result = JSON.parse(responseContent) as ModerationAIResult;
        } catch (parseError) {
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]) as ModerationAIResult;
          } else {
            throw parseError;
          }
        }
      } else {
        result =
          await this.geminiService.generateJSON<ModerationAIResult>(prompt);
      }

      const isSafe = result.action === 'ALLOW';
      const isToxic =
        result.category === 'toxic' || result.category === 'hate_speech';
      const isSpoiler = result.category === 'spoiler';

      if (!isSafe) {
        this.logger.log(
          `[AI] Flagged content [${result.action}]: ${result.reason}`,
        );
      }

      return {
        isSafe,
        isSpoiler,
        isToxic,
        action: result.action,
        category: result.category,
        score: result.score || 0,
        reason: result.reason,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Lỗi khi gọi AI kiểm duyệt nội dung: ${message}`,
        stack,
      );
      // Fallback: Nếu AI lỗi, chuyển sang REVIEW để Admin kiểm duyệt cho an toàn
      return {
        isSafe: false,
        isSpoiler: false,
        isToxic: false,
        action: 'REVIEW',
        category: 'none',
        score: 0,
        reason:
          'Hệ thống kiểm duyệt AI tạm thời gián đoạn, nội dung được chuyển qua Admin kiểm tra.',
      };
    }
  }
}
