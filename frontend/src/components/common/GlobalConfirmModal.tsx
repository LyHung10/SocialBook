'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useModalStore } from '@/store/useModalStore';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function GlobalConfirmModal() {
    const { isConfirmOpen, closeConfirm, confirmData } = useModalStore();
    const [isLoading, setIsLoading] = useState(false);

    if (!confirmData) return null;

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await confirmData.onConfirm();
            closeConfirm();
        } catch (error) {
            toast.error('Thao tác thất bại, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isConfirmOpen} onOpenChange={(open) => !open && closeConfirm()}>
            <AlertDialogContent className="sm:max-w-[400px] bg-card p-0 gap-0 border-border overflow-hidden">
                <AlertDialogHeader className="sr-only">
                    <AlertDialogTitle>{confirmData.title}</AlertDialogTitle>
                    <AlertDialogDescription>{confirmData.description}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">
                        {confirmData.title}
                    </h2>
                </div>

                <div className="px-6 py-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {confirmData.description}
                    </p>
                </div>

                <AlertDialogFooter className="px-6 py-4 border-t border-border sm:justify-end gap-2">
                    <AlertDialogCancel
                        disabled={isLoading}
                        className="rounded-lg border-border hover:bg-muted font-medium text-sm"
                    >
                        {confirmData.cancelText || "Hủy"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isLoading}
                        className={buttonVariants({
                            variant: confirmData.variant || "default",
                            className: "rounded-lg font-bold px-6 text-sm shadow-sm"
                        })}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            confirmData.confirmText || "Xác nhận"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
