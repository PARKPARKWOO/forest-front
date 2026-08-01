import axiosInstance from '../axiosInstance';
import authSessionClient from '../authSessionClient';

export const createAuthority = async (level, authority) => {
  try {
    const response = await axiosInstance.post('/forest/authority', {
      level,
      authority
    });
    return response.data;
  } catch (error) {
    console.error('권한 생성 중 오류:', error);
    throw error;
  }
};

export const getUserList = async (page = 1, size = 10) => {
  try {
    const response = await axiosInstance.get('/forest/user-info', {
      params: { page, size }
    });
    return response.data.data;
  } catch (error) {
    console.error('사용자 목록 조회 중 오류:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/users');
  return response.data.data;
};

export const getAuthorities = async () => {
  try {
    const response = await axiosInstance.get('/forest/authority');
    return response.data.data;
  } catch (error) {
    console.error('권한 목록 조회 중 오류:', error);
    throw error;
  }
};

export const updateUserRole = async (targetId, authorityId) => {
  try {
    const response = await axiosInstance.put('/forest/user-role', {
      targetId,
      authorityId
    });
    return response.data;
  } catch (error) {
    console.error('사용자 권한 수정 중 오류:', error);
    throw error;
  }
};

// reissueToken 은 게이트웨이가 자동 처리하므로 프론트엔드에서 직접 호출하지 않는다.
// (P0-#2 / P2 정리: 토큰 manual handling 제거)

export const revokeToken = async () => {
  await authSessionClient.post('/auth/token/revoke');
};
