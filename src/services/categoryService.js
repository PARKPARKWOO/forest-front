import axiosInstance from '../axiosInstance';

// 카테고리 생성
export const createCategory = async (data) => {
  try {
    console.log('Creating category with data:', data); // 요청 데이터 확인
    const response = await axiosInstance.post('/categories', {
      parentCategoryId: data.parentCategoryId,
      name: data.name,
      type: data.type,
      readAuthority: data.readAuthority,
      writeAuthority: data.writeAuthority,
      order: data.order,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// 정렬된 카테고리 목록 가져오기
export const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get('/categories');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const fetchCategoryById = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/categories/detail/${categoryId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

// 하위 카테고리 목록 가져오기
export const fetchChildCategories = async (parentId) => {
  try {
    const response = await axiosInstance.get(`/categories/child/${parentId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching child categories:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.delete(`/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

