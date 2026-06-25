import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import {
  ITextToSpeechProvider,
  AudioGenerationOptions,
} from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';

@Injectable()
export class FptProvider implements ITextToSpeechProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly mediaService: IMediaService,
  ) {}

  async generateAudio(
    text: string,
    options: AudioGenerationOptions,
  ): Promise<{ audioUrl: string; format: string; duration?: number }> {
    const { format = 'mp3' } = options;
    const apiKey = this.configService.get<string>('env.FPT_API_KEY');

    const defaultVoice =
      this.configService.get<string>('env.FPT_VOICE') || 'thuminh'; // thuminh, banmai, minhquang...

    if (!apiKey) {
      throw new InternalServerErrorException('FPT.AI API key not found');
    }

    const voice = defaultVoice;
    const url = 'https://api.fpt.ai/hmi/tts/v5';

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: text, // FPT API expects raw text in body
        headers: {
          'api-key': apiKey,
          voice: voice,
          speed: '0', // Normal speed
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`FPT.AI error: ${err}`);
      }

      const jsonResponse = (await response.json()) as { async?: string };
      const asyncUrl = jsonResponse.async;

      if (typeof asyncUrl !== 'string') {
        throw new Error('FPT.AI did not return an async URL');
      }

      // Poll the async URL to wait for audio generation
      let arrayBuffer: ArrayBuffer | null = null;
      for (let i = 0; i < 20; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before each poll

        const audioRes = await fetch(asyncUrl);
        // FPT returns 200 but might return HTML or some text if not ready, check content-type
        const contentType = audioRes.headers.get('content-type');
        if (audioRes.ok && contentType && contentType.includes('audio')) {
          arrayBuffer = await audioRes.arrayBuffer();
          break;
        }
      }

      if (!arrayBuffer) {
        throw new Error('Timeout waiting for FPT.AI audio generation');
      }

      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 100) {
        throw new Error('FPT.AI returned invalid audio data');
      }

      const fakeAudioFile: Express.Multer.File = {
        buffer,
        originalname: `tts-${Date.now()}.${format}`,
        mimetype: `audio/${format}`,
        fieldname: 'audio',
        encoding: '7bit',
        size: buffer.length,
        destination: '',
        filename: `tts-${Date.now()}.${format}`,
        path: '',
        stream: Readable.from(buffer),
      };

      const audioUrl = await this.mediaService.uploadAudio(fakeAudioFile);

      return { audioUrl, format, duration: 0 };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to generate audio: ${message}`,
      );
    }
  }
}
