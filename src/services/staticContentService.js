import axiosInstance from '../axiosInstance';

export const getStaticContent = async (contentKey) => {
  try {
    const response = await axiosInstance.get(`/static-content/${contentKey}`);
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching static content:', error);
    throw error;
  }
};

export const updateStaticContent = async (contentKey, payload) => {
  try {
    const response = await axiosInstance.put(`/static-content/${contentKey}`, payload);
    return response.data?.data || null;
  } catch (error) {
    console.error('Error updating static content:', error);
    throw error;
  }
};
