import { useState } from 'react';

const byPersonIdentity = (left, right) => (
  left.name.localeCompare(right.name)
  || left.affiliation.localeCompare(right.affiliation)
  || left.id.localeCompare(right.id)
);

export default function OrganizationPeopleDirectory({
  people,
  memberships,
  errors,
  onAdd,
  onChange,
  onDelete,
  onBack,
}) {
  const [newName, setNewName] = useState('');
  const [newAffiliation, setNewAffiliation] = useState('');
  const linkedGroupsByPerson = new Map();
  memberships.forEach((membership) => {
    const names = linkedGroupsByPerson.get(membership.personId) ?? new Set();
    if (membership.groupName) names.add(membership.groupName);
    linkedGroupsByPerson.set(membership.personId, names);
  });
  const errorFor = (personId, field) => errors.find((error) => (
    error.personId === personId && error.path.endsWith(`.${field}`)
  ))?.message;

  const addPerson = () => {
    if (!newName.trim()) return;
    onAdd({ name: newName, affiliation: newAffiliation });
    setNewName('');
    setNewAffiliation('');
  };

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="organization-people-title">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 id="organization-people-title" className="text-xl font-bold text-gray-950">인물 관리</h3>
          <p className="mt-2 text-gray-700">이름이 같아도 소속과 고유 ID로 각각 관리됩니다.</p>
        </div>
        <button type="button" onClick={onBack} className="min-h-12 w-full rounded-lg border border-gray-300 px-4 font-bold text-gray-800 sm:w-auto">
          조직 편집으로 돌아가기
        </button>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="block min-w-0 font-semibold text-gray-800">
          새 인물 이름
          <input type="text" value={newName} maxLength={100} onChange={(event) => setNewName(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 font-normal focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700" />
        </label>
        <label className="block min-w-0 font-semibold text-gray-800">
          새 인물 소속
          <input type="text" value={newAffiliation} maxLength={200} onChange={(event) => setNewAffiliation(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 font-normal focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700" />
        </label>
        <button type="button" disabled={!newName.trim()} onClick={addPerson} className="min-h-12 w-full rounded-lg bg-green-700 px-5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1 lg:w-auto">
          인물 추가
        </button>
      </div>

      {people.length === 0 ? (
        <p className="mt-5 rounded-xl bg-gray-50 px-4 py-6 text-center text-gray-600">등록된 인물이 없습니다.</p>
      ) : (
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          {[...people].sort(byPersonIdentity).map((person) => {
            const linkedGroupNames = [...(linkedGroupsByPerson.get(person.id) ?? [])];
            const nameError = errorFor(person.id, 'name');
            const affiliationError = errorFor(person.id, 'affiliation');
            const nameErrorId = `organization-person-name-error-${person.id}`;
            const affiliationErrorId = `organization-person-affiliation-error-${person.id}`;
            const personContext = `${person.name || '이름 없음'} · ${person.affiliation.trim() || '소속 없음'} · ${linkedGroupNames.length ? linkedGroupNames.join(', ') : '연결 없음'}`;
            return (
              <article key={person.id} data-person-id={person.id} className="min-w-0 rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <strong className="break-words text-lg text-gray-950">{person.name || '이름 없는 인물'}</strong>
                  <span className={`self-start rounded-full px-3 py-1 text-sm font-bold ${person.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                    {person.enabled ? '공개' : '비공개'}
                  </span>
                </div>

                <label htmlFor={`organization-person-name-${person.id}`} className="mt-4 block font-semibold text-gray-800">
                  이름
                </label>
                <input
                  id={`organization-person-name-${person.id}`}
                  type="text"
                  value={person.name}
                  maxLength={100}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? nameErrorId : undefined}
                  aria-label={`${personContext} 이름`}
                  onChange={(event) => onChange(person.id, 'name', event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
                {nameError && <p id={nameErrorId} className="mt-2 text-sm font-semibold text-red-700">{nameError}</p>}

                <label htmlFor={`organization-person-affiliation-${person.id}`} className="mt-4 block font-semibold text-gray-800">
                  기본 소속
                </label>
                <input
                  id={`organization-person-affiliation-${person.id}`}
                  type="text"
                  value={person.affiliation}
                  maxLength={200}
                  aria-invalid={Boolean(affiliationError)}
                  aria-describedby={affiliationError ? affiliationErrorId : undefined}
                  aria-label={`${personContext} 기본 소속`}
                  onChange={(event) => onChange(person.id, 'affiliation', event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
                {affiliationError && <p id={affiliationErrorId} className="mt-2 text-sm font-semibold text-red-700">{affiliationError}</p>}

                <label className="mt-4 flex min-h-12 items-center gap-3 rounded-lg border border-gray-200 px-4 font-semibold text-gray-800">
                  <input type="checkbox" aria-label={`${personContext} 공개`} checked={person.enabled} onChange={(event) => onChange(person.id, 'enabled', event.target.checked)} className="h-5 w-5 accent-green-700" />
                  공개
                </label>
                <p className="mt-4 break-words text-sm text-gray-700">
                  연결된 그룹: {linkedGroupNames.length ? linkedGroupNames.join(', ') : '없음'}
                </p>
                <button type="button" aria-label={`${personContext} 인물 삭제`} onClick={() => onDelete(person.id)} className="mt-4 min-h-12 w-full rounded-lg border border-red-600 px-4 font-bold text-red-700">
                  인물 삭제
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
