import test from 'node:test';
import assert from 'node:assert/strict';
import {
  choosePeopleSource,
  hasMeaningfulLegacyPeopleHtml,
  parseOrganizationSnapshot,
  projectOrganizationDraftForPreview,
  resolveMembershipAffiliation,
  resolveSelectedGroupId,
} from '../../src/utils/organizationDirectory.js';

const configured = (isConfigured, legacyContentDrift = false) => ({
  configured: isConfigured,
  legacyContentDrift,
  groups: [],
  people: [],
  memberships: [],
});

const ORG_G1 = '11111111-1111-4111-8111-111111111111';
const ORG_G2 = '22222222-2222-4222-8222-222222222222';
const ORG_G3 = '33333333-3333-4333-8333-333333333333';
const ORG_P1 = '44444444-4444-4444-8444-444444444444';
const ORG_P2 = '55555555-5555-4555-8555-555555555555';
const ORG_M1 = '66666666-6666-4666-8666-666666666666';
const ORG_M2 = '77777777-7777-4777-8777-777777777777';
const ORG_M3 = '88888888-8888-4888-8888-888888888888';

const groups = [
  { id: ORG_G1, name: '첫째', parentGroupId: null, displayOrder: 10 },
  { id: ORG_G2, name: '둘째', parentGroupId: null, displayOrder: 20 },
];

const validPublicResponse = {
  schemaVersion: 1,
  configured: true,
  revision: 1,
  legacyContentDrift: false,
  groups: [],
  people: [],
  memberships: [],
  updatedAt: null,
};

test('response parser accepts valid public and managed snapshots', () => {
  assert.equal(parseOrganizationSnapshot(validPublicResponse, { managed: false }), validPublicResponse);
  const managed = { ...validPublicResponse, legacyContentFingerprint: `sha256:${'a'.repeat(64)}` };
  assert.equal(parseOrganizationSnapshot(managed, { managed: true }), managed);
});

test('response parser rejects leaks malformed metadata and malformed items', () => {
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, legacyContentFingerprint: `sha256:${'a'.repeat(64)}` }, { managed: false }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, legacyContentFingerprint: 'bad' }, { managed: true }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, revision: -1 }, { managed: false }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, configured: undefined }, { managed: false }), TypeError);
  assert.throws(() => parseOrganizationSnapshot({ ...validPublicResponse, groups: [{ id: 'bad' }] }, { managed: false }), TypeError);
});

test('source resolver implements configured drift legacy 404 and 500 rules', () => {
  assert.equal(choosePeopleSource({ organization: configured(false), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: true }), 'legacy');
  assert.equal(choosePeopleSource({ organization: configured(false), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: false }), 'organization');
  assert.equal(choosePeopleSource({ organization: configured(true, false), organizationStatus: 'success', legacyStatus: 'loading', hasLegacy: false }), 'organization');
  assert.equal(choosePeopleSource({ organization: configured(true, true), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: true }), 'legacy');
  assert.equal(choosePeopleSource({ organization: configured(true, true), organizationStatus: 'success', legacyStatus: 'success', hasLegacy: false }), 'organization');
  assert.equal(choosePeopleSource({ organizationStatus: 'error', organizationErrorStatus: 404, legacyStatus: 'success', hasLegacy: false }), 'hardcoded');
  assert.equal(choosePeopleSource({ organizationStatus: 'error', organizationErrorStatus: 500, legacyStatus: 'success', hasLegacy: false }), 'error');
});

test('organization errors resolve the complete legacy and fallback matrix', () => {
  const cases = [
    { organizationErrorStatus: 404, legacyStatus: 'loading', hasLegacy: false, expected: 'loading' },
    { organizationErrorStatus: 404, legacyStatus: 'success', hasLegacy: true, expected: 'legacy' },
    { organizationErrorStatus: 404, legacyStatus: 'success', hasLegacy: false, expected: 'hardcoded' },
    { organizationErrorStatus: 404, legacyStatus: 'error', hasLegacy: false, expected: 'hardcoded' },
    { organizationErrorStatus: 500, legacyStatus: 'loading', hasLegacy: false, expected: 'loading' },
    { organizationErrorStatus: 500, legacyStatus: 'success', hasLegacy: true, expected: 'legacy' },
    { organizationErrorStatus: 500, legacyStatus: 'success', hasLegacy: false, expected: 'error' },
    { organizationErrorStatus: 500, legacyStatus: 'error', hasLegacy: false, expected: 'error' },
    { organizationErrorStatus: undefined, legacyStatus: 'loading', hasLegacy: false, expected: 'loading' },
    { organizationErrorStatus: undefined, legacyStatus: 'success', hasLegacy: true, expected: 'legacy' },
    { organizationErrorStatus: undefined, legacyStatus: 'success', hasLegacy: false, expected: 'error' },
    { organizationErrorStatus: undefined, legacyStatus: 'error', hasLegacy: false, expected: 'error' },
  ];

  cases.forEach(({ expected, ...input }) => {
    assert.equal(choosePeopleSource({ organizationStatus: 'error', ...input }), expected);
  });
});

test('configured data does not wait for or fail with an irrelevant legacy request', () => {
  assert.equal(choosePeopleSource({ organization: configured(true, false), organizationStatus: 'success', legacyStatus: 'error', hasLegacy: false }), 'organization');
});

test('legacy request failure is fail-safe when source choice depends on legacy', () => {
  assert.equal(choosePeopleSource({ organization: configured(false), organizationStatus: 'success', legacyStatus: 'error', hasLegacy: false }), 'error');
  assert.equal(choosePeopleSource({ organization: configured(true, true), organizationStatus: 'success', legacyStatus: 'error', hasLegacy: false }), 'error');
  assert.equal(choosePeopleSource({ organizationStatus: 'error', organizationErrorStatus: 404, legacyStatus: 'error', hasLegacy: false }), 'hardcoded');
});

test('sanitized legacy content is meaningful only for text or an image with a source', () => {
  assert.equal(hasMeaningfulLegacyPeopleHtml('<p><br></p>'), false);
  assert.equal(hasMeaningfulLegacyPeopleHtml('<img>'), false);
  assert.equal(hasMeaningfulLegacyPeopleHtml('<img src="/people.png">'), true);
  assert.equal(hasMeaningfulLegacyPeopleHtml('<p>기존 조직도</p>'), true);
});

test('selection uses a stable requested id or the first sorted group', () => {
  assert.equal(resolveSelectedGroupId(groups, groups[1].id), groups[1].id);
  assert.equal(resolveSelectedGroupId(groups, 'missing'), groups[0].id);
});

test('affiliation tri-state inherits hides and overrides', () => {
  assert.equal(resolveMembershipAffiliation({ affiliationOverride: null }, { affiliation: '기본' }), '기본');
  assert.equal(resolveMembershipAffiliation({ affiliationOverride: '' }, { affiliation: '기본' }), '');
  assert.equal(resolveMembershipAffiliation({ affiliationOverride: '별도' }, { affiliation: '기본' }), '별도');
});

test('preview projection mirrors server visibility without teaching the public component about private data', () => {
  const projected = projectOrganizationDraftForPreview({
    schemaVersion: 1,
    groups: [
      { id: ORG_G1, name: '공개', parentGroupId: null, displayOrder: 10, enabled: true },
      { id: ORG_G2, name: '비공개', parentGroupId: null, displayOrder: 20, enabled: false },
      { id: ORG_G3, name: '숨은 자식', parentGroupId: ORG_G2, displayOrder: 10, enabled: true },
    ],
    people: [
      { id: ORG_P1, name: '공개 인물', affiliation: '', enabled: true },
      { id: ORG_P2, name: '비공개 인물', affiliation: '', enabled: false },
    ],
    memberships: [
      { id: ORG_M1, groupId: ORG_G1, personId: ORG_P1, roleLabel: '', affiliationOverride: null, displayOrder: 10 },
      { id: ORG_M2, groupId: ORG_G1, personId: ORG_P2, roleLabel: '', affiliationOverride: null, displayOrder: 20 },
      { id: ORG_M3, groupId: ORG_G3, personId: ORG_P1, roleLabel: '', affiliationOverride: null, displayOrder: 10 },
    ],
  });
  assert.deepEqual(projected.groups.map(({ id }) => id), [ORG_G1]);
  assert.deepEqual(projected.people.map(({ id }) => id), [ORG_P1]);
  assert.deepEqual(projected.memberships.map(({ id }) => id), [ORG_M1]);
});
