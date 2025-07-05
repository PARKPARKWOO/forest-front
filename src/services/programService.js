import axiosInstance from '../axiosInstance';

// 프로그램 정보 생성
export const createProgram = async (formData) => {
  try {
    const response = await axiosInstance.post('/program/information', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

// 프로그램 목록 조회
export const fetchPrograms = async (page = 1, size = 9) => {
  try {
    const response = await axiosInstance.get(`/program/information?page=${page}&size=${size}`);
    // 서버 응답 구조: { data: { contents: [], hasNextPage: boolean, totalCount: number } }
    return response.data;
  } catch (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }
};

// 프로그램 상세 조회
export const fetchProgramById = async (id) => {
  try {
    const response = await axiosInstance.get(`/program/information/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
};

export const applyProgram = async (data) => {
  try {
    const formData = new FormData();
    if (data.file) {
      formData.append('file', data.file);
    }
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('programId', data.programId);
    formData.append('depositor', data.depositor);

    const response = await axiosInstance.post('/program/apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error applying program:', error);
    throw error;
  }
};

// 프로그램 신청 목록 조회
export const fetchProgramApplies = async (programId) => {
  try {
    const response = await axiosInstance.get(`/program/${programId}/apply`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching program applies:', error);
    throw error;
  }
};

// 프로그램 신청 상세 조회
export const fetchProgramApplyById = async (applyId) => {
  try {
    const response = await axiosInstance.get(`/program/apply/${applyId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching program apply:', error);
    throw error;
  }
};

// 프로그램 삭제
export const deleteProgram = async (programId) => {
  try {
    const response = await axiosInstance.delete(`/program/information/${programId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting program:', error);
    throw error;
  }
};

// 프로그램 수정
export const updateProgram = async (id, formData) => {
  try {
    const response = await axiosInstance.put(`/program/information/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating program:', error);
    throw error;
  }
}; 