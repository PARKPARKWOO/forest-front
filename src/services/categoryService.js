import axiosInstance from '../axiosInstance';

// 카테고리 생성
export const createCategory = (data) =>
  axiosInstance.post('/categories', data);

// 정렬된 카테고리 목록 가져오기
export const fetchCategories = () =>
  axiosInstance.get('/categories').then(res => res.data.data);
