import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
