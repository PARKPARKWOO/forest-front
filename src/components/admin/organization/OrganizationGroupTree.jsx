import { flattenOrganizationGroups } from '../../../utils/organizationDirectory';

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
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" aria-labelledby="organization-group-tree-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="organization-group-tree-title" className="text-xl font-bold text-gray-900">그룹 구조</h3>
        <button
          type="button"
          onClick={onAddRoot}
          className="min-h-12 rounded-lg bg-green-700 px-4 py-2 font-bold text-white hover:bg-green-800"
        >
          최상위 조직 추가
        </button>
      </div>

      {flattened.length === 0 ? (
        <p className="mt-6 rounded-xl bg-gray-50 px-4 py-6 text-center text-gray-600">등록된 그룹이 없습니다.</p>
      ) : (
        <div role="tree" aria-label="조직 그룹 편집" className="mt-4 space-y-3">
          {flattened.map((group) => {
            const siblings = groups
              .filter(({ parentGroupId }) => parentGroupId === group.parentGroupId)
              .sort(byDisplayOrder);
            const siblingIndex = siblings.findIndex(({ id }) => id === group.id);
            return (
              <div
                key={group.id}
                role="treeitem"
                aria-level={group.depth + 1}
                aria-selected={group.id === selectedGroupId}
                data-group-id={group.id}
                data-parent-id={group.parentGroupId ?? 'root'}
                data-order={group.displayOrder}
                className={`rounded-xl border p-3 ${group.id === selectedGroupId ? 'border-green-700 bg-green-50' : 'border-gray-200 bg-white'}`}
                style={{ marginInlineStart: `${Math.min(group.depth, 6) * 0.75}rem` }}
              >
                <button
                  type="button"
                  data-group-select
                  onClick={() => onSelect(group.id)}
                  className="min-h-12 w-full break-words rounded-lg px-3 py-2 text-left text-base font-bold text-gray-900 hover:bg-green-100"
                  aria-label={`${group.name} 선택`}
                >
                  <span data-group-name>{group.name}</span>
                  <span className={`ml-2 text-sm font-semibold ${group.enabled ? 'text-green-700' : 'text-gray-500'}`}>
                    {group.enabled ? '공개' : '비공개'}
                  </span>
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <button type="button" onClick={() => onAddChild(group.id)} className="min-h-11 rounded-lg border border-green-700 px-2 font-semibold text-green-800" aria-label={`${group.name} 하위 조직 추가`}>하위 추가</button>
                  <button type="button" onClick={() => onMove(group.id, 'up')} disabled={siblingIndex <= 0} className="min-h-11 rounded-lg border border-gray-300 px-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40" aria-label={`${group.name} 위로 이동`}>위로</button>
                  <button type="button" onClick={() => onMove(group.id, 'down')} disabled={siblingIndex === siblings.length - 1} className="min-h-11 rounded-lg border border-gray-300 px-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40" aria-label={`${group.name} 아래로 이동`}>아래로</button>
                  <button type="button" onClick={() => onToggleEnabled(group.id)} className="min-h-11 rounded-lg border border-gray-300 px-2 font-semibold" aria-label={`${group.name} ${group.enabled ? '비공개로 전환' : '공개로 전환'}`}>{group.enabled ? '비공개' : '공개'}</button>
                  <button type="button" onClick={() => onDelete(group.id)} className="min-h-11 rounded-lg border border-red-600 px-2 font-semibold text-red-700" aria-label={`${group.name} 삭제`}>삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
