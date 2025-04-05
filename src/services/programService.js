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
export const fetchPrograms = async () => {
  try {
    const response = await axiosInstance.get('/program/information');
    return response.data.data.contents;
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