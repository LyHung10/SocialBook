'use client';

import { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { AdminSearchBar } from '@/features/admin/components/AdminSearchBar';
import { AdminPagination } from '@/features/admin/components/AdminPagination';
import { useToxicWordsManagement } from '@/features/admin/hooks/moderation/useToxicWordsManagement';
import { ToxicWordModal } from '@/components/admin/moderation/ToxicWordModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ToxicWordsPage() {
    const {
        toxicWords,
        meta,
        isLoading,
        page,
        search,
        handlePageChange,
        handleSearch,
        handleAdd,
        handleDelete,
        isAdding,
        isDeleting
    } = useToxicWordsManagement();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    return (
        <div className="p-6">
            <AdminSearchBar
                title="Quản lý từ khoá thô tục"
                totalItems={meta?.total || 0}
                totalLabel="từ khoá"
                searchPlaceholder="Tìm kiếm từ khoá hoặc pattern..."
                searchValue={search}
                onSearchChange={handleSearch}
                onAddClick={() => setIsAddModalOpen(true)}
                addLabel="Thêm từ khoá"
            />

            <div className="bg-white rounded-lg shadow mt-6">

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pattern (Regex)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nhóm
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : toxicWords.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <AlertCircle size={40} className="mb-2 text-gray-400" />
                                            <p>Không tìm thấy từ khoá nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                toxicWords.map((word) => (
                                    <tr key={word.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <code className="text-sm text-pink-600 bg-pink-50 px-2 py-1 rounded">
                                                {word.pattern}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                {word.group}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(word.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc muốn xoá từ khoá này?')) {
                                                        handleDelete(word.id);
                                                    }
                                                }}
                                                disabled={isDeleting}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                title="Xoá"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && meta.totalPages > 1 && (
                    <AdminPagination
                        page={page}
                        totalPages={meta.totalPages}
                        totalItems={meta.total}
                        pageSize={meta.pageSize}
                        itemLabel="từ khoá"
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            <ToxicWordModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAdd}
                isSubmitting={isAdding}
            />
        </div>
    );
}
