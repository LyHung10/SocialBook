import { Injectable } from '@nestjs/common';
import { IPostRepository } from '@/domain/posts/repositories/post.repository.interface';

@Injectable()
export class GetModerationStatsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(): Promise<{
    total: number;
    toxic: number;
    spoiler: number;
    other: number;
  }> {
    return this.postRepository.getModerationStats();
  }
}
