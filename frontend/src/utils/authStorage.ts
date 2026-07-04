export type AuthUser = {
    accessToken: string;
    tokenType: string;
    userId: number;
    fullName: string;
    email: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN' | string;
};

export const saveAuth = (data: AuthUser) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('authUser', JSON.stringify(data));
};

export const getAuthUser = (): AuthUser | null => {
    const raw = localStorage.getItem('authUser');

    if (!raw) return null;

    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        clearAuth();
        return null;
    }
};

export const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
};