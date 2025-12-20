import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPostById } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import ImageModal from '../../components/ImageModal';

export default function PostDetail() {
  const { categoryId, postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
            
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

            {/* 동적 필드 - 관리자만 표시 */}
            {isAdmin && post.dynamicFields && Object.keys(post.dynamicFields).length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">추가 정보</h3>
                <dl className="grid grid-cols-2 gap-4">
                  {Object.entries(post.dynamicFields).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500">{key}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{value.toString()}</dd>
                    </div>
                  ))}
                </dl>
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