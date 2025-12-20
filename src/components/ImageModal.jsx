import { useEffect, useRef } from 'react';

export default function ImageModal({ imageUrl, onClose }) {
  const onCloseRef = useRef(onClose);
  
  // onClose가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // ESC 키로 모달 닫기
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    // 스크롤 방지
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, []); // 빈 dependency 배열 - 마운트 시 한 번만 실행

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="닫기"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <img
          src={imageUrl}
          alt="확대 이미지"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}


