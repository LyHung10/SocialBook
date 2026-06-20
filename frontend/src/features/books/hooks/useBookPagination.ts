'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import type { Book, BookOrderField } from '@/features/books/types/book.interface';
import { useIntersectionPagination } from '@/hooks/useIntersectionPagination';

interface UseBookPaginationProps {
    search?: string;
    genres: string[];
    tags: string[];
    sortBy: string;
    order: string;
}

export const useBookPagination = (params: UseBookPaginationProps) => {
    const [page, setPage] = useState(1);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const queryKeyRef = useRef('');

    const queryKey = JSON.stringify({ ...params });

    const { currentData, data, isLoading, isFetching } = useGetBooksQuery(
        {
            page,
            limit: 20,
            search: params.search,
            genres: params.genres.join(','),
            tags: params.tags.join(','),
            sortBy: params.sortBy as BookOrderField,
            order: params.order as 'asc' | 'desc',
        }
    );

    useEffect(() => {
        const isReset = queryKey !== queryKeyRef.current;
        if (isReset) {
            queryKeyRef.current = queryKey;
            startTransition(() => setPage(1));
        }

        if (currentData?.data) {
            startTransition(() => {
                setAllBooks((prev) => {
                    if (isReset || page === 1) return currentData.data;
                    const existingIds = new Set(prev.map((b) => b.id));
                    const uniqueNewBooks = currentData.data.filter((b: Book) => !existingIds.has(b.id));
                    return [...prev, ...uniqueNewBooks];
                });
            });
        } else if (isReset) {
            startTransition(() => setAllBooks([]));
        }
    }, [queryKey, currentData, page]);

    const hasMore = data ? data.meta.current < data.meta.totalPages : true;

    const lastBookRef = useIntersectionPagination({
        onLoadMore: () => setPage((prev) => prev + 1),
        isEnabled: !isFetching && hasMore,
    });

    const hasDataGap = !!data?.data?.length && allBooks.length === 0 && page === 1;

    return {
        books: allBooks,
        isLoading: ((isLoading || isFetching) && page === 1) || hasDataGap,
        isFetchingMore: isFetching && page > 1,
        hasMore,
        lastBookRef,
        metaData: data?.meta
    };
};