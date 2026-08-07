import axios from 'axios';

import {
    expireAuthSession,
    isAccessTokenExpired,
} from '../utils/authSession';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8080/api',

    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Kiểm tra đây có phải API xác thực công khai không.
 *
 * Không tự đăng xuất khi login trả 401,
 * vì 401 lúc login có thể chỉ là sai mật khẩu.
 */
const isPublicAuthRequest = (url?: string) =>
    Boolean(url?.includes('/auth/'));

/**
 * REQUEST INTERCEPTOR
 *
 * Chạy trước khi gửi request đến backend.
 */
axiosInstance.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem('accessToken');

        const publicAuthRequest =
            isPublicAuthRequest(config.url);

        if (token && !publicAuthRequest) {
            if (isAccessTokenExpired(token)) {
                expireAuthSession();

                return Promise.reject(
                    new Error('JWT đã hết hạn'),
                );
            }

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => Promise.reject(error),
);

/**
 * RESPONSE INTERCEPTOR
 *
 * Backend trả 401 do token sai hoặc hết hạn
 * thì tự động đăng xuất.
 */
axiosInstance.interceptors.response.use(
    (response) => response,

    (error: unknown) => {
        if (axios.isAxiosError(error)) {
            const hasToken = Boolean(
                localStorage.getItem('accessToken'),
            );

            const isUnauthorized =
                error.response?.status === 401;

            const requestUrl =
                error.config?.url;

            if (
                hasToken &&
                isUnauthorized &&
                !isPublicAuthRequest(requestUrl)
            ) {
                expireAuthSession();
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;
