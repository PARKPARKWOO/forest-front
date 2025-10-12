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

export const reissueToken = async (refreshToken) => {
  try {
    // 인증 서버의 엔드포인트로 요청
    const response = await fetch('https://auth.platformholder.site/api/v1/auth/token/reissue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({ refreshToken })
    });
    const data = await response.json();
    if (data.success && data.data) {
      return data.data; // 새 accessToken
    }
    throw new Error('토큰 재발급 실패');
  } catch (error) {
    console.error('토큰 재발급 실패:', error);
    throw error;
  }
};

export const revokeToken = async () => {
  try {
    console.log('🌐 revokeToken 함수 호출됨');
    
    // 인증 서버의 토큰 취소 엔드포인트로 요청
    // 서드파티 쿠키로 관리되므로 withCredentials: true로 쿠키 자동 전송
    const url = 'https://auth.platformholder.site/api/v1/auth/token/revoke';
    console.log('📡 API 호출 URL:', url);
    console.log('🍪 서드파티 쿠키 자동 전송 (withCredentials: true)');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      credentials: 'include' // 서드파티 쿠키 포함
    });
    
    console.log('📥 응답 상태:', response.status, response.statusText);
    const data = await response.json();
    console.log('📦 응답 데이터:', data);
    
    return data;
  } catch (error) {
    console.error('❌ 토큰 취소 실패:', error);
    throw error;
  }
}; 