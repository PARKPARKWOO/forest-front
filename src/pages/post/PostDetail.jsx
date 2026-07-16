import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePost, fetchPostById } from '../../services/postService';
import { fetchCategoryById } from '../../services/categoryService';
import { useAuth } from '../../contexts/AuthContext';
import ImageModal from '../../components/ImageModal';
import { sanitizeRichText } from '../../utils/editorContent';
import { extractImageUrlsFromHtml, mergeUniqueUrls } from '../../utils/contentUtils';
import AsyncState from '../../components/AsyncState';

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
  const navigationPostType = location.state?.postType;
  const isActivitiesCategory = String(finalCategoryId) === '0';

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    isFetching: isCategoryFetching,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ['category', finalCategoryId],
    queryFn: () => fetchCategoryById(finalCategoryId),
    enabled: Boolean(finalCategoryId && !navigationPostType && !isActivitiesCategory),
  });
  const postType = navigationPostType || (isActivitiesCategory ? 'POST' : category?.type);

  const {
    data: post,
    isLoading,
    isError,
    error: postQueryError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['post', finalCategoryId, postId],
    queryFn: () => fetchPostById(finalCategoryId, postId),
    enabled: !!finalCategoryId && !!postId,
  });
  const postErrorCode = postQueryError?.response?.data?.code;
  const postNotFound = isError && (
    postQueryError?.response?.status === 404 || postErrorCode === 'NOT_FOUND_POST'
  );
  const safeReturnPath = isActivitiesCategory
    ? '/news/activities'
    : finalCategoryId ? `/category/${finalCategoryId}` : '/';
  const safeReturnLabel = finalCategoryId ? '게시글 목록으로 돌아가기' : '홈으로 돌아가기';

  const renderSafeReturn = () => (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={() => navigate(safeReturnPath)}
        className="accessible-touch-target rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
      >
        {safeReturnLabel}
      </button>
    </div>
  );

  const postContent = useMemo(() => sanitizeRichText(post?.content || ''), [post?.content]);
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
      navigate(safeReturnPath);
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

  if (!finalCategoryId || !postId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AsyncState
          status="empty"
          title="게시글 주소를 확인할 수 없습니다"
          description="게시글 목록에서 다시 선택해 주세요."
        />
        {renderSafeReturn()}
      </div>
    );
  }

  if (isLoading || (!navigationPostType && !isActivitiesCategory && isCategoryLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <AsyncState
          status="loading"
          title="게시글을 불러오고 있습니다"
          className="w-full max-w-3xl"
        />
      </div>
    );
  }

  if (postNotFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AsyncState
          status="empty"
          title="게시글을 찾을 수 없습니다"
          description="삭제되었거나 주소가 바뀐 게시글입니다. 게시글 목록에서 다른 글을 확인해 주세요."
        />
        {renderSafeReturn()}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <AsyncState
          status="error"
          title="게시글을 불러오지 못했습니다"
          description="인터넷 연결을 확인한 뒤 다시 시도해 주세요."
          onRetry={refetch}
          isRetrying={isFetching}
          className="w-full max-w-3xl border-red-100"
        />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AsyncState
          status="empty"
          title="게시글을 찾을 수 없습니다"
          description="삭제되었거나 주소가 바뀐 게시글입니다. 게시글 목록에서 다른 글을 확인해 주세요."
        />
        {renderSafeReturn()}
      </div>
    );
  }

  if (!navigationPostType && !isActivitiesCategory && (isCategoryError || !postType)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <AsyncState
          status="error"
          title="게시판 정보를 불러오지 못했습니다"
          description="게시글 목록에서 다시 시도하거나 아래 버튼을 눌러 주세요."
          onRetry={refetchCategory}
          isRetrying={isCategoryFetching}
          className="w-full max-w-3xl border-red-100"
        />
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
        {postType === 'INFORMATION' && canManage && (
          <div className="mb-5 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-h-12 rounded-lg bg-red-600 px-5 py-3 text-base font-semibold text-white
                hover:bg-red-700 disabled:cursor-wait disabled:bg-gray-400"
            >
              {isDeleting ? '삭제 중…' : '이미지 게시물 삭제'}
            </button>
          </div>
        )}
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
                    className="min-h-12 rounded-md bg-green-700 px-4 py-3 text-base font-semibold text-white hover:bg-green-800"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="min-h-12 rounded-md bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
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
