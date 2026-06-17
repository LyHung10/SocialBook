import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CheckContentUseCase } from '@/application/content-moderation/use-cases/check-content.use-case';
import { ICommentRepository } from '@/domain/comments/repositories/comment.repository.interface';
import { CommentId } from '@/domain/comments/value-objects/comment-id.vo';

interface CommentCreatedPayload {
  commentId: string;
  userId: string;
  targetId: string;
  targetType: string;
  parentId?: string;
  content: string;
}

@Injectable()
export class CommentModerationListener {
  private readonly logger = new Logger(CommentModerationListener.name);

  constructor(
    private readonly checkContentUseCase: CheckContentUseCase,
    private readonly commentRepository: ICommentRepository,
  ) {}

  @OnEvent('comment.created', { async: true })
  async handleCommentCreated(payload: CommentCreatedPayload): Promise<void> {
    const commentId = CommentId.create(payload.commentId);

    try {
      this.logger.debug(
        `[Async Moderation] Kiểm tra comment ${payload.commentId}`,
      );

      const result = await this.checkContentUseCase.execute(payload.content);

      if (result.action === 'BLOCK') {
        await this.commentRepository.updateModerationStatus(
          commentId,
          'rejected',
          result.reason,
        );
        this.logger.log(
          `[Async Moderation] BLOCK comment ${payload.commentId}: ${result.reason}`,
        );
      } else if (result.action === 'ALLOW') {
        await this.commentRepository.updateModerationStatus(
          commentId,
          'approved',
        );
        this.logger.debug(
          `[Async Moderation] ALLOW comment ${payload.commentId}`,
        );
      } else {
        // REVIEW → giữ nguyên 'pending' để Admin xem xét
        this.logger.log(
          `[Async Moderation] REVIEW comment ${payload.commentId} — chờ Admin duyệt`,
        );
      }
    } catch (error) {
      // Nếu AI lỗi, tự động approve để không block user
      this.logger.error(
        `[Async Moderation] Lỗi khi kiểm tra comment ${payload.commentId}, tự động approve:`,
        error,
      );
      await this.commentRepository
        .updateModerationStatus(commentId, 'approved')
        .catch((err) =>
          this.logger.error(
            `[Async Moderation] Không thể cập nhật status cho ${payload.commentId}`,
            err,
          ),
        );
    }
  }
}
