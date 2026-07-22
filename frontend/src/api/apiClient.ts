import axios from 'axios';

import {
  expireAuthSession,
  isAccessTokenExpired,
} from '../utils/authSession';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',

  headers: {
    'Content-Type': 'application/json',
  },
});

const isPublicAuthRequest = (url?: string) =>
    Boolean(url?.includes('/auth/'));

apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
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

export default apiClient;