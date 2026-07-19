const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIMITS = {
  groups: 100,
  people: 500,
  memberships: 2000,
  groupName: 100,
  groupDescription: 300,
  personName: 100,
  affiliation: 200,
  roleLabel: 100,
  hierarchyDepth: 8,
};

const byDisplayOrder = (left, right) => (
  left.displayOrder - right.displayOrder
  || String(left.name ?? left.roleLabel ?? '').localeCompare(String(right.name ?? right.roleLabel ?? ''))
  || String(left.id).localeCompare(String(right.id))
);

const isPlainText = (value, { required = false, maximumLength }) => (
  typeof value === 'string'
  && (!required || value.trim().length > 0)
  && value.trim().length <= maximumLength
  && !value.includes('<')
  && !value.includes('>')
);

const isUuidV4 = (value) => typeof value === 'string' && UUID_V4_PATTERN.test(value);
const isInteger = (value) => Number.isInteger(value);
const addError = (errors, path, message) => errors.push({ path, message });

export function validateOrganizationDraft(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object') return [{ path: '', message: '조직도 데이터가 필요합니다.' }];
  if (snapshot.schemaVersion !== 1) addError(errors, 'schemaVersion', '지원하지 않는 조직도 버전입니다.');

  const groups = Array.isArray(snapshot.groups) ? snapshot.groups : null;
  const people = Array.isArray(snapshot.people) ? snapshot.people : null;
  const memberships = Array.isArray(snapshot.memberships) ? snapshot.memberships : null;
  if (!groups) addError(errors, 'groups', '그룹 목록이 필요합니다.');
  if (!people) addError(errors, 'people', '인물 목록이 필요합니다.');
  if (!memberships) addError(errors, 'memberships', '소속 목록이 필요합니다.');
  if (!groups || !people || !memberships) return errors;
  if (groups.length > LIMITS.groups) addError(errors, 'groups', '그룹 수가 너무 많습니다.');
  if (people.length > LIMITS.people) addError(errors, 'people', '인물 수가 너무 많습니다.');
  if (memberships.length > LIMITS.memberships) addError(errors, 'memberships', '소속 수가 너무 많습니다.');

  const groupIds = new Set();
  groups.forEach((group, index) => {
    const path = `groups.${index}`;
    if (!group || typeof group !== 'object') {
      addError(errors, path, '그룹 형식이 올바르지 않습니다.');
      return;
    }
    if (!isUuidV4(group.id) || groupIds.has(group.id)) addError(errors, `${path}.id`, '그룹 ID가 올바르지 않습니다.');
    groupIds.add(group.id);
    if (!isPlainText(group.name, { required: true, maximumLength: LIMITS.groupName })) addError(errors, `${path}.name`, '그룹 이름이 올바르지 않습니다.');
    if (!isPlainText(group.description, { maximumLength: LIMITS.groupDescription })) addError(errors, `${path}.description`, '그룹 설명이 올바르지 않습니다.');
    if (!(group.parentGroupId === null || isUuidV4(group.parentGroupId))) addError(errors, `${path}.parentGroupId`, '상위 그룹 ID가 올바르지 않습니다.');
    if (!isInteger(group.displayOrder)) addError(errors, `${path}.displayOrder`, '표시 순서가 올바르지 않습니다.');
    if (typeof group.enabled !== 'boolean') addError(errors, `${path}.enabled`, '공개 여부가 올바르지 않습니다.');
  });

  const groupsById = new Map(groups.filter(Boolean).map((group) => [group.id, group]));
  const hierarchyErrorIndexes = new Set();
  const reportedCycles = new Set();
  groups.forEach((group, index) => {
    if (!group || !group.parentGroupId) return;
    if (!groupsById.has(group.parentGroupId)) {
      if (isUuidV4(group.parentGroupId)) hierarchyErrorIndexes.add(index);
      return;
    }
    const pathIndexes = new Map();
    const pathIds = [];
    let current = group;
    while (current) {
      if (pathIndexes.has(current.id)) {
        const cycleIds = pathIds.slice(pathIndexes.get(current.id));
        const cycleKey = [...cycleIds].sort().join(':');
        if (!reportedCycles.has(cycleKey)) {
          reportedCycles.add(cycleKey);
          hierarchyErrorIndexes.add(Math.min(...cycleIds.map((id) => groups.findIndex((candidate) => candidate?.id === id))));
        }
        return;
      }
      pathIndexes.set(current.id, pathIds.length);
      pathIds.push(current.id);
      current = current.parentGroupId ? groupsById.get(current.parentGroupId) : null;
    }
    if (pathIds.length > LIMITS.hierarchyDepth) hierarchyErrorIndexes.add(index);
  });
  [...hierarchyErrorIndexes].sort((left, right) => left - right).forEach((index) => {
    addError(errors, `groups.${index}.parentGroupId`, '그룹 계층이 올바르지 않습니다.');
  });

  const peopleIds = new Set();
  people.forEach((person, index) => {
    const path = `people.${index}`;
    if (!person || typeof person !== 'object') {
      addError(errors, path, '인물 형식이 올바르지 않습니다.');
      return;
    }
    if (!isUuidV4(person.id) || peopleIds.has(person.id)) addError(errors, `${path}.id`, '인물 ID가 올바르지 않습니다.');
    peopleIds.add(person.id);
    if (!isPlainText(person.name, { required: true, maximumLength: LIMITS.personName })) addError(errors, `${path}.name`, '인물 이름이 올바르지 않습니다.');
    if (!isPlainText(person.affiliation, { maximumLength: LIMITS.affiliation })) addError(errors, `${path}.affiliation`, '소속이 올바르지 않습니다.');
    if (typeof person.enabled !== 'boolean') addError(errors, `${path}.enabled`, '공개 여부가 올바르지 않습니다.');
  });

  const membershipIds = new Set();
  memberships.forEach((membership, index) => {
    const path = `memberships.${index}`;
    if (!membership || typeof membership !== 'object') {
      addError(errors, path, '소속 형식이 올바르지 않습니다.');
      return;
    }
    if (!isUuidV4(membership.id) || membershipIds.has(membership.id)) addError(errors, `${path}.id`, '소속 ID가 올바르지 않습니다.');
    membershipIds.add(membership.id);
    if (!groupIds.has(membership.groupId)) addError(errors, `${path}.groupId`, '그룹 참조가 올바르지 않습니다.');
    if (!peopleIds.has(membership.personId)) addError(errors, `${path}.personId`, '인물 참조가 올바르지 않습니다.');
    if (!isPlainText(membership.roleLabel, { maximumLength: LIMITS.roleLabel })) addError(errors, `${path}.roleLabel`, '직책이 올바르지 않습니다.');
    if (!(
      membership.affiliationOverride === null
      || typeof membership.affiliationOverride === 'undefined'
      || membership.affiliationOverride === ''
      || isPlainText(membership.affiliationOverride, { required: true, maximumLength: LIMITS.affiliation })
    )) addError(errors, `${path}.affiliationOverride`, '소속 표시가 올바르지 않습니다.');
    if (!isInteger(membership.displayOrder)) addError(errors, `${path}.displayOrder`, '표시 순서가 올바르지 않습니다.');
  });

  const seenPairs = new Set();
  memberships.forEach((membership, index) => {
    if (!membership || typeof membership.groupId !== 'string' || typeof membership.personId !== 'string') return;
    const pair = `${membership.groupId}:${membership.personId}`;
    if (seenPairs.has(pair)) addError(errors, `memberships.${index}.groupId`, '같은 그룹에 같은 인물을 중복 연결할 수 없습니다.');
    seenPairs.add(pair);
  });
  return errors;
}

export function moveGroup(snapshot, groupId, direction) {
  const selected = snapshot.groups.find((group) => group.id === groupId);
  if (!selected || !['up', 'down'].includes(direction)) return snapshot;
  const siblings = snapshot.groups.filter((group) => group.parentGroupId === selected.parentGroupId).sort(byDisplayOrder);
  const index = siblings.findIndex((group) => group.id === groupId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return snapshot;
  [siblings[index], siblings[targetIndex]] = [siblings[targetIndex], siblings[index]];
  const normalizedSiblings = siblings.map((group, order) => ({ ...group, displayOrder: (order + 1) * 10 }));
  let siblingIndex = 0;
  return {
    ...snapshot,
    groups: snapshot.groups.map((group) => (
      group.parentGroupId === selected.parentGroupId ? normalizedSiblings[siblingIndex++] : group
    )),
  };
}

export function moveMembership(snapshot, groupId, membershipId, direction) {
  if (!['up', 'down'].includes(direction)) return snapshot;
  const memberships = snapshot.memberships.filter((membership) => membership.groupId === groupId).sort(byDisplayOrder);
  const index = memberships.findIndex((membership) => membership.id === membershipId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= memberships.length) return snapshot;
  [memberships[index], memberships[targetIndex]] = [memberships[targetIndex], memberships[index]];
  const normalizedMemberships = memberships.map((membership, order) => ({ ...membership, displayOrder: (order + 1) * 10 }));
  let membershipIndex = 0;
  return {
    ...snapshot,
    memberships: snapshot.memberships.map((membership) => (
      membership.groupId === groupId ? normalizedMemberships[membershipIndex++] : membership
    )),
  };
}

export function canDeleteGroup(snapshot, groupId) {
  const childGroupIds = snapshot.groups.filter((group) => group.parentGroupId === groupId).map(({ id }) => id);
  const membershipIds = snapshot.memberships.filter((membership) => membership.groupId === groupId).map(({ id }) => id);
  return { allowed: childGroupIds.length === 0 && membershipIds.length === 0, childGroupIds, membershipIds };
}

export function canDeletePerson(snapshot, personId) {
  const membershipIds = snapshot.memberships.filter((membership) => membership.personId === personId).map(({ id }) => id);
  return { allowed: membershipIds.length === 0, membershipIds };
}

export function getParentCandidates(groups, groupId) {
  const excluded = new Set([groupId]);
  const descendants = new Map();
  groups.forEach((group) => {
    if (!descendants.has(group.parentGroupId)) descendants.set(group.parentGroupId, []);
    descendants.get(group.parentGroupId).push(group.id);
  });
  const addDescendants = (parentId) => (descendants.get(parentId) ?? []).forEach((childId) => {
    if (!excluded.has(childId)) {
      excluded.add(childId);
      addDescendants(childId);
    }
  });
  addDescendants(groupId);
  return groups.filter((group) => !excluded.has(group.id)).sort(byDisplayOrder);
}

export function createUuid() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('안전한 UUID를 생성할 수 없습니다.');
  }
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((byte, index) => `${byte.toString(16).padStart(2, '0')}${[3, 5, 7, 9].includes(index) ? '-' : ''}`).join('');
}
