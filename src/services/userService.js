import axiosInstance from '../axiosInstance';

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
  try {
    const response = await axiosInstance.get('/users');
    return response.data.data;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error);
    throw error;
  }
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