import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { ReadingRoomPresenceService } from '@/infrastructure/gateways/reading-room-presence.service';
import { RoomCommentSchema } from '@/infrastructure/database/schemas/reading-room-interactions/room-comment.schema';
import { RoomReactionSchema } from '@/infrastructure/database/schemas/reading-room-interactions/room-reaction.schema';
import { RoomQuoteSchema } from '@/infrastructure/database/schemas/reading-room-interactions/room-quote.schema';
import { DeleteRoomCommand } from './delete-room.command';

@Injectable()
export class DeleteRoomUseCase {
  private readonly logger = new Logger(DeleteRoomUseCase.name);

  constructor(
    private readonly roomRepository: IReadingRoomRepository,
    private readonly presenceService: ReadingRoomPresenceService,
    @InjectModel(RoomCommentSchema.name)
    private readonly commentModel: Model<RoomCommentSchema>,
    @InjectModel(RoomReactionSchema.name)
    private readonly reactionModel: Model<RoomReactionSchema>,
    @InjectModel(RoomQuoteSchema.name)
    private readonly quoteModel: Model<RoomQuoteSchema>,
  ) {}

  async execute(command: DeleteRoomCommand): Promise<void> {
    const room = await this.roomRepository.findById(
      RoomId.create(command.roomId),
    );
    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    if (!room.isHost(command.userId)) {
      throw new ForbiddenDomainException('Only host can delete the room');
    }

    const roomId = command.roomId;

    await Promise.all([
      this.roomRepository.delete(RoomId.create(roomId)),
      this.commentModel.deleteMany({ roomId }).exec(),
      this.reactionModel.deleteMany({ roomId }).exec(),
      this.quoteModel.deleteMany({ roomId }).exec(),
      this.presenceService.removeRoomPresences(roomId),
    ]);

    this.logger.log(`Room ${roomId} deleted by user ${command.userId}`);
  }
}
