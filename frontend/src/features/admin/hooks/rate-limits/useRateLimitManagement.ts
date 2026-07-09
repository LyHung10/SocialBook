import { useState, useEffect } from 'react';
import {
  useGetGeminiRateLimitQuery,
  useUpdateGeminiRateLimitMutation,
  RateLimitConfig,
} from '../../api/rateLimitApi';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

export function useRateLimitManagement() {
  const { data: config, isLoading, isFetching, refetch } = useGetGeminiRateLimitQuery();

  const [updateRateLimit, { isLoading: isSaving }] = useUpdateGeminiRateLimitMutation();

  const [guestLimit, setGuestLimit] = useState(2);
  const [userLimit, setUserLimit] = useState(10);

  useEffect(() => {
    if (config) {
      setGuestLimit(config.guestLimit);
      setUserLimit(config.userLimit);
    }
  }, [config]);

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
