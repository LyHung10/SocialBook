import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useDispatch } from 'react-redux';
import { userLoggedOut } from '@/store/actions';

export interface UseLogoutResult {
    handleLogout: () => Promise<void>;
}

export function useLogout(): UseLogoutResult {
    const router = useRouter();
    const dispatch = useDispatch();

    const handleLogout = useCallback(async () => {
        dispatch(userLoggedOut());
        await signOut({ redirect: false });
        router.push('/login');
    }, [dispatch, router]);

    return { handleLogout };
}
