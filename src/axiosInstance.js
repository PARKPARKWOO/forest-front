import axios from 'axios';
import { isForestMutationMethod } from '../build/organizationWritePolicy';
import { API_BASE_URL } from './config/apiBaseUrl';
import { FOREST_MUTATIONS_ENABLED } from './config/organizationDeployment';
import {
  getCurrentInternalPath,
  readPendingNavigation,
  savePendingNavigation,
} from './utils/pendingNavigation';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // 토큰 쿠키(httpOnly)는 브라우저가 자동 첨부. JS 가 토큰을 read/write 하지 않는다.
  // 게이트웨이가 access 만료 시 자동 회전(rotationToken)하므로 프론트는 reissue 수동 호출 X.
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (FOREST_MUTATIONS_ENABLED || !isForestMutationMethod(config.method)) return config;

  const error = new Error('Forest mutations are disabled in this deployment.');
  error.name = 'ForestMutationsDisabledError';
  error.code = 'FOREST_MUTATIONS_DISABLED';
  error.config = config;
  throw error;
});

// 일부 인증 경로의 401은 로그인 선택 화면으로 보낸다.
// Forest의 세션 만료 403은 `/users`를 주기 확인하는 AuthContext에서 처리한다.
const isAuthContextUserRequest = (config) => {
  if (config?.method?.toLowerCase() !== 'get') return false;
  try {
    const requestUrl = new URL(axiosInstance.getUri(config), window.location.origin);
    const currentUserUrl = new URL(axiosInstance.getUri({
      ...config,
      url: '/users',
      params: undefined,
    }), window.location.origin);
    return requestUrl.origin === currentUserUrl.origin
      && requestUrl.pathname.replace(/\/+$/, '') === currentUserUrl.pathname.replace(/\/+$/, '');
  } catch {
    return false;
  }
};

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401
      && !isAuthContextUserRequest(error.config)
      && window.location.pathname !== '/login'
    ) {
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
