import { ContentModerationService } from '@/infrastructure/moderation/content-moderation.service';
import { IGeminiService } from '@/domain/gemini/interfaces/gemini.service.interface';
import { updateToxicWordsCache } from '@/domain/content-moderation/utils/vietnamese-profanity';

describe('ContentModerationService (Unit)', () => {
  let service: ContentModerationService;
  let mockGeminiService: jest.Mocked<IGeminiService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGeminiService = {
      generateText: jest.fn(),
      generateJSON: jest.fn(),
      embedText: jest.fn(),
      summarizeChapter: jest.fn(),
      generateBookRecommendations: jest.fn(),
      generateChapterTitle: jest.fn(),
      extractKeywords: jest.fn(),
    } as jest.Mocked<IGeminiService>;

    service = new ContentModerationService(mockGeminiService);

    // Populate in-memory profanity cache for regex check tests
    updateToxicWordsCache([
      { pattern: 'đ[ịi]t\\s*m', group: 'thô tục mạnh' },
      { pattern: 'l[ồổõọ]n', group: 'thô tục mạnh' },
    ]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Regex fast-path
  // ─────────────────────────────────────────────────────────────────────────

  describe('Regex check (Vietnamese Profanity)', () => {
    it('should block extremely vulgar words immediately without AI calls', async () => {
      const result = await service.checkContent('địt mẹ bài viết này');

      expect(result.isSafe).toBe(false);
      expect(result.isToxic).toBe(true);
      expect(result.action).toBe('BLOCK');
      expect(mockGeminiService.generateJSON).not.toHaveBeenCalled();
    });

    it('should allow empty or whitespace-only text without AI calls', async () => {
      const result = await service.checkContent('   ');

      expect(result.isSafe).toBe(true);
      expect(result.action).toBe('ALLOW');
      expect(mockGeminiService.generateJSON).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AI evaluation via GeminiService (Beenoee)
  // ─────────────────────────────────────────────────────────────────────────

  describe('AI evaluation via GeminiService', () => {
    it('should delegate to GeminiService.generateJSON for contextual content', async () => {
      mockGeminiService.generateJSON.mockResolvedValue({
        action: 'ALLOW',
        category: 'none',
        score: 10,
        reason: '',
      });

      const result = await service.checkContent('Tôi thích cuốn sách này lắm!');

      expect(result.isSafe).toBe(true);
      expect(result.action).toBe('ALLOW');
      expect(mockGeminiService.generateJSON).toHaveBeenCalledTimes(1);
    });

    it('should mark content as BLOCK and isToxic when AI returns toxic', async () => {
      mockGeminiService.generateJSON.mockResolvedValue({
        action: 'BLOCK',
        category: 'toxic',
        score: 95,
        reason: 'Chứa nội dung công kích cá nhân.',
      });

      const result = await service.checkContent('Nội dung không phù hợp');

      expect(result.isSafe).toBe(false);
      expect(result.isToxic).toBe(true);
      expect(result.action).toBe('BLOCK');
      expect(result.reason).toBe('Chứa nội dung công kích cá nhân.');
    });

    it('should mark content as isSpoiler when AI returns spoiler category', async () => {
      mockGeminiService.generateJSON.mockResolvedValue({
        action: 'REVIEW',
        category: 'spoiler',
        score: 60,
        reason: 'Tiết lộ kết thúc mà không có cảnh báo spoiler.',
      });

      const result = await service.checkContent(
        'Nhân vật chính chết ở cuối truyện',
      );

      expect(result.isSpoiler).toBe(true);
      expect(result.isSafe).toBe(false);
      expect(result.action).toBe('REVIEW');
    });

    it('should mark hate_speech category as isToxic', async () => {
      mockGeminiService.generateJSON.mockResolvedValue({
        action: 'BLOCK',
        category: 'hate_speech',
        score: 90,
        reason: 'Kêu gọi phân biệt đối xử.',
      });

      const result = await service.checkContent('Kêu gọi thù ghét nhóm X');

      expect(result.isToxic).toBe(true);
      expect(result.action).toBe('BLOCK');
    });

    it('should return REVIEW when AI call throws an error', async () => {
      mockGeminiService.generateJSON.mockRejectedValue(
        new Error('Network Timeout'),
      );

      const result = await service.checkContent('Nội dung ngẫu nhiên');

      expect(result.isSafe).toBe(false);
      expect(result.action).toBe('REVIEW');
      expect(result.reason).toContain(
        'Hệ thống kiểm duyệt AI tạm thời gián đoạn',
      );
    });
  });
});
