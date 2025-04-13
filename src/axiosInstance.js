import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080/api/v1'
    : 'https://forest.platformholder.site/api/v1'
});

// 요청 인터셉터 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('axiosInstance - Token from localStorage:', token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('axiosInstance - Added Authorization header:', config.headers.Authorization);
    } else {
      console.log('axiosInstance - No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('axiosInstance - Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 에러 처리
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
