# Reading Room — Social Reading Interaction System

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Tính năng chi tiết](#2-tính-năng-chi-tiết)
3. [Kỹ thuật](#3-kỹ-thuật)
4. [Kiến trúc dữ liệu](#4-kiến-trúc-dữ-liệu)
5. [Backend](#5-backend)
6. [Frontend](#6-frontend)
7. [Tận dụng code có sẵn](#7-tận-dụng-code-có-sẵn)
8. [Lộ trình triển khai](#8-lộ-trình-triển-khai)

---

## 1. Tổng quan

Biến reading room từ "đọc chung 1 trang" thành **trải nghiệm xã hội** — rủ bạn vào phòng, đọc cùng nhau, comment/reaction theo từng câu chữ, thấy nhau đang đọc tới đâu.

### Vai trò

| Vai trò | Quyền |
|---------|-------|
| **Host** | Tạo phòng, mời bạn, quản lý thành viên |
| **Member** | Đọc, comment, reaction, share quote |

---

## 2. Tính năng chi tiết

### 2.1. Room Annotation 💬

**Mô tả**: Comment gắn với từng đoạn văn, chỉ người trong phòng thấy, realtime.

**Luồng**: User đọc tới đoạn nào → bấm icon comment bên phải paragraph → mở drawer → viết comment → realtime broadcast đến cả phòng → badge số comment trên paragraph cập nhật.

**Chi tiết**:
- Tách biệt với global comment (comment thường ai cũng thấy)
- Box comment nhẹ, inline, không cần mở drawer to
- Threaded reply
- Notification khi có người comment vào đoạn mình đang đọc

### 2.2. Reactions 🎭

**Mô tả**: Thả cảm xúc vào đoạn văn, cả phòng thấy ngay lập tức.

**Loại reaction**:

| Emoji | Key | Ý nghĩa |
|:-----:|:---:|---------|
| 😢 | `cry` | Buồn, cảm động |
| 😡 | `angry` | Tức, bất bình |
| 😂 | `laugh` | Cười, hài hước |
| 🤔 | `think` | Suy nghĩ, thắc mắc |
| 😮 | `shock` | Bất ngờ, sốc |
| ❤️ | `heart` | Yêu thích, cảm kích |
| 🔥 | `fire` | Đỉnh, hay quá |
| 😌 | `calm` | Nhẹ nhàng, sâu lắng |

**Chi tiết**:
- 1 user/reaction type/paragraph (toggle on/off)
- Hiện avatar + count bên cạnh mỗi emoji
- Animation khi reaction mới xuất hiện
- Broadcast realtime qua Socket.IO

### 2.3. Reading Presence 🔍

**Mô tả**: Thấy bạn bè đã đọc tới đâu trong chapter.

**Chi tiết**:
- Avatar mỗi thành viên + progress ring (% paragraphs đã scroll qua)
- Dòng "A đang ở đoạn 7" khi hover
- Event `scroll_progress` gửi heartbeat kèm paragraph hiện tại (tận dụng presence có sẵn)

### 2.4. Activity Indicator 🌡️

**Mô tả**: Đoạn nào có nhiều tương tác (comment + reaction) → đánh dấu để biết "chỗ này hot".

**Chi tiết**:
- Badge "💬 3" bên phải paragraph nếu có comment
- Paragraph có reaction > 5 → icon 🔥
- Thanh cuộn bên phải hiện heatmap: vị trí nào đông tương tác nhất

### 2.5. Live Activity Feed 📜

**Mô tả**: Sidebar chạy realtime danh sách tương tác trong phòng. Click vào → scroll tới đoạn đó.

**Dữ liệu feed**:
- "A comment ở đoạn 3: 'Trời ơi hay quá'"
- "B 🔥 ở đoạn 7"
- "C 😢 ở đoạn 5"
- "D đã đọc tới đoạn 10"

**Chi tiết**:
- Cuộn vô hạn (load thêm khi scroll lên)
- Animation fade-in cho item mới
- Filter: xem tất cả / chỉ comment / chỉ reaction

### 2.6. Quote Board 📌

**Mô tả**: Bắt câu hay, share lên board phòng.

**Luồng**: User chọn text → menu "Share quote" → quote xuất hiện trên board → mọi người vote/react

**Chi tiết**:
- Hiện trên sidebar hoặc tab riêng
- Vote 👍/👎 quote
- Copy quote dễ dàng
- Sắp xếp theo vote hoặc thời gian

---

## 3. Kỹ thuật

### 3.1. Event Sourcing (chính)

**Thay vì lưu trạng thái, lưu hành động**.

```
Collection room_events:
  { type: "COMMENT_ADDED", data: { paragraphId, content, userId }, timestamp }
  { type: "REACTION_ADDED", data: { paragraphId, type, userId }, timestamp }
  { type: "PROGRESS_UPDATED", data: { paragraphId, userId }, timestamp }
```

**Dùng để**:
- Replay room activity feed
- Tính paragraph activity count
- Timeline buổi đọc
- Snapshot strategy: mỗi N events chụp 1 snapshot

### 3.2. Redis Pub/Sub (mở rộng)

**Vấn đề**: Socket.IO không scale ngang. Cần Redis adapter khi có nhiều instance.

**Giải pháp**: `RedisIoAdapter` thay vì `IoAdapter` hiện tại.

### 3.3. Optimistic UI

Comment/reaction hiện lên UI ngay trước khi server xác nhận. Rollback nếu fail.

---

## 4. Kiến trúc dữ liệu

### 4.1. Collections mới

#### `room_events` — Event Sourcing

```typescript
{
  _id: ObjectId,
  roomId: string,
  type: 'COMMENT_ADDED' | 'COMMENT_EDITED' | 'COMMENT_DELETED'
       | 'REACTION_ADDED' | 'REACTION_REMOVED'
       | 'PROGRESS_UPDATED'
       | 'QUOTE_ADDED' | 'QUOTE_VOTED',
  data: Record<string, any>,    // payload theo từng type
  userId: string,
  timestamp: Date,
  chapterSlug?: string,
  paragraphId?: string,
}
// Indexes:
//   { roomId: 1, timestamp: -1 }
//   { roomId: 1, paragraphId: 1 }
//   { roomId: 1, type: 1 }
```

#### `room_quotes` — Quote Board

```typescript
{
  _id: ObjectId,
  roomId: string,
  content: string,
  userId: string,
  chapterSlug: string,
  paragraphId: string,
  votes: { userId: string, type: 'up' | 'down' }[],
  createdAt: Date,
}
```

### 4.2. Mở rộng collection có sẵn

#### `reading_rooms` — thêm reactions vào schema

```typescript
// Embedded sub-document (hoặc tách riêng nếu cần tối ưu)
reactions: [{
  userId: string,
  paragraphId: string,
  type: string,  // 'cry' | 'angry' | ...
  createdAt: Date
}]
```

#### `room_presences` (Redis) — thêm progress

```typescript
// Mở rộng PresenceData
interface PresenceData {
  userId, displayName, avatarUrl, currentChapterSlug, paragraphId, lastSeen,
  progress: number,     // % đã đọc trong chapter (0-100)
}
```

---

## 5. Backend

### 5.1. Domain Layer

```
src/domain/reading-room-interactions/
  entities/
    room-event.entity.ts        // Base event entity
    room-comment.entity.ts      // Comment value object
    room-reaction.entity.ts     // Reaction value object
    room-quote.entity.ts        // Quote entity
  value-objects/
    reaction-type.vo.ts         // Enum + emoji mapping
    event-type.vo.ts            // Event type enum
  repositories/
    event.repository.interface.ts
    quote.repository.interface.ts
```

### 5.2. Application Layer

```
src/application/reading-room-interactions/
  use-cases/
    add-comment/
    edit-comment/
    delete-comment/
    add-reaction/
    remove-reaction/
    get-activity-feed/
    get-paragraph-activity/
    add-quote/
    vote-quote/
    get-quotes/
  events/
    room-event.handler.ts       // Xử lý event sourcing
  mappers/
```

### 5.3. Infrastructure Layer

#### Schemas

```
infrastructure/database/schemas/
  room-event.schema.ts
  room-quote.schema.ts
```

#### Repositories

```
infrastructure/database/repositories/reading-room-interactions/
  event.repository.ts
  quote.repository.ts
```

#### Gateway (mở rộng `reading-room.gateway.ts`)

**Server → Client events mới:**

| Event | Payload |
|-------|---------|
| `room:comment_added` | `{ commentId, paragraphId, content, userId, displayName, timestamp }` |
| `room:comment_deleted` | `{ commentId, paragraphId }` |
| `room:reaction_added` | `{ paragraphId, type, userId, displayName }` |
| `room:reaction_removed` | `{ paragraphId, type, userId }` |
| `room:reaction_summary` | `{ paragraphId, reactions: { type: count } }` |
| `room:activity_feed` | `{ events: ActivityEvent[] }` |
| `room:progress_updated` | `{ userId, paragraphId, progress }` |
| `room:quote_added` | `{ quoteId, content, userId, displayName, chapterSlug, paragraphId }` |

**Client → Server events mới:**

| Event | Payload |
|-------|---------|
| `room:add_comment` | `{ roomId, chapterSlug, paragraphId, content }` |
| `room:delete_comment` | `{ roomId, commentId, paragraphId }` |
| `room:add_reaction` | `{ roomId, chapterSlug, paragraphId, type }` |
| `room:remove_reaction` | `{ roomId, paragraphId, type }` |
| `room:get_activity_feed` | `{ roomId, before?, limit? }` |
| `room:add_quote` | `{ roomId, content, chapterSlug, paragraphId }` |
| `room:vote_quote` | `{ quoteId, type: 'up' | 'down' }` |

### 5.4. Presentation Layer

```
src/presentation/reading-room-interactions/
  reading-room-interactions.controller.ts
  dto/
```

**API:**

```
GET    /reading-rooms/:code/activity?chapterSlug=&before=&limit=
GET    /reading-rooms/:code/paragraphs/:paragraphId/activity
GET    /reading-rooms/:code/quotes
POST   /reading-rooms/:code/quotes
POST   /reading-rooms/:code/quotes/:id/vote
```

---

## 6. Frontend

### 6.1. Components mới

```
frontend/src/features/reading-room-interactions/
  components/
    ParagraphAnnotations.tsx       // Comment badge + inline comment
    ParagraphReactions.tsx          // Emoji reaction bar
    ActivityFeed.tsx                // Sidebar feed
    ActivityFeedItem.tsx            // 1 item trong feed
    ReadingProgress.tsx             // Progress ring + avatar
    ParagraphHeatmap.tsx            // Scrollbar heatmap
    QuoteBoard.tsx                  // Board quotes
    QuoteCard.tsx                   // 1 quote card
    QuoteCreator.tsx                // Tạo quote từ text
  hooks/
    useRoomAnnotations.ts           // Socket + state cho annotation
    useRoomReactions.ts             // Socket + state cho reaction
    useRoomActivityFeed.ts          // Socket + state cho feed
    useRoomQuotes.ts                // API + socket cho quotes
  api/
    roomInteractionsApi.ts          // RTK Query endpoints
  types/
    room-interaction.types.ts
```

### 6.2. Sửa files có sẵn

| File | Thay đổi |
|------|----------|
| `ChapterContent.tsx` | Thêm `<ParagraphReactions />`, `<ParagraphAnnotations />` dưới mỗi paragraph |
| `[roomCode]/page.tsx` | Thêm tab "Activity" trong sidebar |
| `useReadingRoomStore.ts` | Thêm state cho reactions, feed, quotes |
| `useReadingRoomSocket.ts` | Thêm listeners cho events mới |
| `reading-room.events.ts` | Thêm event types mới |

### 6.3. Zustand Store — State mới

```typescript
interface ReadingRoomState {
  // ... state cũ

  // Reactions
  reactions: Record<string, Record<string, string[]>>,
  // { paragraphId: { reactionType: [userId] } }

  // Activity feed
  feed: ActivityEvent[],
  feedLoading: boolean,
  hasMoreFeed: boolean,

  // Quotes
  quotes: Quote[],

  // Progress
  memberProgress: Record<string, number>,
  // { userId: progress% }

  // Actions mới
  updateReaction: (paragraphId, type, userId, add: boolean) => void,
  addFeedEvent: (event) => void,
  setFeed: (events, append?) => void,
  addQuote: (quote) => void,
  voteQuote: (quoteId, userId, type) => void,
  updateMemberProgress: (userId, progress) => void,
}
```

---

## 7. Tận dụng code có sẵn

### Có thể dùng lại

| File hiện tại | Dùng cho |
|---------------|----------|
| `reading-room.gateway.ts` | Socket.IO connection, auth, namespace — add event handlers mới |
| `reading-room.events.ts` | Pattern enum — add event types mới |
| `reading-room-presence.service.ts` | Redis presence — mở rộng thêm progress |
| `useReadingRoomSocket.ts` | Socket hook pattern — add listeners mới |
| `useReadingRoomStore.ts` | Zustand store — mở rộng state |
| `ChapterContent.tsx` | Paragraph rendering — inject reaction bar + annotation badge |
| `ParagraphCommentDrawer.tsx` | Comment drawer UI — mở rộng room-scoped mode |
| `KnowledgeSidebar.tsx` | Sidebar pattern — mẫu cho ActivityFeed, QuoteBoard |
| `[roomCode]/page.tsx` | Layout — thêm tab, components |
| `useRoomPresence.ts` | Heartbeat hook — thêm progress tracking |
| `ChapterNavigation.tsx` | Chapter control — giữ nguyên |
| `axiosBaseQuery` | RTK Query pattern — thêm endpoints mới |

### Cần xây mới

| Component | Lý do |
|-----------|-------|
| `ParagraphReactions.tsx` | Chưa có reaction UI |
| `ActivityFeed.tsx` | Chưa có feed |
| `ReadingProgress.tsx` | Chưa có progress ring |
| `QuoteBoard.tsx` | Chưa có quote |
| `Event Sourcing` infrastructure | Chưa có event store |

---

## 8. Lộ trình triển khai

### Phase 1 — Core (tuần 1)

| Step | Task | File |
|:----:|------|------|
| 1.1 | Domain: ReactionType VO + ParagraphReaction entity | `domain/reading-room-interactions/` |
| 1.2 | Domain: RoomEvent entity (event sourcing base) | `domain/reading-room-interactions/` |
| 1.3 | Repository interfaces | `domain/.../repositories/` |
| 1.4 | Mongoose schema: room_events | `infrastructure/.../schemas/` |
| 1.5 | Repository implementation | `infrastructure/.../repositories/` |
| 1.6 | Module + DI registration | `reading-room-interactions.module.ts` |

### Phase 2 — Room Annotation (tuần 1-2)

| Step | Task | File |
|:----:|------|------|
| 2.1 | Use case: AddComment | `application/.../use-cases/add-comment/` |
| 2.2 | Use case: DeleteComment | `application/.../use-cases/delete-comment/` |
| 2.3 | Gateway: add_comment, delete_comment handlers | `reading-room.gateway.ts` |
| 2.4 | Gateway: broadcast comment_added, comment_deleted | `reading-room.gateway.ts` |
| 2.5 | Frontend: ParagraphAnnotations component | `components/ParagraphAnnotations.tsx` |
| 2.6 | Frontend: hook useRoomAnnotations | `hooks/useRoomAnnotations.ts` |
| 2.7 | Integrate vào ChapterContent | `ChapterContent.tsx` |
| 2.8 | Mở rộng store (reactions state) | `useReadingRoomStore.ts` |

### Phase 3 — Reactions (tuần 2)

| Step | Task | File |
|:----:|------|------|
| 3.1 | Use case: AddReaction | `application/.../use-cases/add-reaction/` |
| 3.2 | Use case: RemoveReaction | `application/.../use-cases/remove-reaction/` |
| 3.3 | Gateway: add_reaction, remove_reaction handlers | `reading-room.gateway.ts` |
| 3.4 | Frontend: ParagraphReactions component | `components/ParagraphReactions.tsx` |
| 3.5 | Frontend: hook useRoomReactions | `hooks/useRoomReactions.ts` |
| 3.6 | Integrate vào ChapterContent | `ChapterContent.tsx` |

### Phase 4 — Activity Feed + Indicator (tuần 2-3)

| Step | Task | File |
|:----:|------|------|
| 4.1 | Use case: GetActivityFeed | `application/.../use-cases/get-activity-feed/` |
| 4.2 | Use case: GetParagraphActivity | `application/.../use-cases/get-paragraph-activity/` |
| 4.3 | REST controller | `presentation/.../controller.ts` |
| 4.4 | Frontend: ActivityFeed component | `components/ActivityFeed.tsx` |
| 4.5 | Frontend: hook useRoomActivityFeed | `hooks/useRoomActivityFeed.ts` |
| 4.6 | Activity indicator trong ChapterContent | `ChapterContent.tsx` |
| 4.7 | Thêm tab "Activity" trong sidebar | `[roomCode]/page.tsx` |

### Phase 5 — Reading Progress (tuần 3)

| Step | Task | File |
|:----:|------|------|
| 5.1 | Mở rộng Redis presence (progress field) | `reading-room-presence.service.ts` |
| 5.2 | Gateway: heartbeat handler parse progress | `reading-room.gateway.ts` |
| 5.3 | Frontend: ReadingProgress component | `components/ReadingProgress.tsx` |
| 5.4 | Mở rộng useRoomPresence (gửi progress) | `hooks/useRoomPresence.ts` |
| 5.5 | Progress ring trong sidebar members | `[roomCode]/page.tsx` |

### Phase 6 — Quote Board (tuần 3)

| Step | Task | File |
|:----:|------|------|
| 6.1 | Schema: room_quotes | `infrastructure/.../schemas/` |
| 6.2 | Use cases: AddQuote, VoteQuote, GetQuotes | `application/.../use-cases/` |
| 6.3 | REST + Socket events | Controller + Gateway |
| 6.4 | Frontend: QuoteBoard, QuoteCard, QuoteCreator | `components/` |
| 6.5 | Frontend: hook useRoomQuotes | `hooks/useRoomQuotes.ts` |
| 6.6 | Share quote từ ChapterContent selection menu | `ChapterContent.tsx` |

### Phase 7 — Kỹ thuật & Hoàn thiện (tuần 4)

| Step | Task | File |
|:----:|------|------|
| 7.1 | Event Sourcing snapshot strategy | `application/.../events/` |
| 7.2 | RedisIoAdapter (Socket.IO scaling) | `main.ts` |
| 7.3 | Optimistic UI cho comment + reaction | Frontend hooks |
| 7.4 | Cleanup + review | - |
| 7.5 | Tests | `test/` |

---

## Tổng kết

**6 tính năng**, **7 phase**, ~**4 tuần** (có thể song song phases).

Kỹ thuật claim: **Event Sourcing** (chính), **Redis Pub/Sub** (scale), **Optimistic UI** (UX).

Dùng lại: gateway, store, ChapterContent, presence service, UI components.
