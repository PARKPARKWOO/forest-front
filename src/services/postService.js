import axiosInstance from '../axiosInstance';

// 게시글 등록 (FormData 형식으로 전송)
export const createPost = async (formData) => {
  try {
    const response = await axiosInstance.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// 카테고리별 게시글 목록 조회
export const fetchPostsByCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/posts/${String(categoryId)}`);
    return response.data.data.contents; // PaginatedApiResponseDto의 contents 필드 반환
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// 게시글 상세 조회
export const fetchPostById = async (categoryId, postId) => {
  try {
    const response = await axiosInstance.get(`/posts/detail/${String(categoryId)}/${String(postId)}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// 게시글 삭제
export const deletePost = (categoryId, postId) =>
  axiosInstance.delete(`/posts/${String(categoryId)}/${String(postId)}`);

// 이미지 업로드
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axiosInstance.post('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Server response:', response.data);
    const imageUrl = response.data.data;
    console.log('Image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
