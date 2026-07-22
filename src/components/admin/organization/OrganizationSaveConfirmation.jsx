import AccessibleDialog from '../../../design-system/primitives/AccessibleDialog';
import Button from '../../../design-system/primitives/Button';

export default function OrganizationSaveConfirmation({
  legacyHtml,
  mode,
  onConfirm,
  onCancel,
}) {
  return (
    <AccessibleDialog
      isOpen
      title="기존 함께하는이들 내용 전환 확인"
      description={mode === 'drift'
        ? '기존 내용 변경을 확인했습니다. 현재 편집 중인 조직도를 새 기준으로 저장합니다.'
        : '저장하면 조직도가 공개 화면의 기존 내용을 대체합니다. 기존 정적 콘텐츠는 삭제하지 않습니다.'}
      onClose={onCancel}
      closeLabel="취소"
      size="md"
      footer={<Button className="w-full" onClick={onConfirm}>확인하고 저장</Button>}
    >
      {legacyHtml && (
        <div className="rounded-xl border border-forest-warning-border bg-forest-warning-surface p-4">
          <p className="mb-2 font-bold text-forest-warning-text">현재 확인한 기존 내용</p>
          <div className="prose max-w-none break-words text-forest-text-primary" dangerouslySetInnerHTML={{ __html: legacyHtml }} />
        </div>
      )}
    </AccessibleDialog>
  );
}
