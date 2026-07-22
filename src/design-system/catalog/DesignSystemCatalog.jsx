import { useState } from 'react';
import AsyncState from '../primitives/AsyncState';
import ActionLink from '../primitives/ActionLink';
import Button from '../primitives/Button';
import FormField from '../primitives/FormField';
import IconButton from '../primitives/IconButton';
import StatusBadge from '../primitives/StatusBadge';
import Surface from '../patterns/Surface';

export default function DesignSystemCatalog() {
  const [groupName, setGroupName] = useState('');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6" data-design-system-catalog="forest-v1">
      <header>
        <p className="text-forest-body font-bold text-forest-strong">개발·테스트 전용</p>
        <h1 className="mt-2 text-forest-heading-1 font-bold text-forest-text-primary">Forest 디자인 시스템</h1>
        <p className="mt-3 max-w-3xl text-forest-body text-forest-text-muted">
          공개 화면과 관리자 화면에서 함께 사용하는 상태와 조작을 검증합니다.
        </p>
      </header>

      <section aria-labelledby="catalog-actions" className="rounded-forest-card border border-forest-border-subtle bg-forest-surface-card p-forest-panel">
        <h2 id="catalog-actions" className="text-forest-heading-3 font-bold text-forest-text-primary">행동</h2>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button>주 행동</Button>
          <Button variant="secondary">보조 행동</Button>
          <Button variant="quiet">조용한 행동</Button>
          <Button variant="danger">위험 행동</Button>
          <Button isPending pendingLabel="저장 중…">저장</Button>
          <Button disabled>사용 불가</Button>
          <span className="rounded-forest-control bg-forest-strong p-forest-1">
            <Button variant="inverseQuiet">역상 행동</Button>
          </span>
          <IconButton label="항목 닫기">×</IconButton>
          <IconButton label="항목 삭제" variant="danger">×</IconButton>
          <ActionLink to="/programs/participate">프로그램 보기</ActionLink>
        </div>
      </section>

      <Surface aria-labelledby="catalog-forms">
        <h2 id="catalog-forms" className="text-forest-heading-3 font-bold text-forest-text-primary">폼과 상태</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <FormField id="catalog-group-name" label="그룹 이름" error="그룹 이름을 입력해 주세요." required>
            {(controlProps) => (
              <input {...controlProps} value={groupName} onChange={(event) => setGroupName(event.target.value)} />
            )}
          </FormField>
          <div className="flex flex-wrap items-start gap-3">
            <StatusBadge>확인 전</StatusBadge>
            <StatusBadge tone="success">접수 중</StatusBadge>
            <StatusBadge tone="warning">저장하지 않은 변경</StatusBadge>
            <StatusBadge tone="danger">확인 필요</StatusBadge>
            <StatusBadge tone="info">안내</StatusBadge>
          </div>
        </div>
      </Surface>

      <section aria-labelledby="catalog-async-states">
        <h2 id="catalog-async-states" className="text-forest-heading-3 font-bold text-forest-text-primary">비동기 상태</h2>
        <div className="mt-forest-4 grid gap-forest-4 lg:grid-cols-2">
          <AsyncState status="loading" />
          <AsyncState status="empty" />
          <AsyncState status="error" onRetry={() => {}} />
          <AsyncState status="forbidden" />
        </div>
      </section>
    </div>
  );
}
