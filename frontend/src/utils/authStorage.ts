import {
    clearStoredAuthSession,
    isAccessTokenExpired,
    scheduleAccessTokenExpiry,
} from './authSession';

export type AuthUser = {
    accessToken: string;
    tokenType: string;
    userId: number;
    fullName: string;
    email: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN' | string;
};

/**
 * Lưu thông tin đăng nhập.
 */
export const saveAuth = (data: AuthUser) => {
    localStorage.setItem(
        'accessToken',
        data.accessToken,
    );

    localStorage.setItem(
        'authUser',
        JSON.stringify(data),
    );

    // Bắt đầu đếm đến lúc token hết hạn.
    scheduleAccessTokenExpiry(data.accessToken);
};

/**
 * Lấy thông tin người dùng hiện tại.
 */
export const getAuthUser = (): AuthUser | null => {
    const raw =
        localStorage.getItem('authUser');

    const token =
        localStorage.getItem('accessToken');

    if (!raw || !token) {
        clearAuth();
        return null;
    }

    if (isAccessTokenExpired(token)) {
        clearAuth();
        return null;
    }

    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        clearAuth();
        return null;
    }
};

/**
 * Đăng xuất.
 */
export const clearAuth = () => {
    clearStoredAuthSession();
};