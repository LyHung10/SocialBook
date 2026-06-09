'use client';

import { useState, useEffect, useRef } from 'react';
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

    const { data, isLoading, isFetching } = useGetBooksQuery(
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
        }

        if (isReset) {
            queueMicrotask(() => {
                setPage(1);
                setAllBooks([]);
            });
        } else if (data?.data) {
            queueMicrotask(() => {
                setAllBooks((prev) => {
                    if (page === 1) return data.data;
                    const existingIds = new Set(prev.map((b) => b.id));
                    const uniqueNewBooks = data.data.filter((b: Book) => !existingIds.has(b.id));
                    return [...prev, ...uniqueNewBooks];
                });
            });
        }
    }, [queryKey, data, page]);

    const hasMore = data ? data.meta.current < data.meta.totalPages : true;

    const lastBookRef = useIntersectionPagination({
        onLoadMore: () => setPage((prev) => prev + 1),
        isEnabled: !isFetching && hasMore,
    });

    return {
        books: allBooks,
        isLoading: (isLoading || isFetching) && page === 1,
        isFetchingMore: isFetching && page > 1,
        hasMore,
        lastBookRef,
        metaData: data?.meta
    };
};