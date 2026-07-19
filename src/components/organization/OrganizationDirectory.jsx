import { flattenOrganizationGroups } from '../../utils/organizationDirectory';
import OrganizationMemberList from './OrganizationMemberList';

export default function OrganizationDirectory({
  snapshot,
  selectedGroupId,
  onSelectGroup,
  ariaLabel,
}) {
  const groups = flattenOrganizationGroups(snapshot.groups).map(({ depth, ...group }) => ({ group, depth }));
  const selected = groups.find(({ group }) => group.id === selectedGroupId)?.group ?? groups[0]?.group;

  if (!selected) {
    return (
      <div className="rounded-2xl border border-green-200 bg-white px-5 py-10 text-center" role="status">
        <h2 className="text-2xl font-bold text-green-900">등록된 조직이 없습니다</h2>
        <p className="mt-3 text-lg text-gray-700">조직 정보가 등록되면 이곳에서 확인하실 수 있습니다.</p>
      </div>
    );
  }

  const peopleById = new Map(snapshot.people.map((person) => [person.id, person]));
  const selectedMemberships = snapshot.memberships.filter(({ groupId }) => groupId === selected.id);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {selected.name} 선택됨, 구성원 {selectedMemberships.length}명
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]">
        <nav aria-label={ariaLabel} className="grid grid-cols-2 gap-3 max-[320px]:grid-cols-1 lg:grid-cols-1">
          {groups.map(({ group, depth }) => (
            <button
              key={group.id}
              type="button"
              aria-current={group.id === selectedGroupId ? 'true' : undefined}
              className={`accessible-touch-target min-w-0 break-words rounded-xl border-2 border-l-8 px-4 py-3 text-left text-lg font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-green-800 ${depth > 0 ? 'ms-3' : ''} ${group.id === selectedGroupId ? 'border-green-800 bg-green-50 text-green-950' : 'border-green-200 border-l-transparent bg-white text-green-900'}`}
              onClick={() => onSelectGroup(group.id)}
            >
              {group.name}
            </button>
          ))}
        </nav>
        <section aria-labelledby={`organization-group-${selected.id}`} className="min-w-0 rounded-2xl border border-green-200 bg-white p-5 sm:p-7">
          <h2 id={`organization-group-${selected.id}`} className="break-words text-2xl font-bold text-green-900">{selected.name}</h2>
          <p className="mt-3 text-lg font-semibold text-gray-700">구성원 {selectedMemberships.length}명</p>
          <OrganizationMemberList group={selected} peopleById={peopleById} memberships={selectedMemberships} />
        </section>
      </div>
    </>
  );
}
