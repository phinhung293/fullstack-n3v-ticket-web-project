const ACCESS_TOKEN_KEY = 'accessToken';
const AUTH_USER_KEY = 'authUser';
const SESSION_MESSAGE_KEY = 'authSessionMessage';

export const SESSION_EXPIRED_MESSAGE =
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

type JwtPayload = {
    exp?: number;
};

let expiryTimerId: number | null = null;

/**
 * Hủy bộ đếm hết hạn token hiện tại.
 */
const cancelExpiryTimer = () => {
    if (expiryTimerId !== null) {
        window.clearTimeout(expiryTimerId);
        expiryTimerId = null;
    }
};

/**
 * Giải mã phần payload của JWT.
 *
 * JWT có cấu trúc:
 * header.payload.signature
 */
const decodeJwtPayload = (token: string): JwtPayload | null => {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) {
            return null;
        }

        const base64Url = parts[1];

        const base64 = base64Url
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const paddedBase64 = base64.padEnd(
            Math.ceil(base64.length / 4) * 4,
            '=',
        );

        return JSON.parse(
            window.atob(paddedBase64),
        ) as JwtPayload;
    } catch {
        return null;
    }
};

/**
 * Lấy thời điểm JWT hết hạn.
 *
 * exp của JWT tính bằng giây.
 * Date.now() của JavaScript tính bằng mili giây.
 */
export const getAccessTokenExpirationTime = (
    token: string,
): number | null => {
    const payload = decodeJwtPayload(token);

    if (typeof payload?.exp !== 'number') {
        return null;
    }

    return payload.exp * 1000;
};

/**
 * Kiểm tra JWT đã hết hạn chưa.
 */
export const isAccessTokenExpired = (
    token: string,
): boolean => {
    const expirationTime =
        getAccessTokenExpirationTime(token);

    // Không đọc được exp thì để backend kiểm tra.
    if (expirationTime === null) {
        return false;
    }

    return Date.now() >= expirationTime;
};

/**
 * Xóa dữ liệu đăng nhập.
 */
export const clearStoredAuthSession = () => {
    cancelExpiryTimer();

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
};

/**
 * Tự động đăng xuất khi phiên hết hạn.
 */
export const expireAuthSession = () => {
    clearStoredAuthSession();

    sessionStorage.setItem(
        SESSION_MESSAGE_KEY,
        SESSION_EXPIRED_MESSAGE,
    );

    // Không cho bấm Back quay lại trang cần đăng nhập.
    window.location.replace('/login');
};

/**
 * Đặt bộ đếm đến đúng thời điểm JWT hết hạn.
 */
export const scheduleAccessTokenExpiry = (
    token: string,
) => {
    cancelExpiryTimer();

    const expirationTime =
        getAccessTokenExpirationTime(token);

    if (expirationTime === null) {
        return;
    }

    const remainingTime =
        expirationTime - Date.now();

    if (remainingTime <= 0) {
        expireAuthSession();
        return;
    }

    expiryTimerId = window.setTimeout(() => {
        expireAuthSession();
    }, remainingTime);
};

/**
 * Kiểm tra JWT ngay khi website được mở.
 */
export const initializeAuthSession = () => {
    const token =
        localStorage.getItem(ACCESS_TOKEN_KEY);

    const authUser =
        localStorage.getItem(AUTH_USER_KEY);

    if (!token) {
        if (authUser) {
            clearStoredAuthSession();
        }

        return;
    }

    if (isAccessTokenExpired(token)) {
        expireAuthSession();
        return;
    }

    scheduleAccessTokenExpiry(token);
};

/**
 * Lấy thông báo hết phiên trên trang đăng nhập.
 */
export const consumeAuthSessionMessage = ():
    string | null => {
    const message =
        sessionStorage.getItem(SESSION_MESSAGE_KEY);

    if (message) {
        sessionStorage.removeItem(
            SESSION_MESSAGE_KEY,
        );
    }

    return message;
};