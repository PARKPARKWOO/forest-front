import { stripHtmlToText } from './contentUtils.js';
import { validateOrganizationDraft } from './organizationDirectoryDraft.js';

const byGroupOrder = (left, right) => (
  left.displayOrder - right.displayOrder
  || String(left.name).localeCompare(String(right.name))
  || String(left.id).localeCompare(String(right.id))
);

export function choosePeopleSource({
  organization,
  organizationStatus,
  organizationErrorStatus,
  legacyStatus,
  hasLegacy,
}) {
  if (organizationStatus === 'loading') return 'loading';
  if (organizationStatus === 'error') return organizationErrorStatus === 404 ? 'hardcoded' : 'error';
  if (organizationStatus !== 'success' || !organization) return 'loading';
  if (organization.configured && !organization.legacyContentDrift) return 'organization';
  if (legacyStatus === 'loading') return 'loading';
  if (legacyStatus === 'error') return 'error';
  return hasLegacy ? 'legacy' : 'organization';
}

export function hasMeaningfulLegacyPeopleHtml(sanitizedHtml = '') {
  const html = typeof sanitizedHtml === 'string' ? sanitizedHtml : '';
  if (stripHtmlToText(html)) return true;
  return (html.match(/<img\b[^>]*>/gi) ?? []).some((tag) => {
    const match = tag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return Boolean((match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim());
  });
}

export function flattenOrganizationGroups(groups = []) {
  const childrenByParent = new Map();
  groups.forEach((group) => {
    const key = group.parentGroupId ?? null;
    const children = childrenByParent.get(key) ?? [];
    children.push(group);
    childrenByParent.set(key, children);
  });
  const flattened = [];
  const visit = (parentGroupId, depth) => {
    (childrenByParent.get(parentGroupId) ?? []).sort(byGroupOrder).forEach((group) => {
      flattened.push({ ...group, depth });
      visit(group.id, depth + 1);
    });
  };
  visit(null, 0);
  return flattened;
}

export function resolveSelectedGroupId(groups, requestedId) {
  const flattened = flattenOrganizationGroups(groups);
  return flattened.some(({ id }) => id === requestedId) ? requestedId : flattened[0]?.id ?? null;
}

export function resolveMembershipAffiliation(membership, person) {
  return membership.affiliationOverride === null || typeof membership.affiliationOverride === 'undefined'
    ? person.affiliation
    : membership.affiliationOverride;
}

export function projectOrganizationDraftForPreview(snapshot) {
  const groupsById = new Map(snapshot.groups.map((group) => [group.id, group]));
  const groupIsVisible = (group) => {
    const visited = new Set();
    let current = group;
    while (current) {
      if (!current.enabled || visited.has(current.id)) return false;
      visited.add(current.id);
      current = current.parentGroupId ? groupsById.get(current.parentGroupId) : null;
    }
    return true;
  };
  const groups = snapshot.groups.filter(groupIsVisible);
  const groupIds = new Set(groups.map(({ id }) => id));
  const enabledPeople = new Set(snapshot.people.filter(({ enabled }) => enabled).map(({ id }) => id));
  const memberships = snapshot.memberships.filter(({ groupId, personId }) => groupIds.has(groupId) && enabledPeople.has(personId));
  const personIds = new Set(memberships.map(({ personId }) => personId));
  return {
    ...snapshot,
    groups,
    people: snapshot.people.filter(({ id }) => personIds.has(id)),
    memberships,
  };
}

export function parseOrganizationSnapshot(value, { managed }) {
  if (
    value === null
    || typeof value !== 'object'
    || value.schemaVersion !== 1
    || typeof value.configured !== 'boolean'
    || !Number.isInteger(value.revision)
    || value.revision < 0
    || typeof value.legacyContentDrift !== 'boolean'
    || !(value.updatedAt === null || typeof value.updatedAt === 'string')
    || !Array.isArray(value.groups)
    || !Array.isArray(value.people)
    || !Array.isArray(value.memberships)
    || validateOrganizationDraft(value).length > 0
    || (managed && !/^sha256:[0-9a-f]{64}$/.test(value.legacyContentFingerprint))
    || (!managed && Object.prototype.hasOwnProperty.call(value, 'legacyContentFingerprint'))
  ) {
    throw new TypeError('조직도 응답 형식이 올바르지 않습니다.');
  }
  return value;
}
