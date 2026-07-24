import { flattenOrganizationGroups } from '../../../utils/organizationDirectory';
import Button from '../../../design-system/primitives/Button';
import StatusBadge from '../../../design-system/primitives/StatusBadge';
import Surface from '../../../design-system/patterns/Surface';

const byDisplayOrder = (left, right) => (
  left.displayOrder - right.displayOrder
  || left.name.localeCompare(right.name)
  || left.id.localeCompare(right.id)
);

export default function OrganizationGroupTree({
  groups,
  selectedGroupId,
  onSelect,
  onAddRoot,
  onAddChild,
  onMove,
  onToggleEnabled,
  onDelete,
}) {
  const flattened = flattenOrganizationGroups(groups);

  return (
    <Surface className="min-w-0" aria-labelledby="organization-group-tree-title">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <h3 id="organization-group-tree-title" className="text-forest-heading-3 font-bold text-forest-text-primary">그룹 구조</h3>
        <Button onClick={onAddRoot} className="w-full sm:w-auto">
          최상위 조직 추가
        </Button>
      </div>

      {flattened.length === 0 ? (
        <p className="mt-forest-6 rounded-forest-card bg-forest-surface-raised px-forest-4 py-forest-6 text-center text-forest-text-muted">등록된 그룹이 없습니다.</p>
      ) : (
        <ul aria-label="조직 그룹 편집" className="mt-4 space-y-3">
          {flattened.map((group) => {
            const siblings = groups
              .filter(({ parentGroupId }) => parentGroupId === group.parentGroupId)
              .sort(byDisplayOrder);
            const siblingIndex = siblings.findIndex(({ id }) => id === group.id);
            return (
              <li
                key={group.id}
                aria-level={group.depth + 1}
                aria-posinset={siblingIndex + 1}
                aria-setsize={siblings.length}
                data-group-id={group.id}
                data-parent-id={group.parentGroupId ?? 'root'}
                data-order={group.displayOrder}
                className={`min-w-0 rounded-forest-card border p-3 ${group.id === selectedGroupId ? 'border-forest-primary bg-forest-surface' : 'border-forest-border-subtle bg-forest-surface-card'}`}
                style={{ marginInlineStart: `${Math.min(group.depth, 6) * 0.75}rem` }}
              >
                <button
                  type="button"
                  data-group-select
                  onClick={() => onSelect(group.id)}
                  className="min-h-forest-control w-full break-words rounded-forest-control px-3 py-2 text-left text-base font-bold text-forest-text-primary hover:bg-forest-success-surface focus-visible:outline focus-visible:outline-forest focus-visible:outline-offset-2 focus-visible:outline-forest-focus"
                  aria-label={`${group.name} 선택`}
                  aria-current={group.id === selectedGroupId ? 'true' : undefined}
                >
                  <span data-group-name>{group.name}</span>
                  <StatusBadge className="ml-2" size="sm" tone={group.enabled ? 'success' : 'neutral'}>
                    {group.enabled ? '공개' : '비공개'}
                  </StatusBadge>
                </button>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-5">
                  <Button variant="secondary" onClick={() => onAddChild(group.id)} aria-label={`${group.name} 하위 조직 추가`}>하위 추가</Button>
                  <Button variant="secondary" onClick={() => onMove(group.id, 'up')} disabled={siblingIndex <= 0} aria-label={`${group.name} 위로 이동`}>위로</Button>
                  <Button variant="secondary" onClick={() => onMove(group.id, 'down')} disabled={siblingIndex === siblings.length - 1} aria-label={`${group.name} 아래로 이동`}>아래로</Button>
                  <Button variant="secondary" onClick={() => onToggleEnabled(group.id)} aria-label={`${group.name} ${group.enabled ? '비공개로 전환' : '공개로 전환'}`}>{group.enabled ? '비공개' : '공개'}</Button>
                  <Button variant="danger" onClick={() => onDelete(group.id)} aria-label={`${group.name} 삭제`}>삭제</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
