export const organizationFixture = Object.freeze({
  schemaVersion: 1,
  configured: true,
  revision: 2,
  legacyContentDrift: false,
  groups: [
    { id: '11111111-1111-4111-8111-111111111111', name: '운영위원회', description: '운영 설명', parentGroupId: null, displayOrder: 10, enabled: true },
    { id: '22222222-2222-4222-8222-222222222222', name: '숲교육분과 이름이 길어도 줄바꿈됩니다', description: '', parentGroupId: '11111111-1111-4111-8111-111111111111', displayOrder: 10, enabled: true },
  ],
  people: [
    { id: '33333333-3333-4333-8333-333333333333', name: '김테스트', affiliation: '기본 소속', enabled: true },
    { id: '44444444-4444-4444-8444-444444444444', name: '이테스트이름이길어도줄바꿈됩니다', affiliation: '', enabled: true },
  ],
  memberships: [
    { id: '55555555-5555-4555-8555-555555555555', groupId: '11111111-1111-4111-8111-111111111111', personId: '33333333-3333-4333-8333-333333333333', roleLabel: '운영위원장', affiliationOverride: null, displayOrder: 10 },
    { id: '66666666-6666-4666-8666-666666666666', groupId: '22222222-2222-4222-8222-222222222222', personId: '33333333-3333-4333-8333-333333333333', roleLabel: '분과장', affiliationOverride: '', displayOrder: 10 },
    { id: '77777777-7777-4777-8777-777777777777', groupId: '22222222-2222-4222-8222-222222222222', personId: '44444444-4444-4444-8444-444444444444', roleLabel: '분과위원', affiliationOverride: '별도 소속 문구', displayOrder: 20 },
  ],
  updatedAt: '2026-07-19T12:00:00+09:00',
});

export const organizationGroupIds = Object.freeze({
  root: '11111111-1111-4111-8111-111111111111',
  child: '22222222-2222-4222-8222-222222222222',
  empty: '88888888-8888-4888-8888-888888888888',
});

export const legacyPeopleHtml = [
  '<h2>기존 조직도 명단</h2>',
  '<p>기존 화면만 보입니다.</p>',
  '<img src="/draft/forest-hero-placeholder.svg" alt="기존 조직도 예시" onerror="window.__legacyUnsafe = true">',
  '<script>window.__legacyUnsafe = true</script>',
].join('');

export const emptyLegacyPeopleHtml = '<p><br></p>';

export function copyOrganization(overrides = {}) {
  return {
    ...organizationFixture,
    ...overrides,
    groups: overrides.groups ?? organizationFixture.groups.map((group) => ({ ...group })),
    people: overrides.people ?? organizationFixture.people.map((person) => ({ ...person })),
    memberships: overrides.memberships ?? organizationFixture.memberships.map((membership) => ({ ...membership })),
  };
}
