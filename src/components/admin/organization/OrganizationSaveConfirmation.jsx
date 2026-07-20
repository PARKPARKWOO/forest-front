import { useRef } from 'react';
import useFocusTrap from '../../../hooks/useFocusTrap';

export default function OrganizationSaveConfirmation({
  legacyHtml,
  mode,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useFocusTrap({
    containerRef: dialogRef,
    initialFocusRef: cancelButtonRef,
    isActive: true,
    onEscape: onCancel,
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-6" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="기존 함께하는이들 내용 전환 확인"
        tabIndex={-1}
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-950">기존 함께하는이들 내용 전환 확인</h2>
        {mode === 'drift' ? (
          <p className="mt-3 text-gray-800">기존 내용 변경을 확인했습니다. 현재 편집 중인 조직도를 새 기준으로 저장합니다.</p>
        ) : (
          <p className="mt-3 text-gray-800">저장하면 조직도가 공개 화면의 기존 내용을 대체합니다. 기존 정적 콘텐츠는 삭제하지 않습니다.</p>
        )}
        {legacyHtml && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-2 font-bold text-amber-950">현재 확인한 기존 내용</p>
            <div className="prose max-w-none break-words text-gray-800" dangerouslySetInnerHTML={{ __html: legacyHtml }} />
          </div>
        )}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-lg border border-gray-400 px-4 font-bold text-gray-900"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-lg bg-green-700 px-4 font-bold text-white"
          >
            확인하고 저장
          </button>
        </div>
      </div>
    </div>
  );
}
