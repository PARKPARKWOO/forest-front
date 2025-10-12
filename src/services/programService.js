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
    // 서버 응답 구조: { data: { ... }, success: true }
    return response.data.data;
  } catch (error) {
    console.error('Error fetching program:', error);
    throw error;
  }
};

export const applyProgram = async (data) => {
  try {
    const formData = new FormData();
    
    // 필수 파라미터
    formData.append('programId', data.programId);
    formData.append('imageAgreement', data.imageAgreement);
    formData.append('privacyAgreement', data.privacyAgreement);
    
    // 선택 파라미터
    if (data.file) {
      formData.append('file', data.file);
    }
    
    // formResponses 처리: File 객체 분리
    const responses = {
      phoneNumber: data.phoneNumber,
      depositor: data.depositor,
      ...(data.formResponses || {})
    };
    
    const jsonResponses = {};
    const fileFields = {};
    
    // File 객체와 일반 값 분리
    Object.entries(responses).forEach(([key, value]) => {
      if (value instanceof File) {
        // File 객체는 별도로 FormData에 추가
        formData.append(`formFile_${key}`, value);
        fileFields[key] = value.name; // 파일명만 JSON에 저장
        jsonResponses[key] = `FILE_PENDING_${key}`; // 서버에서 URL로 대체될 플레이스홀더
      } else {
        // 일반 값은 JSON에 포함
        jsonResponses[key] = value;
      }
    });
    
    formData.append('formResponses', JSON.stringify(jsonResponses));
    
    // 디버깅용
    console.log('전송 데이터:', {
      jsonResponses,
      fileFields: Object.keys(fileFields)
    });

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
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching program applies:', error);
    throw error;
  }
};

// 프로그램 신청 상세 조회
export const fetchProgramApplyById = async (applyId) => {
  try {
    const response = await axiosInstance.get(`/program/apply/${applyId}`);
    return response.data?.data || response.data;
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

// ===== 프로그램 폼 관련 API =====

// 프로그램 신청 폼 생성
export const createProgramForm = async (formData) => {
  try {
    const response = await axiosInstance.post('/program/form', formData);
    return response.data;
  } catch (error) {
    console.error('Error creating program form:', error);
    throw error;
  }
};

// 프로그램별 신청 폼 조회
export const fetchProgramForm = async (programId) => {
  try {
    const response = await axiosInstance.get(`/program/form/program/${programId}`);
    return response.data?.data || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // 폼이 없는 경우
    }
    console.error('Error fetching program form:', error);
    throw error;
  }
};

// 폼 ID로 조회
export const fetchFormById = async (formId) => {
  try {
    const response = await axiosInstance.get(`/program/form/${formId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching form:', error);
    throw error;
  }
};

// 프로그램 신청 폼 수정
export const updateProgramForm = async (formId, formData) => {
  try {
    const response = await axiosInstance.put(`/program/form/${formId}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error updating program form:', error);
    throw error;
  }
};

// 프로그램 신청 폼 삭제
export const deleteProgramForm = async (formId) => {
  try {
    const response = await axiosInstance.delete(`/program/form/${formId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting program form:', error);
    throw error;
  }
};