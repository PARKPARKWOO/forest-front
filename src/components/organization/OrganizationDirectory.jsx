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
      <div className="rounded-2xl border border-forest-border-subtle bg-forest-surface-card px-5 py-10 text-center" role="status">
        <h2 className="text-2xl font-bold text-forest-strong">현재 공개된 조직 정보가 없습니다</h2>
        <p className="mt-3 text-lg text-forest-text-muted">조직 정보가 등록되면 이곳에서 확인하실 수 있습니다.</p>
      </div>
    );
  }

  const peopleById = new Map(snapshot.people.map((person) => [person.id, person]));
  const selectedMemberships = snapshot.memberships.filter(({ groupId }) => groupId === selected.id);
  const selectedDescription = typeof selected.description === 'string' ? selected.description.trim() : '';

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
              className={`accessible-touch-target min-w-0 break-words rounded-xl border-2 border-l-8 px-4 py-3 text-left text-lg font-bold focus-visible:outline focus-visible:outline-forest focus-visible:outline-offset-2 focus-visible:outline-forest-focus ${depth > 0 ? 'ms-3' : ''} ${group.id === selectedGroupId ? 'border-forest-strong bg-forest-surface text-forest-text-primary' : 'border-forest-border-subtle border-l-transparent bg-forest-surface-card text-forest-strong'}`}
              onClick={() => onSelectGroup(group.id)}
            >
              {group.name}
            </button>
          ))}
        </nav>
        <section aria-labelledby={`organization-group-${selected.id}`} className="min-w-0 rounded-2xl border border-forest-border-subtle bg-forest-surface-card p-5 sm:p-7">
          <h2 id={`organization-group-${selected.id}`} className="break-words text-2xl font-bold text-forest-strong">{selected.name}</h2>
          {selectedDescription && (
            <p className="mt-3 break-words text-lg leading-relaxed text-forest-text-muted">{selectedDescription}</p>
          )}
          <p className="mt-3 text-lg font-semibold text-forest-text-muted">구성원 {selectedMemberships.length}명</p>
          <OrganizationMemberList group={selected} peopleById={peopleById} memberships={selectedMemberships} />
        </section>
      </div>
    </>
  );
}
