import { useEffect, useMemo, useState } from 'react';

const byDisplayOrder = (left, right) => (
  left.displayOrder - right.displayOrder
  || String(left.id).localeCompare(String(right.id))
);

const affiliationMode = (membership) => {
  if (membership.affiliationOverride === null || typeof membership.affiliationOverride === 'undefined') return 'inherit';
  if (membership.affiliationOverride === '') return 'hide';
  return 'custom';
};

const toOverride = ({ mode, customValue }) => {
  if (mode === 'inherit') return null;
  if (mode === 'hide') return '';
  return customValue;
};

const personOptionLabel = (person) => {
  const affiliation = person.affiliation.trim() || '소속 없음';
  const linkedGroups = person.linkedGroupNames?.length
    ? person.linkedGroupNames.join(', ')
    : '연결 없음';
  return `${person.name} · ${affiliation} · ${linkedGroups}`;
};

export default function OrganizationMembershipEditor({
  group,
  memberships,
  people,
  errors,
  onAddExisting,
  onCreateAndAdd,
  onChange,
  onMove,
  onRemove,
}) {
  const [existingPersonId, setExistingPersonId] = useState('');
  const [newName, setNewName] = useState('');
  const [newAffiliation, setNewAffiliation] = useState('');
  const [lastCustomValuesByMembershipId, setLastCustomValuesByMembershipId] = useState({});
  const [pendingCustomMembershipIds, setPendingCustomMembershipIds] = useState(new Set());
  const connectedPersonIds = useMemo(
    () => new Set(memberships.map(({ personId }) => personId)),
    [memberships],
  );

  useEffect(() => {
    setExistingPersonId('');
    setNewName('');
    setNewAffiliation('');
    setPendingCustomMembershipIds(new Set());
  }, [group?.id]);

  if (!group) return null;

  const sortedMemberships = [...memberships].sort(byDisplayOrder);
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const selectedAlreadyConnected = connectedPersonIds.has(existingPersonId);
  const errorFor = (membershipId, field) => errors.find((error) => (
    error.membershipId === membershipId && error.path.endsWith(`.${field}`)
  ))?.message;

  const addCreatedPerson = () => {
    if (!newName.trim()) return;
    onCreateAndAdd({ name: newName, affiliation: newAffiliation });
    setNewName('');
    setNewAffiliation('');
  };

  return (
    <section
      role="region"
      aria-label={`${group.name} 구성원 편집`}
      className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h3 className="break-words text-xl font-bold text-gray-900">{group.name} 구성원 편집</h3>
        <p className="mt-2 text-gray-700">인물 연결마다 직책과 소속 표시를 따로 설정할 수 있습니다.</p>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 lg:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`organization-existing-person-${group.id}`} className="block font-semibold text-gray-800">
            기존 인물
          </label>
          <select
            id={`organization-existing-person-${group.id}`}
            value={existingPersonId}
            onChange={(event) => setExistingPersonId(event.target.value)}
            className="mt-2 min-h-12 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
          >
            <option value="">연결할 인물을 선택하세요</option>
            {people.map((person) => (
              <option key={person.id} value={person.id} disabled={connectedPersonIds.has(person.id)}>
                {personOptionLabel(person)}{connectedPersonIds.has(person.id) ? ' · 이미 이 그룹에 연결됨' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!existingPersonId || selectedAlreadyConnected}
            onClick={() => {
              onAddExisting(existingPersonId);
              setExistingPersonId('');
            }}
            className="mt-3 min-h-12 w-full rounded-lg bg-green-700 px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            기존 인물 연결
          </button>
        </div>

        <div className="min-w-0 border-t border-gray-200 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <label htmlFor={`organization-new-member-name-${group.id}`} className="block font-semibold text-gray-800">
            새 인물 이름
          </label>
          <input
            id={`organization-new-member-name-${group.id}`}
            type="text"
            value={newName}
            maxLength={100}
            onChange={(event) => setNewName(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <label htmlFor={`organization-new-member-affiliation-${group.id}`} className="mt-4 block font-semibold text-gray-800">
            새 인물 기본 소속
          </label>
          <input
            id={`organization-new-member-affiliation-${group.id}`}
            type="text"
            value={newAffiliation}
            maxLength={200}
            onChange={(event) => setNewAffiliation(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <button
            type="button"
            disabled={!newName.trim()}
            onClick={addCreatedPerson}
            className="mt-3 min-h-12 w-full rounded-lg border border-green-700 px-4 py-2 font-bold text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            새 인물 만들고 연결
          </button>
        </div>
      </div>

      {sortedMemberships.length === 0 ? (
        <p className="mt-5 rounded-xl bg-gray-50 px-4 py-6 text-center text-gray-600">연결된 구성원이 없습니다.</p>
      ) : (
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          {sortedMemberships.map((membership, index) => {
            const person = peopleById.get(membership.personId);
            if (!person) return null;
            const persistedMode = affiliationMode(membership);
            const pendingCustom = pendingCustomMembershipIds.has(membership.id);
            const mode = pendingCustom ? 'custom' : persistedMode;
            const roleError = errorFor(membership.id, 'roleLabel');
            const affiliationError = errorFor(membership.id, 'affiliationOverride');
            const displayedAffiliationError = pendingCustom
              ? '다른 소속을 입력해 주세요.'
              : affiliationError;
            const roleErrorId = `organization-membership-role-error-${membership.id}`;
            const affiliationErrorId = `organization-membership-affiliation-error-${membership.id}`;
            const personContext = `${person.name} · ${person.affiliation.trim() || '소속 없음'}`;
            const setCustomPending = (pending) => {
              setPendingCustomMembershipIds((current) => {
                const next = new Set(current);
                if (pending) next.add(membership.id);
                else next.delete(membership.id);
                return next;
              });
            };
            const changeAffiliationMode = (nextMode) => {
              if (persistedMode === 'custom' && membership.affiliationOverride.trim()) {
                setLastCustomValuesByMembershipId((current) => ({
                  ...current,
                  [membership.id]: membership.affiliationOverride,
                }));
              }
              if (nextMode !== 'custom') {
                setCustomPending(false);
                onChange(membership.id, 'affiliationOverride', toOverride({
                  mode: nextMode,
                  customValue: '',
                }));
                return;
              }
              const rememberedCustomValue = lastCustomValuesByMembershipId[membership.id]
                ?? (persistedMode === 'custom' ? membership.affiliationOverride : '');
              const initialCustomValue = rememberedCustomValue.trim()
                ? rememberedCustomValue
                : person.affiliation.trim() ? person.affiliation : '';
              if (!initialCustomValue) {
                setCustomPending(true);
                return;
              }
              setCustomPending(false);
              onChange(membership.id, 'affiliationOverride', toOverride({
                mode: 'custom',
                customValue: initialCustomValue,
              }));
            };
            return (
              <article
                key={membership.id}
                data-membership-id={membership.id}
                data-person-id={person.id}
                data-order={membership.displayOrder}
                className="min-w-0 rounded-xl border border-gray-200 p-4"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="break-words text-lg font-bold text-gray-950">{person.name}</h4>
                    <p className="break-words text-sm text-gray-600">{person.affiliation || '기본 소속 없음'}</p>
                  </div>
                  {!person.enabled && <span className="self-start rounded-full bg-gray-200 px-3 py-1 text-sm font-bold text-gray-700">인물 비공개</span>}
                </div>

                <label htmlFor={`organization-membership-role-${membership.id}`} className="mt-4 block font-semibold text-gray-800">
                  직책
                </label>
                <input
                  id={`organization-membership-role-${membership.id}`}
                  type="text"
                  value={membership.roleLabel}
                  maxLength={100}
                  aria-invalid={Boolean(roleError)}
                  aria-describedby={roleError ? roleErrorId : undefined}
                  aria-label={`${personContext} 직책`}
                  onChange={(event) => onChange(membership.id, 'roleLabel', event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
                {roleError && <p id={roleErrorId} className="mt-2 text-sm font-semibold text-red-700">{roleError}</p>}

                <fieldset className="mt-4 min-w-0">
                  <legend className="font-semibold text-gray-800">소속 표시</legend>
                  <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      ['inherit', '기본 소속 사용'],
                      ['hide', '소속 숨김'],
                      ['custom', '다른 소속 입력'],
                    ].map(([value, label]) => (
                      <label key={value} className="flex min-h-12 min-w-0 items-center gap-2 rounded-lg border border-gray-200 px-3 font-semibold text-gray-800">
                        <input
                          type="radio"
                          name={`organization-membership-affiliation-${membership.id}`}
                          value={value}
                          checked={mode === value}
                          aria-label={`${personContext} ${label}`}
                          onChange={() => changeAffiliationMode(value)}
                          className="h-5 w-5 shrink-0 accent-green-700"
                        />
                        <span className="break-words">{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {mode === 'custom' && (
                  <label htmlFor={`organization-membership-custom-affiliation-${membership.id}`} className="mt-3 block font-semibold text-gray-800">
                    다른 소속
                    <input
                      id={`organization-membership-custom-affiliation-${membership.id}`}
                      type="text"
                      maxLength={200}
                      value={pendingCustom ? '' : membership.affiliationOverride}
                      aria-invalid={Boolean(displayedAffiliationError)}
                      aria-describedby={displayedAffiliationError ? affiliationErrorId : undefined}
                      aria-label={`${personContext} 다른 소속`}
                      onChange={(event) => {
                        const nextCustomValue = event.target.value;
                        if (nextCustomValue.trim()) {
                          setLastCustomValuesByMembershipId((current) => ({
                            ...current,
                            [membership.id]: nextCustomValue,
                          }));
                          setCustomPending(false);
                        } else {
                          if (persistedMode === 'custom' && membership.affiliationOverride.trim()) {
                            setLastCustomValuesByMembershipId((current) => ({
                              ...current,
                              [membership.id]: membership.affiliationOverride,
                            }));
                          }
                          setCustomPending(true);
                        }
                        onChange(membership.id, 'affiliationOverride', toOverride({
                          mode: nextCustomValue.trim() ? 'custom' : 'hide',
                          customValue: nextCustomValue,
                        }));
                      }}
                      className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 font-normal focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
                    />
                  </label>
                )}
                {displayedAffiliationError && <p id={affiliationErrorId} className="mt-2 text-sm font-semibold text-red-700">{displayedAffiliationError}</p>}

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button type="button" aria-label={`${personContext} 연결 위로`} disabled={index === 0} onClick={() => onMove(membership.id, 'up')} className="min-h-12 rounded-lg border border-gray-300 px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40">연결 위로</button>
                  <button type="button" aria-label={`${personContext} 연결 아래로`} disabled={index === sortedMemberships.length - 1} onClick={() => onMove(membership.id, 'down')} className="min-h-12 rounded-lg border border-gray-300 px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40">연결 아래로</button>
                  <button type="button" aria-label={`${personContext} 연결 제거`} onClick={() => onRemove(membership.id)} className="min-h-12 rounded-lg border border-red-600 px-3 font-semibold text-red-700">연결 제거</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
