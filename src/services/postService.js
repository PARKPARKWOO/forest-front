import axiosInstance from '../axiosInstance';

// 게시글 등록 (FormData 형식으로 전송)
export const createPost = (formData) =>
  axiosInstance.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// 게시글 목록 조회
export const fetchPostsByCategory = (categoryId) =>
  axiosInstance.get(`/posts/${categoryId}`).then(res => res.data.data);

// 게시글 삭제
export const deletePost = (categoryId, postId) =>
  axiosInstance.delete(`/posts/${categoryId}/${postId}`);
