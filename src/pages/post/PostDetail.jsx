import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePost, fetchPostById } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import ImageModal from '../../components/ImageModal';
import { normalizeListMarkup } from '../../utils/editorContent';
import { extractImageUrlsFromHtml, mergeUniqueUrls } from '../../utils/contentUtils';

export default function PostDetail() {
  const { categoryId, postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const contentRef = useRef(null);

  // URL 파라미터에서 categoryId를 가져오거나, 기존 방식대로 location.state에서 가져오기
  const finalCategoryId = categoryId || location.state?.categoryId;
  const postType = location.state?.postType;

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', finalCategoryId, postId],
    queryFn: () => fetchPostById(finalCategoryId, postId),
    enabled: !!finalCategoryId && !!postId,
  });

  const postContent = useMemo(() => normalizeListMarkup(post?.content || ''), [post?.content]);
  const galleryImages = useMemo(() => {
    const inlineImages = extractImageUrlsFromHtml(postContent);
    return mergeUniqueUrls(inlineImages, post?.images || []);
  }, [post?.images, postContent]);
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
    setSelectedImageIndex(null);
  }, []);

  const handleOpenImage = useCallback((imageUrl) => {
    const imageIndex = galleryImages.indexOf(imageUrl);
    setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
  }, [galleryImages]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement || !postContent) {
      return () => {};
    }

    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
        handleOpenImage(e.target.currentSrc || e.target.src);
      }
    };

    const images = contentElement.querySelectorAll('img');
    images.forEach((img) => {
      img.style.cursor = 'pointer';
    });

    contentElement.addEventListener('click', handleImageClick);

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('click', handleImageClick);
      }
    };
  }, [handleOpenImage, postContent]);

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
                onClick={() => handleOpenImage(imageUrl)}
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
              className="rich-content max-w-none"
              dangerouslySetInnerHTML={{ __html: postContent }}
            />

            {post.images && post.images.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="cursor-pointer group"
                    onClick={() => handleOpenImage(imageUrl)}
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
      {selectedImageIndex !== null && galleryImages.length > 0 && (
        <ImageModal
          images={galleryImages}
          currentIndex={selectedImageIndex}
          onChangeIndex={setSelectedImageIndex}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 
