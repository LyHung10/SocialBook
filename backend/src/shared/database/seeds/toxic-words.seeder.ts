import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ToxicWordDocument } from '@/infrastructure/database/schemas/toxic-word.schema';

@Injectable()
export class ToxicWordsSeed {
  private readonly logger = new Logger(ToxicWordsSeed.name);

  constructor(
    @InjectModel(ToxicWordDocument.name)
    private readonly toxicWordModel: Model<ToxicWordDocument>,
  ) {}

  async run() {
    const defaultToxicWords = [
      { pattern: 'đ[ịi]t\\s*m', group: 'thô tục mạnh' },
      { pattern: 'l[ồổõọ]n', group: 'thô tục mạnh' },
      { pattern: 'c[ặa]c', group: 'thô tục mạnh' },
      { pattern: 'b[uù]ồ[iĩ]', group: 'thô tục mạnh' },
      { pattern: 'c[ứư]t', group: 'thô tục nhẹ' },
      { pattern: 'đ[ỹĩỉi]\\s*đ[iỉĩỹ]', group: 'xúc phạm' },
      { pattern: 'đ[iĩỉỹ]\\s*m[eẹ]', group: 'thô tục mạnh' },
      { pattern: 'ph[òóõỏọ]', group: 'xúc phạm' },
      { pattern: 'đ\\s*m', group: 'thô tục nhẹ' },
      { pattern: 'v[aãả]i\\s*l', group: 'thô tục nhẹ' },
    ];

    for (const word of defaultToxicWords) {
      const existed = await this.toxicWordModel
        .findOne({ pattern: word.pattern })
        .lean();
      if (existed) {
        this.logger.log(`Toxic word exists: ${word.pattern}`);
        continue;
      }

      await this.toxicWordModel.create(word);
      this.logger.log(`Toxic word created: ${word.pattern}`);
    }
  }
}
