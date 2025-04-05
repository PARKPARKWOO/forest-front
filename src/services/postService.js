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

// 게시글 목록 조회 - PaginatedApiResponseBody 형식에 맞춤
export const fetchPostsByCategory = async (categoryId) => {
  try {
    const response = await axiosInstance.get(`/posts/${categoryId}`);
    return response.data.data.contents; // PaginatedApiResponseDto의 contents 필드 반환
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// 게시글 상세 조회 - SucceededApiResponseBody 형식에 맞춤
export const fetchPostById = async (postId) => {
  try {
    const response = await axiosInstance.get(`/posts/detail/${postId}`);
    return response.data.data; // SucceededApiResponseBody의 data 필드 반환
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// 게시글 삭제
export const deletePost = (categoryId, postId) =>
  axiosInstance.delete(`/posts/${categoryId}/${postId}`);

// 이미지 업로드
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('images', file);
    
    const response = await axiosInstance.post('/posts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data; // 업로드된 이미지 URL 반환
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
