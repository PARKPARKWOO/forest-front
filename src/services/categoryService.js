import axiosInstance from '../axiosInstance';

const API_BASE_URL = 'http://localhost:8080';

// 카테고리 생성
export const createCategory = (data) =>
  axiosInstance.post('/categories', data);

// 정렬된 카테고리 목록 가져오기
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const fetchCategoryById = async (id) => {
  try {
    console.log('Fetching category by ID:', id);
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/detail/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    console.log('Category data:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

// 하위 카테고리 목록 가져오기
export const fetchChildCategories = async (parentId) => {
  try {
    console.log('Fetching child categories for parent:', parentId);
    // URL 경로 수정
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/child/${parentId}`);
    
    if (!response.ok) {
      console.error('Child categories fetch failed:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Child categories data:', result);
    return result.data;
  } catch (error) {
    console.error('Error fetching child categories:', error);
    throw error;
  }
};

