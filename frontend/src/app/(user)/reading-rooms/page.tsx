'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import { useCreateRoomMutation, useGetMyActiveRoomsQuery, useGetMyHistoryQuery, useReactivateRoomMutation } from '@/features/reading-rooms/api/readingRoomsApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/components/auth/LoginWall';

export default function ReadingRoomsHub() {
  const [roomCode, setRoomCode] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const { data: booksData, isLoading: isBooksLoading } = useGetBooksQuery({ page: 1, limit: 10 });
  const { data: myRooms, isLoading: isMyRoomsLoading } = useGetMyActiveRoomsQuery();
  const { data: myHistory, isLoading: isHistoryLoading } = useGetMyHistoryQuery();
  const [reactivateRoom, { isLoading: isReactivating }] = useReactivateRoomMutation();
  const { user, isAuthenticated } = useAppAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <LoginWall
        title="Phòng đọc sách cùng nhau"
        description="Đăng nhập để tạo hoặc tham gia phòng đọc và chia sẻ trải nghiệm đọc sách cùng bạn bè."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  const selectedBookData = booksData?.data.find(b => b.id === selectedBook);
  const hasNoChapters = selectedBookData && (!selectedBookData.stats?.chapterCount || selectedBookData.stats.chapterCount === 0);

  const handleCreate = async () => {
    if (!selectedBook) {
      toast.error('Vui lòng chọn một cuốn sách để đọc chung');
      return;
    }

    if (hasNoChapters) {
      toast.error('Sách này chưa có chương nào. Không thể tạo phòng đọc.');
      return;
    }

    try {
      const res = await createRoom({
        bookId: selectedBook,
        currentChapterSlug: 'chuong-1',
        mode: 'sync',
        maxMembers: 10
      }).unwrap();
      toast.success('Tạo phòng thành công!');
      router.push(`/reading-rooms/${res.roomId}`);
    } catch (e) {
      toast.error('Không thể tạo phòng đọc');
    }
  };

  const handleJoin = () => {
    if (!roomCode) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }
    router.push(`/reading-rooms/${roomCode.toUpperCase()}`);
  }

  return (
    <div className="container max-w-4xl py-10 mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Phòng Đọc Sách Cùng Nhau</h1>
        <p className="text-muted-foreground text-lg">Đọc sách, đồng bộ trang và thảo luận trực tiếp cùng bạn bè.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full">
         <div className="flex flex-col border p-8 rounded-2xl bg-card shadow-sm h-full">
           <h2 className="text-2xl font-semibold mb-2">Tham gia phòng</h2>
           <p className="text-muted-foreground mb-6">Nhập mã phòng do bạn bè chia sẻ để tham gia đọc chung.</p>
           <div className="flex flex-col gap-2 mt-auto">
             <Input
               placeholder="Mã phòng (VD: X8A9F2)"
               value={roomCode}
               onChange={e => setRoomCode(e.target.value)}
               className="text-lg uppercase"
               maxLength={6}
             />
             <Button size="lg" onClick={handleJoin}>Vào phòng</Button>
           </div>
         </div>

         <div className="flex flex-col border p-8 rounded-2xl bg-card shadow-sm border-primary/20 h-full">
           <h2 className="text-2xl font-semibold mb-2 text-primary">Tạo phòng mới</h2>
           <p className="text-muted-foreground mb-6">Trở thành trưởng phòng, mời bạn bè và làm chủ phiên đọc sách.</p>

           <div className="mb-6">
             <label className="text-sm font-medium mb-2 block">Chọn sách để đọc</label>
             <Select value={selectedBook} onValueChange={setSelectedBook} disabled={isBooksLoading}>
               <SelectTrigger>
                 <SelectValue placeholder={isBooksLoading ? "Đang tải danh sách..." : "Chọn một cuốn sách"} />
               </SelectTrigger>
                <SelectContent>
                  {booksData?.data.map((book) => {
                    const noChapters = !book.stats?.chapterCount || book.stats.chapterCount === 0;
                    return (
                      <SelectItem key={book.id} value={book.id} disabled={noChapters}>
                        <span className="flex items-center gap-2">
                          {book.title}
                          {noChapters && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-muted-foreground">
                              Chưa có chương
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
             </Select>
           </div>

           <Button size="lg" onClick={handleCreate} disabled={isLoading || !selectedBook || hasNoChapters} className="mt-auto w-full">
              {isLoading ? 'Đang tạo...' : hasNoChapters ? 'Sách chưa có chương' : 'Tạo phòng ngay'}
            </Button>
         </div>
       </div>

      {/* My Active Rooms Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          Phòng của bạn đang tham gia
        </h2>

        {isMyRoomsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : myRooms && myRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => {
              // Find book title from booksData if available
              const book = booksData?.data.find(b => b.id === room.bookId);

              return (
                <div
                  key={room.roomId}
                  className="group p-4 border rounded-2xl bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">
                      {room.roomId}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {book?.title || 'Đang đọc chung...'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Đang ở: {room.currentChapterSlug}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-3xl opacity-50">
            <p className="text-muted-foreground">Bạn chưa tham gia phòng nào.</p>
          </div>
        )}
      </div>

      {/* My History Rooms Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-muted-foreground/30 rounded-full"></span>
          Lịch sử phòng đã tham gia
        </h2>

        {isHistoryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : myHistory && myHistory.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myHistory.items.map((room) => {
              const book = booksData?.data.find(b => b.id === room.bookId);
              const isHost = room.hostId === user?.id;
              return (
                <div
                  key={room.roomId}
                  className="group p-4 border rounded-2xl bg-card hover:border-muted-foreground/30 transition-all shadow-sm opacity-70 hover:opacity-100"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black tracking-widest text-muted-foreground uppercase bg-muted/50 px-2 py-1 rounded-md">
                        {room.roomId}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Đã kết thúc
                      </span>
                    </div>
                    <h3 className="font-bold text-sm line-clamp-1">
                      {book?.title || 'Đã đọc chung...'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                    </p>
                  </div>
                  {isHost && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full h-8 text-xs rounded-xl"
                      disabled={isReactivating}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await reactivateRoom(room.roomId).unwrap();
                          toast.success('Đã mở lại phòng đọc!');
                        } catch {
                          toast.error('Không thể mở lại phòng');
                        }
                      }}
                    >
                      {isReactivating ? 'Đang mở...' : 'Mở lại phòng'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-3xl opacity-30">
            <p className="text-muted-foreground text-sm">Chưa có lịch sử.</p>
          </div>
        )}
      </div>
    </div>
  )
}
