import axiosInstance from '../axiosInstance';

// 후원신청 목록 조회
export const fetchSupporters = async (page = 1, size = 10) => {
  try {
    const response = await axiosInstance.get('/api/v1/forest/supporters', {
      params: {
        page,
        size,
      },
    });
    return response.data;
  } catch (error) {
    console.error('후원신청 목록 조회 오류:', error);
    throw error;
  }
};
