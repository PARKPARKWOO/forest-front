import { resolveMembershipAffiliation } from '../../utils/organizationDirectory';

const byMembershipOrder = (left, right) => (
  left.displayOrder - right.displayOrder
  || String(left.id).localeCompare(String(right.id))
);
const normalizeOptionalText = (value) => (typeof value === 'string' ? value.trim() : '');

export default function OrganizationMemberList({ group, peopleById, memberships }) {
  if (memberships.length === 0) {
    return (
      <p className="mt-6 rounded-xl bg-gray-50 px-5 py-8 text-center text-lg text-gray-700" role="status">
        등록된 공개 구성원이 없습니다
      </p>
    );
  }

  return (
    <ul aria-label={`${group.name} 구성원`} className="mt-6 grid min-w-0 gap-4">
      {[...memberships].sort(byMembershipOrder).map((membership) => {
        const person = peopleById.get(membership.personId);
        if (!person) return null;
        const roleLabel = normalizeOptionalText(membership.roleLabel);
        const affiliation = normalizeOptionalText(resolveMembershipAffiliation(membership, person));
        return (
          <li key={membership.id} className="min-w-0 rounded-xl border border-green-100 bg-green-50/50 p-5">
            <h3 className="break-words text-xl font-bold text-gray-900">{person.name}</h3>
            {roleLabel && (
              <p className="mt-2 break-words text-lg font-semibold text-green-900">{roleLabel}</p>
            )}
            {affiliation && (
              <p className="mt-2 break-words text-lg text-gray-700">{affiliation}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
