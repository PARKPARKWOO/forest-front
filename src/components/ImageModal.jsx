import { useEffect, useMemo, useRef } from 'react';

export default function ImageModal({
  imageUrl,
  images = [],
  currentIndex = 0,
  onChangeIndex,
  onClose,
}) {
  const onCloseRef = useRef(onClose);
  const onChangeIndexRef = useRef(onChangeIndex);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onChangeIndexRef.current = onChangeIndex;
  }, [onChangeIndex]);

  const galleryImages = useMemo(() => {
    if (images.length > 0) {
      return images.filter(Boolean);
    }

    return imageUrl ? [imageUrl] : [];
  }, [imageUrl, images]);

  const safeIndex = useMemo(() => {
    if (galleryImages.length === 0) {
      return -1;
    }

    if (currentIndex < 0 || currentIndex >= galleryImages.length) {
      return 0;
    }

    return currentIndex;
  }, [currentIndex, galleryImages]);

  const currentImageUrl = safeIndex >= 0 ? galleryImages[safeIndex] : null;
  const canNavigate = galleryImages.length > 1;

  const moveToIndex = (nextIndex) => {
    if (!canNavigate || !onChangeIndexRef.current) {
      return;
    }

    const normalizedIndex = (nextIndex + galleryImages.length) % galleryImages.length;
    onChangeIndexRef.current(normalizedIndex);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveToIndex(safeIndex - 1);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveToIndex(safeIndex + 1);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [safeIndex, canNavigate, galleryImages.length]);

  if (!currentImageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-2 z-20 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60 hover:text-gray-200"
          aria-label="닫기"
        >
          <svg
            className="h-8 w-8"
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

        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => moveToIndex(safeIndex - 1)}
            disabled={!canNavigate}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="이전 이미지"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex max-h-[80vh] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/20 p-2">
            <img
              src={currentImageUrl}
              alt={`확대 이미지 ${safeIndex + 1}`}
              className="max-h-[76vh] max-w-full rounded-xl object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => moveToIndex(safeIndex + 1)}
            disabled={!canNavigate}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="다음 이미지"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {canNavigate && (
          <>
            <div className="rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white">
              {safeIndex + 1} / {galleryImages.length}
            </div>

            <div className="flex max-w-full gap-3 overflow-x-auto pb-1">
              {galleryImages.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => moveToIndex(index)}
                  className={`overflow-hidden rounded-xl border-2 transition ${
                    index === safeIndex
                      ? 'border-white shadow-lg'
                      : 'border-white/20 opacity-70 hover:border-white/60 hover:opacity-100'
                  }`}
                  aria-label={`${index + 1}번 이미지 보기`}
                >
                  <img
                    src={url}
                    alt={`썸네일 ${index + 1}`}
                    className="h-20 w-20 object-cover md:h-24 md:w-24"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
