import axios from 'axios';
import { reissueToken } from './services/userService';
import { getCookie, setCookie, removeCookie } from './utils/cookieUtils';

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/api/v1'
    : 'https://forest.platformholder.site/api/v1',
  withCredentials: true
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookie('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = getCookie('refreshToken');
      
      if (refreshToken) {
        try {
          const newAccessToken = await reissueToken(refreshToken);
          setCookie('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          removeCookie('accessToken');
          removeCookie('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
