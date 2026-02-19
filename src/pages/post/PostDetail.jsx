import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePost, fetchPostById } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import ImageModal from '../../components/ImageModal';

export default function PostDetail() {
  const { categoryId, postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const contentRef = useRef(null);

  // URL 파라미터에서 categoryId를 가져오거나, 기존 방식대로 location.state에서 가져오기
  const finalCategoryId = categoryId || location.state?.categoryId;
  const postType = location.state?.postType;

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', finalCategoryId, postId],
    queryFn: () => fetchPostById(finalCategoryId, postId),
    enabled: !!finalCategoryId && !!postId,
  });

  const postContent = useMemo(() => post?.content, [post?.content]);
  const currentUserId = user?.userId || user?.id;
  const canManage = Boolean(
    post &&
    finalCategoryId &&
    isAuthenticated &&
    (isAdmin || String(currentUserId) === String(post.authorId))
  );

  const { mutate: removePost, isPending: isDeleting } = useMutation({
    mutationFn: () => deletePost(finalCategoryId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', finalCategoryId] });
      alert('게시글이 삭제되었습니다.');
      navigate(`/category/${finalCategoryId}`);
    },
    onError: (error) => {
      alert('게시글 삭제에 실패했습니다: ' + error.message);
    },
  });

  // onClose 핸들러 메모이제이션
  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // 본문 내 이미지 클릭 이벤트 추가 (이벤트 위임 사용)
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement || !postContent) {
      // cleanup은 항상 반환 (이벤트 리스너가 없어도 안전)
      return () => {};
    }

    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
        setSelectedImage(e.target.src);
      }
    };

    // 모든 이미지에 커서 스타일 추가
    const images = contentElement.querySelectorAll('img');
    images.forEach((img) => {
      img.style.cursor = 'pointer';
    });

    // 이벤트 위임으로 클릭 이벤트 처리
    contentElement.addEventListener('click', handleImageClick);

    return () => {
      // cleanup: 이벤트 리스너 제거
      if (contentElement) {
        contentElement.removeEventListener('click', handleImageClick);
      }
    };
  }, [postContent]);

  if (!finalCategoryId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">잘못된 접근입니다</h2>
        <p className="text-gray-500 mt-2">카테고리 정보가 필요합니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">게시글을 찾을 수 없습니다</h2>
      </div>
    );
  }

  const handleDelete = () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }
    removePost();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        {postType === 'INFORMATION' ? (
          // INFORMATION 타입일 경우 이미지 그리드만 표시
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {post.images && post.images.map((imageUrl, index) => (
              <div
                key={index}
                className="cursor-pointer group"
                onClick={() => setSelectedImage(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`이미지 ${index + 1}`}
                  className="w-full rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          // 일반 게시글 표시
          <>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
              {canManage && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/category/${finalCategoryId}/edit/${postId}`)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-gray-500 mb-8">
              <span>{post.authorName}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
            </div>

            <div 
              ref={contentRef}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.images && post.images.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="cursor-pointer group"
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`첨부 이미지 ${index + 1}`}
                      className="rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

          </>
        )}
      </div>
      
      {/* 이미지 모달 */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 
