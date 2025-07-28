import axiosInstance from '../axiosInstance';

// 공지사항 목록 조회
export const getNoticeList = async (page = 1) => {
  try {
    const response = await axiosInstance.get(`/notice?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('공지사항 목록 조회 중 오류:', error);
    throw error;
  }
};

// 공지사항 상세 조회
export const getNoticeDetail = async (noticeId) => {
  try {
    const response = await axiosInstance.get(`/notice/${noticeId}`);
    return response.data;
  } catch (error) {
    console.error('공지사항 상세 조회 중 오류:', error);
    throw error;
  }
};

// 공지사항 생성
export const createNotice = async (formData) => {
  try {
    const response = await axiosInstance.post('/notice', formData);
    return response.data;
  } catch (error) {
    console.error('공지사항 생성 중 오류:', error);
    throw error;
  }
};

// 공지사항 삭제
export const deleteNotice = async (noticeId) => {
  try {
    const response = await axiosInstance.delete(`/notice/${noticeId}`);
    return response.data;
  } catch (error) {
    console.error('공지사항 삭제 중 오류:', error);
    throw error;
  }
};
