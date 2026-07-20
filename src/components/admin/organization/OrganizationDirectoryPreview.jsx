import { useRef, useState } from 'react';
import OrganizationDirectory from '../../organization/OrganizationDirectory';
import useFocusTrap from '../../../hooks/useFocusTrap';
import {
  projectOrganizationDraftForPreview,
  resolveSelectedGroupId,
} from '../../../utils/organizationDirectory';

export default function OrganizationDirectoryPreview({ draft, onClose }) {
  const snapshot = projectOrganizationDraftForPreview(draft);
  const [selectedGroupId, setSelectedGroupId] = useState(() => resolveSelectedGroupId(snapshot.groups, null));
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap({
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    isActive: true,
    onEscape: onClose,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="저장 전 조직도 미리보기"
        tabIndex={-1}
        className="max-h-full w-full max-w-6xl min-w-0 overflow-y-auto rounded-2xl bg-gray-50 p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-green-950">저장 전 조직도 미리보기</h2>
            <p className="mt-1 text-gray-700">공개 화면과 같은 구성으로 표시하며 서버에는 반영하지 않습니다.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-12 w-full rounded-lg border border-gray-400 bg-white px-4 font-bold text-gray-900 sm:w-auto"
          >
            미리보기 닫기
          </button>
        </div>
        <OrganizationDirectory
          snapshot={snapshot}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          ariaLabel="저장 전 미리보기 그룹"
        />
      </div>
    </div>
  );
}
