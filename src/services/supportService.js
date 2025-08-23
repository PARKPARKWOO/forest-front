import axiosInstance from '../axiosInstance';

// 후원신청 목록 조회
export const fetchSupporters = async (page = 0, size = 10) => {
  try {
    const response = await axiosInstance.get('/forest/supporters', {
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

// 후원신청 완료 처리
export const markSupportComplete = async (id) => {
  try {
    const response = await axiosInstance.patch(`/forest/supports/mark/${id}`);
    return response.data;
  } catch (error) {
    console.error('후원신청 완료 처리 오류:', error);
    throw error;
  }
};
