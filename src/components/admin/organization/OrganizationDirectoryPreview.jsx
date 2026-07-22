import { useState } from 'react';
import OrganizationDirectory from '../../organization/OrganizationDirectory';
import AccessibleDialog from '../../../design-system/primitives/AccessibleDialog';
import { ORGANIZATION_WRITES_ENABLED } from '../../../config/organizationDeployment';
import {
  projectOrganizationDraftForPreview,
  resolveSelectedGroupId,
} from '../../../utils/organizationDirectory';

export default function OrganizationDirectoryPreview({ draft, onClose }) {
  const snapshot = projectOrganizationDraftForPreview(draft);
  const [selectedGroupId, setSelectedGroupId] = useState(() => resolveSelectedGroupId(snapshot.groups, null));

  return (
    <AccessibleDialog
      isOpen
      title="저장 전 조직도 미리보기"
      description="공개 화면과 같은 구성으로 표시하며 서버에는 반영하지 않습니다."
      onClose={onClose}
      closeOnBackdrop
      closeLabel="미리보기 닫기"
      size="xl"
    >
      {!ORGANIZATION_WRITES_ENABLED && (
        <p role="status" className="mb-5 rounded-xl border border-forest-info-border bg-forest-info-surface p-4 font-semibold text-forest-info-text">
          미리보기 환경은 읽기 전용이며 이 화면의 변경사항을 서버에 저장하지 않습니다.
        </p>
      )}
      <div className="[&_nav]:!grid-cols-1">
        <OrganizationDirectory
          snapshot={snapshot}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          ariaLabel="저장 전 미리보기 그룹"
        />
      </div>
    </AccessibleDialog>
  );
}
