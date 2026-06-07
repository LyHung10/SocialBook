'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalStore } from '@/store/useModalStore';
import { useCreateCollectionMutation } from '@/features/library/api/libraryApi';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateCollectionModal() {
  const { isCreateCollectionOpen, closeCreateCollection, createCollectionData } = useModalStore();
  const [name, setName] = useState('');
  const [createCollection, { isLoading }] = useCreateCollectionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createCollection({
        name: name.trim(),
        isPublic: false,
      }).unwrap();
      
      toast.success('Đã tạo bộ sưu tập mới');
      setName('');
      createCollectionData?.onSuccess?.();
      closeCreateCollection();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={isCreateCollectionOpen} onOpenChange={(open) => !open && closeCreateCollection()}>
      <DialogContent className="sm:max-w-[400px] bg-card p-0 gap-0 border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Bộ sưu tập mới</DialogTitle>
          <DialogDescription>Tạo bộ sưu tập sách mới</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Bộ sưu tập mới</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex gap-2">
          <Input
            autoFocus
            placeholder="Tên bộ sưu tập..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
