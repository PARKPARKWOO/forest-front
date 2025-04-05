import axiosInstance from '../axiosInstance';


export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axiosInstance.post('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Server response:', response.data); // 서버 응답 확인
    const imageUrl = response.data.data;
    console.log('Image URL:', imageUrl); // 최종 URL 확인
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
