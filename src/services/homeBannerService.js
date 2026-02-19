import axiosInstance from '../axiosInstance';

export const getHomeBanner = async () => {
  try {
    const response = await axiosInstance.get('/home-banner');
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching home banner:', error);
    throw error;
  }
};

export const updateHomeBanner = async (payload) => {
  try {
    const response = await axiosInstance.put('/home-banner', payload);
    return response.data?.data || null;
  } catch (error) {
    console.error('Error updating home banner:', error);
    throw error;
  }
};
