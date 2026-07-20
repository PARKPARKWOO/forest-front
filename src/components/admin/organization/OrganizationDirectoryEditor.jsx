import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncState from '../../AsyncState';
import useUnsavedChanges from '../../../hooks/useUnsavedChanges';
import { getManagedOrganizationDirectory } from '../../../services/organizationDirectoryService';
import { flattenOrganizationGroups, resolveSelectedGroupId } from '../../../utils/organizationDirectory';
import {
  canDeleteGroup,
  createUuid,
  getParentCandidates,
  moveGroup,
  validateOrganizationDraft,
} from '../../../utils/organizationDirectoryDraft';
import OrganizationGroupForm from './OrganizationGroupForm';
import OrganizationGroupTree from './OrganizationGroupTree';

const cloneEditableSnapshot = (snapshot) => ({
  schemaVersion: snapshot.schemaVersion,
  groups: snapshot.groups.map((group) => ({ ...group })),
  people: snapshot.people.map((person) => ({ ...person })),
  memberships: snapshot.memberships.map((membership) => ({ ...membership })),
});

const stableSerialize = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const nextSiblingOrder = (groups, parentGroupId) => {
  const siblingOrders = groups
    .filter((group) => group.parentGroupId === parentGroupId)
    .map(({ displayOrder }) => displayOrder);
  return siblingOrders.length === 0 ? 10 : Math.max(...siblingOrders) + 10;
};

function DraftGroupPreview({ draft }) {
  const groups = flattenOrganizationGroups(draft.groups);
  return (
    <section className="min-w-0 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm" role="region" aria-label="저장 전 조직도 미리보기">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold text-green-950">저장 전 미리보기</h3>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-green-800">서버 미반영</span>
      </div>
      {groups.length === 0 ? (
        <p className="mt-4 text-gray-700">등록된 조직이 없습니다.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {groups.map((group) => (
            <li key={group.id} className="min-w-0 rounded-xl border border-green-100 bg-white p-4" style={{ marginInlineStart: `${Math.min(group.depth, 6) * 0.75}rem` }}>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="break-words text-gray-950">{group.name || '이름 없는 조직'}</strong>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${group.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                  {group.enabled ? '공개' : '비공개'}
                </span>
              </div>
              {group.description && <p className="mt-2 break-words text-gray-700">{group.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function OrganizationDirectoryEditor({ onBack }) {
  const organizationQuery = useQuery({
    queryKey: ['organizationDirectory', 'manage'],
    queryFn: getManagedOrganizationDirectory,
    retry: false,
  });
  const [acceptedServerSnapshot, setAcceptedServerSnapshot] = useState(null);
  const [draft, setDraft] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const acceptServerSnapshot = (snapshot) => {
    const nextDraft = cloneEditableSnapshot(snapshot);
    setAcceptedServerSnapshot(snapshot);
    setDraft(nextDraft);
    setSelectedGroupId((current) => resolveSelectedGroupId(nextDraft.groups, current));
  };

  useEffect(() => {
    if (!organizationQuery.data || acceptedServerSnapshot) return;
    acceptServerSnapshot(organizationQuery.data);
    // The first successful load is the only automatic draft initialization.
    // Later query responses are compared below and require an explicit refresh.
  }, [acceptedServerSnapshot, organizationQuery.data]);

  const dirty = useMemo(() => (
    Boolean(draft && acceptedServerSnapshot)
    && stableSerialize(draft) !== stableSerialize(cloneEditableSnapshot(acceptedServerSnapshot))
  ), [acceptedServerSnapshot, draft]);
  useUnsavedChanges(dirty);

  const latestServerSnapshot = organizationQuery.data;
  const revisionChanged = Boolean(
    latestServerSnapshot
    && acceptedServerSnapshot
    && latestServerSnapshot.revision !== acceptedServerSnapshot.revision,
  );
  const cutoverStateChanged = Boolean(
    latestServerSnapshot
    && acceptedServerSnapshot
    && (
      latestServerSnapshot.legacyContentFingerprint !== acceptedServerSnapshot.legacyContentFingerprint
      || latestServerSnapshot.legacyContentDrift !== acceptedServerSnapshot.legacyContentDrift
    ),
  );

  if (!draft && !organizationQuery.isError) {
    return <AsyncState status="loading" title="조직도 관리 정보를 불러오고 있습니다" />;
  }
  if (!draft) {
    return (
      <AsyncState
        status="error"
        title="조직도 관리 정보를 불러오지 못했습니다"
        description="관리 권한과 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
        onRetry={organizationQuery.refetch}
        isRetrying={organizationQuery.isFetching}
      />
    );
  }

  const selectedGroup = draft.groups.find(({ id }) => id === selectedGroupId) ?? null;
  const selectedIndex = draft.groups.findIndex(({ id }) => id === selectedGroupId);
  const validationErrors = validateOrganizationDraft(draft);
  const selectedErrors = selectedIndex < 0
    ? []
    : validationErrors.filter(({ path }) => path.startsWith(`groups.${selectedIndex}.`));
  const parentOptions = selectedGroup ? getParentCandidates(draft.groups, selectedGroup.id) : [];

  const addGroup = (parentGroupId) => {
    const newGroup = {
      id: createUuid(),
      name: '새 조직',
      description: '',
      parentGroupId,
      displayOrder: nextSiblingOrder(draft.groups, parentGroupId),
      enabled: true,
    };
    setDraft((current) => ({ ...current, groups: [...current.groups, newGroup] }));
    setSelectedGroupId(newGroup.id);
  };

  const changeSelectedGroup = (field, value) => {
    setDraft((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id !== selectedGroupId) return group;
        if (field === 'parentGroupId' && group.parentGroupId !== value) {
          return {
            ...group,
            parentGroupId: value,
            displayOrder: nextSiblingOrder(current.groups.filter(({ id }) => id !== group.id), value),
          };
        }
        return { ...group, [field]: value };
      }),
    }));
  };

  const deleteGroup = (groupId) => {
    const guard = canDeleteGroup(draft, groupId);
    if (!guard.allowed) {
      const reasons = [];
      if (guard.childGroupIds.length) reasons.push(`하위 조직 ${guard.childGroupIds.length}개`);
      if (guard.membershipIds.length) reasons.push(`구성원 연결 ${guard.membershipIds.length}개`);
      window.alert(`${reasons.join('과 ')}를 먼저 이동하거나 제거해 주세요.`);
      return;
    }
    const group = draft.groups.find(({ id }) => id === groupId);
    if (!group || !window.confirm(`'${group.name}' 그룹을 삭제하시겠습니까?`)) return;
    const groups = draft.groups.filter(({ id }) => id !== groupId);
    setDraft({ ...draft, groups });
    setSelectedGroupId((selected) => (
      selected === groupId ? resolveSelectedGroupId(groups, null) : selected
    ));
  };

  const loadLatestServerSnapshot = () => {
    if (!latestServerSnapshot) return;
    if (dirty && !window.confirm('저장하지 않은 변경사항을 버리고 최신 내용을 불러오시겠습니까?')) return;
    acceptServerSnapshot(latestServerSnapshot);
  };

  return (
    <div className="min-w-0 space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <button type="button" onClick={onBack} className="min-h-12 w-full rounded-lg border border-gray-300 px-4 font-bold text-gray-800 hover:bg-gray-50 sm:w-auto">
          소개글 목록으로 돌아가기
        </button>
        <div className="mt-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">함께하는이들 조직도 관리</h2>
            <p className="mt-2 text-gray-700">그룹 변경은 저장 전 미리보기 모델에만 반영됩니다.</p>
          </div>
          <div className="grid w-full grid-cols-1 items-center gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => organizationQuery.refetch()}
              disabled={organizationQuery.isFetching}
              className="min-h-12 w-full rounded-lg border border-gray-300 px-4 font-bold text-gray-800 disabled:cursor-wait disabled:opacity-60"
            >
              {organizationQuery.isFetching ? '서버 확인 중…' : '서버 변경 확인'}
            </button>
            <p className={`rounded-full px-4 py-2 text-sm font-bold ${dirty ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'}`} role="status">
              {dirty ? '저장하지 않은 변경사항 있음' : '서버 내용과 동일'}
            </p>
          </div>
        </div>
      </header>

      {dirty && revisionChanged && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <strong>다른 관리자가 먼저 저장했습니다.</strong>
          <p className="mt-1">현재 초안은 유지됩니다. 비교 후 최신 내용을 직접 불러와 주세요.</p>
          <button type="button" onClick={loadLatestServerSnapshot} className="mt-3 min-h-12 w-full rounded-lg bg-red-700 px-4 font-bold text-white sm:w-auto">최신 내용 불러오기</button>
        </div>
      )}
      {organizationQuery.isError && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          서버 변경 확인에 실패했습니다. 현재 편집 중인 초안은 그대로 유지됩니다.
        </div>
      )}
      {dirty && cutoverStateChanged && !revisionChanged && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p>기존 함께하는이들 내용의 전환 상태가 바뀌었습니다. 현재 초안과 승인한 기준은 유지됩니다.</p>
          <button type="button" onClick={loadLatestServerSnapshot} className="mt-3 min-h-12 w-full rounded-lg border border-amber-700 px-4 font-bold sm:w-auto">최신 내용 불러오기</button>
        </div>
      )}
      {!dirty && (revisionChanged || cutoverStateChanged) && (
        <div role="status" className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-950">
          <p>서버에 더 최신 내용이 있습니다.</p>
          <button type="button" onClick={loadLatestServerSnapshot} className="mt-3 min-h-12 w-full rounded-lg border border-blue-700 px-4 font-bold sm:w-auto">최신 내용 불러오기</button>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)]">
        <OrganizationGroupTree
          groups={draft.groups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
          onAddRoot={() => addGroup(null)}
          onAddChild={addGroup}
          onMove={(groupId, direction) => setDraft((current) => moveGroup(current, groupId, direction))}
          onToggleEnabled={(groupId) => setDraft((current) => ({
            ...current,
            groups: current.groups.map((group) => (
              group.id === groupId ? { ...group, enabled: !group.enabled } : group
            )),
          }))}
          onDelete={deleteGroup}
        />
        <OrganizationGroupForm
          group={selectedGroup}
          parentOptions={parentOptions}
          errors={selectedErrors}
          onChange={changeSelectedGroup}
        />
      </div>

      <DraftGroupPreview draft={draft} />
    </div>
  );
}
