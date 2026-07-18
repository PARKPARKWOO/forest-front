import axios from 'axios';
import {
  getCurrentInternalPath,
  readPendingNavigation,
  savePendingNavigation,
} from './utils/pendingNavigation';

const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api/v1'
  : 'https://forest.platformholder.site/api/v1';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl,
  // 토큰 쿠키(httpOnly)는 브라우저가 자동 첨부. JS 가 토큰을 read/write 하지 않는다.
  // 게이트웨이가 access 만료 시 자동 회전(rotationToken)하므로 프론트는 reissue 수동 호출 X.
  withCredentials: true,
});

// 일부 인증 경로의 401은 로그인 선택 화면으로 보낸다.
// Forest의 세션 만료 403은 `/users`를 주기 확인하는 AuthContext에서 처리한다.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      const pendingNavigation = readPendingNavigation();
      savePendingNavigation(pendingNavigation?.action
        ? pendingNavigation
        : { returnTo: getCurrentInternalPath() });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
