import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getNoticeDetail } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';
import ImageModal from '../../components/ImageModal';
import { normalizeListMarkup } from '../../utils/editorContent';

export default function NoticeDetail() {
  const { noticeId } = useParams();
  const { isAdmin } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const contentRef = useRef(null);

  const { data: noticeData, isLoading, error } = useQuery({
    queryKey: ['notice', noticeId],
    queryFn: () => getNoticeDetail(noticeId),
  });

  const notice = noticeData?.data;
  const noticeContent = useMemo(() => normalizeListMarkup(notice?.content || ''), [notice?.content]);

  // onClose 핸들러 메모이제이션
  const handleCloseModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // 본문 내 이미지 클릭 이벤트 추가 (이벤트 위임 사용)
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement || !noticeContent) {
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
  }, [noticeContent]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">공지사항을 찾을 수 없습니다</h2>
          <p className="text-gray-500">요청하신 공지사항이 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/news/notice"
            className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            공지사항 목록으로 돌아가기
          </Link>

          {isAdmin && (
            <Link
              to={`/news/notice/edit/${notice.id}`}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              수정
            </Link>
          )}
        </div>

        {/* 공지사항 내용 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* 헤더 */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{notice.title}</h1>
              {notice.dynamicFields?.important && (
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  [중요]
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500 space-x-6">
              <span>작성자: {notice.authorName}</span>
              <span>작성일: {new Date(notice.updatedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          {/* 이미지 */}
          {notice.images && notice.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">첨부 이미지</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notice.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`첨부 이미지 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 본문 */}
          <div className="rich-content max-w-none">
            <div 
              ref={contentRef}
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: noticeContent }}
            />
          </div>

        </div>
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
