import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeleteGroup,
  canDeletePerson,
  createUuid,
  getParentCandidates,
  moveGroup,
  moveMembership,
  validateOrganizationDraft,
} from '../../src/utils/organizationDirectoryDraft.js';

const G1 = '11111111-1111-4111-8111-111111111111';
const G2 = '22222222-2222-4222-8222-222222222222';
const G3 = '33333333-3333-4333-8333-333333333333';
const P1 = '44444444-4444-4444-8444-444444444444';
const P2 = '55555555-5555-4555-8555-555555555555';
const M1 = '66666666-6666-4666-8666-666666666666';
const M2 = '77777777-7777-4777-8777-777777777777';
const M3 = '88888888-8888-4888-8888-888888888888';

const baseDraft = {
  schemaVersion: 1,
  groups: [
    { id: G1, name: '첫째', description: '', parentGroupId: null, displayOrder: 10, enabled: true },
    { id: G2, name: '둘째', description: '', parentGroupId: null, displayOrder: 20, enabled: true },
    { id: G3, name: '첫째 하위', description: '', parentGroupId: G1, displayOrder: 10, enabled: true },
  ],
  people: [
    { id: P1, name: '홍길동', affiliation: '숲 교육팀', enabled: true },
    { id: P2, name: '김길동', affiliation: '', enabled: true },
  ],
  memberships: [
    { id: M1, groupId: G1, personId: P1, roleLabel: '위원장', affiliationOverride: null, displayOrder: 10 },
  ],
};

test('draft validation reports deterministic field paths', () => {
  const invalid = {
    schemaVersion: 1,
    groups: [
      { id: G1, name: '<b>조직</b>', description: '', parentGroupId: G2, displayOrder: 10, enabled: true },
      { id: G2, name: '둘째', description: '', parentGroupId: G1, displayOrder: 20, enabled: true },
    ],
    people: [{ id: P1, name: '', affiliation: '', enabled: true }],
    memberships: [
      { id: M1, groupId: G1, personId: P2, roleLabel: '', affiliationOverride: '   ', displayOrder: 10 },
      { id: M2, groupId: G1, personId: P2, roleLabel: '', affiliationOverride: null, displayOrder: 20 },
    ],
  };
  assert.deepEqual(
    validateOrganizationDraft(invalid).map(({ path }) => path),
    ['groups.0.name', 'groups.0.parentGroupId', 'people.0.name', 'memberships.0.personId', 'memberships.0.affiliationOverride', 'memberships.1.personId', 'memberships.1.groupId'],
  );
});

test('moving a group changes only siblings and normalizes orders by tens', () => {
  const moved = moveGroup(baseDraft, G2, 'up');
  assert.deepEqual(moved.groups.filter(({ parentGroupId }) => parentGroupId === null).map(({ id, displayOrder }) => [id, displayOrder]), [[G2, 10], [G1, 20]]);
  assert.deepEqual(moved.groups.filter(({ parentGroupId }) => parentGroupId === G1).map(({ id, displayOrder }) => [id, displayOrder]), [[G3, 10]]);
});

test('moving a membership changes only the selected group and normalizes orders by tens', () => {
  const membershipDraft = {
    ...baseDraft,
    memberships: [
      { id: M1, groupId: G1, personId: P1, roleLabel: '위원장', affiliationOverride: null, displayOrder: 10 },
      { id: M2, groupId: G1, personId: P2, roleLabel: '위원', affiliationOverride: null, displayOrder: 20 },
      { id: M3, groupId: G2, personId: P1, roleLabel: '다른 조직', affiliationOverride: null, displayOrder: 10 },
    ],
  };
  const moved = moveMembership(membershipDraft, G1, M2, 'up');
  assert.deepEqual(moved.memberships.filter(({ groupId }) => groupId === G1).map(({ id, displayOrder }) => [id, displayOrder]), [[M2, 10], [M1, 20]]);
  assert.deepEqual(moved.memberships.filter(({ groupId }) => groupId === G2).map(({ id, displayOrder }) => [id, displayOrder]), [[M3, 10]]);
});

test('deletion guards return exact blocking references', () => {
  assert.deepEqual(canDeleteGroup(baseDraft, G1), { allowed: false, childGroupIds: [G3], membershipIds: [M1] });
  assert.deepEqual(canDeletePerson(baseDraft, P1), { allowed: false, membershipIds: [M1] });
});

test('parent candidates exclude self and every descendant', () => {
  assert.deepEqual(getParentCandidates(baseDraft.groups, G1).map(({ id }) => id), [G2]);
});

test('UUID creation returns version four IDs', () => {
  assert.match(createUuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
