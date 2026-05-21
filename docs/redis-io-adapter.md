# Redis IoAdapter — Socket.IO Horizontal Scaling

## 1. Vấn đề: In-memory Adapter

Socket.IO mặc định dùng **in-memory adapter**. Nghĩa là danh sách socket, room, và cơ chế dispatch event
đều nằm trong RAM của một process (instance).

```
Instance 1 (RAM của nó):
  socket-A, socket-B

Instance 2 (RAM riêng, không liên quan):
  socket-C, socket-D
```

Khi gọi `server.to("room:X").emit("event", data)`:

- **Instance 1**: tìm được socket-A, socket-B → gửi đúng
- **Instance 1**: **không thể** gửi cho socket-C, socket-D vì chúng ở process khác

Hậu quả: nếu chạy nhiều instances (horizontal scaling), một số client không nhận được event.
Ví dụ: user A gửi reaction ở instance 1, user B ở instance 2 không thấy reaction hiện lên.

## 2. Adapter là gì?

**Adapter** là lớp trung gian giữa code gọi `server.emit()` và cơ chế gửi dữ liệu thật sự.

Socket.IO định nghĩa interface:

```typescript
interface Adapter {
  broadcast(packet: Packet, opts: BroadcastOptions): void;
}
```

Các implementation khác nhau:

| Adapter | Cách hoạt động |
|---------|---------------|
| In-memory (mặc định) | Quét Map socket trong RAM → emit trực tiếp |
| Redis | Quét Map local + publish lên Redis → các instance khác subscribe và emit local |

### Analogies

**Adapter như phích cắm chuyển đổi**:

- **Ổ điện** = interface `Adapter` mà Socket.IO cần
- **Phích cắm đèn Mỹ** = in-memory (cắm trực tiếp, đơn giản)
- **Phích chuyển đổi** = Redis adapter (nối interface Socket.IO với Redis Pub/Sub)

Code gọi `server.emit()` không cần biết bên dưới là in-memory hay Redis —
adapter làm nhiệm vụ chuyển tiếp.

## 3. Redis Pub/Sub — Giải pháp

### Nguyên lý

Khi một instance emit event, nó **publish** lên Redis channel.
Các instance khác **subscribe** channel đó và forward event đến socket local của chúng.

### Luồng dữ liệu

```
Client A ──► Instance 1
                 │
             server.to("room:X").emit("event", data)
                 │
          ┌──────┴──────┐
          ▼              ▼
   Gửi cho socket     pubClient.publish("room:X", packet)
   local trong       ─────────────────────────────────►
   room:X                     Redis Pub/Sub
                                   │
                            subClient.subscribe("room:X")
                                   │
                                   ▼
                             Instance 2
                                   │
                          server.to("room:X").emit("event", data)
                                   │
                                   ▼
                             Client B (socket-D)
```

### pubClient vs subClient

Socket.IO yêu cầu **2 kết nối Redis riêng** vì một connection không thể vừa pub vừa sub
ổn định trong cùng một Redis client:

- **pubClient**: chỉ publish event lên Redis
- **subClient**: chỉ subscribe channel, nhận event từ các instance khác

## 4. Code

### `redis-io.adapter.ts`

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(redisUrl: string): Promise<void> {
    // Tạo 2 connection: pub + sub
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Tạo adapter từ thư viện @socket.io/redis-adapter
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    // Gắn Redis adapter vào server, thay thế in-memory
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

### Gắn vào ứng dụng (`main.ts`)

```typescript
const redisHost = configService.get<string>('env.REDIS_HOST', 'localhost');
const redisPort = configService.get<number>('env.REDIS_PORT', 6379);
const redisPassword = configService.get<string>('env.REDIS_PASSWORD', '');

// redis://:password@host:port
const redisUrl = redisPassword
  ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
  : `redis://${redisHost}:${redisPort}`;

const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis(redisUrl);
app.useWebSocketAdapter(redisIoAdapter);
```

## 5. Kết luận

- **Trước**: một instance không thể gửi event cho socket ở instance khác
- **Sau**: tất cả instance publish/subscribe qua Redis → event đến đúng client bất kể
  instance nào
- Code gọi `server.emit()` ở gateway **không thay đổi** — adapter là lớp trong suốt
- Cho phép scale ngang (horizontal scaling) mà không mất real-time events
