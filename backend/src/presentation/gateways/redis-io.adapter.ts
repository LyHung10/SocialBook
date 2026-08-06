import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  async connectToRedis(redisUrl: string): Promise<void> {
    const isTls = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash');
    const pubClient = createClient({
      url: redisUrl,
      socket: isTls ? { tls: true, rejectUnauthorized: false } : undefined,
    });

    pubClient.on('error', (err) => {
      this.logger.error(`[RedisIoAdapter PubClient Error] ${err.message}`);
    });

    const subClient = pubClient.duplicate();
    subClient.on('error', (err) => {
      this.logger.error(`[RedisIoAdapter SubClient Error] ${err.message}`);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
