import { useState } from 'react';
import {
  useGetGeminiRateLimitQuery,
  useUpdateGeminiRateLimitMutation,
} from '../../api/rateLimitApi';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

export function useRateLimitManagement() {
  const { data: config, isLoading, isFetching, refetch } = useGetGeminiRateLimitQuery();

  const [updateRateLimit, { isLoading: isSaving }] = useUpdateGeminiRateLimitMutation();

  const [guestLimit, setGuestLimit] = useState(config?.guestLimit ?? 2);
  const [userLimit, setUserLimit] = useState(config?.userLimit ?? 10);

  const handleSave = async () => {
    try {
      await updateRateLimit({ guestLimit, userLimit }).unwrap();
      toast.success('Cập nhật rate limit thành công');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const hasChanges =
    !!config &&
    (guestLimit !== config.guestLimit || userLimit !== config.userLimit);

  return {
    config,
    isLoading: isLoading || isFetching,
    guestLimit,
    userLimit,
    setGuestLimit,
    setUserLimit,
    handleSave,
    isSaving,
    hasChanges,
    refetch,
  };
}
