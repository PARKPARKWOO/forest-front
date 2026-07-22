# Forest Design System Foundation and Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forest 프런트엔드 저장소 안에 접근 가능한 디자인 시스템 기반을 만들고, 공개/관리자 홈 Hero와 구조화 공개 조직도·관리자 그룹 편집 대표 화면을 첫 파일럿으로 전환한다.

**Architecture:** `src/design-system/tokens/tokens.css`를 런타임 값의 단일 원본으로 두고, `DESIGN.md`는 토큰 이름과 사용 이유를 설명한다. 도메인을 모르는 primitive/pattern은 `src/design-system`에, 홈 Hero와 조직도 같은 Forest 전용 UI는 feature/component 경계에 둔다. 기존 import는 얇은 re-export로 보존하고, 공개 화면과 관리자 미리보기는 같은 `HomeHero` 렌더러를 사용한다.

**Tech Stack:** React 18, React Router 7, Vite 6, Tailwind CSS 3, Node `node:test`, Playwright 1.61, `@axe-core/playwright`

## Global Constraints

- 별도 디자인 시스템 저장소, npm 패키지, Storybook, Vitest, Jest, React Testing Library를 추가하지 않는다.
- 정확한 런타임 토큰 값은 `src/design-system/tokens/tokens.css` 한 곳에서만 정의한다.
- 공개 본문은 18px 이상, 관리자 핵심 정보·입력·버튼은 16px 이상으로 유지한다.
- 주요 조작 영역과 아이콘 버튼은 최소 48×48px다.
- 포커스 표시는 최소 4px로 눈에 띄게 유지하고, 색만으로 상태를 전달하지 않는다.
- 자동 슬라이드를 추가하지 않으며 `prefers-reduced-motion`을 유지한다.
- 공개 화면과 관리자 배너 미리보기는 같은 `HomeHero` 컴포넌트를 사용한다.
- 백엔드 `HomeBannerContent`의 기존 필드는 삭제하지 않는다. 관리자에서 숨긴 색상·우측 카드 값은 저장 payload에서 보존하고 `autoSlideSeconds`는 생략하여 서버 기존값을 유지한다.
- 관리자 홈 배너 GET 실패 시 fallback을 편집·저장 화면으로 노출하지 않으며, 공개 필드의 공백은 서버 기본값으로 바뀌기 전에 폼 오류로 차단한다.
- 디자인 시스템 카탈로그는 `VITE_DRAFT_MODE=true`인 development/test 빌드에만 존재하고 normal/Preview production build에는 route와 marker가 없어야 한다.
- 이번 계획의 조직도 범위는 구조화 공개 디렉터리, 관리자 그룹 트리/폼, 미리보기·저장확인 dialog인 대표 파일럿이다. `OrganizationPeopleDirectory`, `OrganizationMembershipEditor`, `LegacyOrganizationDirectory`, 관리자 편집기 헤더의 전체 스타일 전환은 후속 계획에 남긴다.
- 프로그램·게시글·후원·사용자 관리·전체 PageSubnav/ResponsiveDataView 전환도 파일럿 승인 후 별도 계획으로 작성한다.
- 새 스크린샷 기준은 사용자 시각 검토 승인을 받은 뒤에만 커밋한다.
- 원격 푸시와 Vercel/운영 배포는 전체 검증 후 사용자의 별도 승인을 받기 전에는 실행하지 않는다.

## File Map

### Create

- `DESIGN.md` — Forest 작업자와 AI 에이전트가 읽는 디자인 계약
- `src/design-system/tokens/tokens.css` — 런타임 의미 토큰 단일 원본
- `src/design-system/primitives/actionControlStyles.js` — Button/ActionLink 공용 variant·size
- `src/design-system/primitives/Button.jsx`
- `src/design-system/primitives/ActionLink.jsx`
- `src/design-system/primitives/IconButton.jsx`
- `src/design-system/primitives/FormField.jsx`
- `src/design-system/primitives/StatusBadge.jsx`
- `src/design-system/primitives/AsyncState.jsx`
- `src/design-system/primitives/useFocusTrap.js`
- `src/design-system/primitives/AccessibleDialog.jsx`
- `src/design-system/patterns/Surface.jsx`
- `src/design-system/patterns/SectionHeading.jsx`
- `src/design-system/catalog/DesignSystemCatalog.jsx`
- `src/design-system/tests/tokens.test.js`
- `src/design-system/tests/sourcePolicy.test.js`
- `src/features/home/homeHeroModel.js`
- `src/features/home/HomeHero.jsx`
- `tests/unit/homeHeroModel.test.js`
- `tests/e2e/design-system-catalog.spec.js`
- `tests/e2e/home-hero-parity.spec.js`
- `tests/e2e/home-hero-admin-save.spec.js`
- `tests/e2e/design-system-production-boundary.spec.js`
- `playwright.built.config.js`

### Modify

- `package.json` — 전체 unit/design-system/built E2E scripts
- `src/index.css` — token import와 전역 의미 토큰 사용
- `tailwind.config.cjs` — `forest-*` 값을 CSS 변수 참조로 변경
- `src/routes.jsx` — draft/test 전용 lazy catalog route
- `src/components/ui/ActionLink.jsx` — 호환 re-export
- `src/components/ui/SectionHeading.jsx` — 호환 re-export
- `src/components/AsyncState.jsx` — 호환 re-export
- `src/hooks/useFocusTrap.js` — 호환 re-export
- `src/pages/user/UserHome.jsx` — 공유 Hero model/renderer 사용
- `src/pages/admin/AdminDashboard.jsx` — 지원 필드만 편집하고 공유 Hero 미리보기 사용
- `src/components/admin/organization/OrganizationDirectoryPreview.jsx` — AccessibleDialog 사용
- `src/components/admin/organization/OrganizationSaveConfirmation.jsx` — AccessibleDialog 사용
- `src/components/admin/organization/OrganizationDirectoryEditor.jsx` — group-editor visual boundary 추가
- `src/components/admin/organization/OrganizationGroupForm.jsx` — FormField/Surface 사용
- `src/components/admin/organization/OrganizationGroupTree.jsx` — semantic tokens/Button/StatusBadge 사용
- `src/components/organization/OrganizationDirectory.jsx` — semantic tokens/action styles 사용
- `src/components/organization/OrganizationMemberList.jsx` — semantic surface/text tokens 사용
- `tests/e2e/public-home.spec.js` — 공유 Hero 계약과 새 snapshot 경로
- `tests/e2e/organization-directory-admin.spec.js` — 공용 dialog/form 회귀 assertions
- `tests/e2e/organization-directory-public.spec.js` — 의미 토큰과 48px 회귀 assertions
- `playwright.config.js` — OS 비종속 snapshot path
- `playwright.organization.config.js` — local-mock Home Banner write integration 포함
- `docs/superpowers/specs/2026-07-22-forest-design-system-foundation-design.md` — 구현 상태 반영

### Delete after all importers move

- `src/components/HomeBannerHero.jsx`
- `src/components/home/PublicHomeHero.jsx`

---

## Preflight

- [ ] **Step 1: Confirm the existing isolated worktree and clean baseline**

Run:

```bash
git status --short
git branch --show-current
git log -3 --oneline
```

Expected: no uncommitted files; branch is `codex/forest-ui-draft-e2e`; the approved design commit `3cba29a` is in history.

- [ ] **Step 2: Run the current focused baselines before changing code**

Run each command separately:

```bash
npm run test:unit:organization
npm run test:e2e:public
npm run test:e2e:organization
npm run lint
npm run build
```

Expected: all commands exit 0. Record exact pass/skip counts; do not reuse counts from an earlier run.

---

### Task 1: Establish the Forest design contract and canonical tokens

**Files:**
- Create: `DESIGN.md`
- Create: `src/design-system/tokens/tokens.css`
- Create: `src/design-system/tests/tokens.test.js`
- Modify: `src/index.css:1-75`
- Modify: `tailwind.config.cjs:6-30`
- Modify: `package.json:6-20`

**Interfaces:**
- Consumes: existing `forest.primary`, `forest.strong`, `forest.surface`, `forest.accent` Tailwind names
- Produces: CSS variables prefixed `--forest-`; Tailwind semantic aliases that reference those variables; `npm run test:unit:design-system`

- [ ] **Step 1: Add the failing token contract test and script**

Create `src/design-system/tests/tokens.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tokenFile = new URL('../tokens/tokens.css', import.meta.url);
const indexFile = new URL('../../index.css', import.meta.url);

const readTokenValue = (css, name) => {
  const match = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return match?.[1]?.trim() ?? null;
};

const hexToRgb = (hex) => {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const relativeLuminance = (hex) => {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (left, right) => {
  const [light, dark] = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};

test('canonical tokens contain the required Forest semantics', async () => {
  const css = await readFile(tokenFile, 'utf8');
  const required = [
    '--forest-color-brand-primary',
    '--forest-color-brand-strong',
    '--forest-color-brand-surface',
    '--forest-color-accent',
    '--forest-color-text-primary',
    '--forest-color-text-muted',
    '--forest-color-text-inverse',
    '--forest-color-surface-page',
    '--forest-color-surface-card',
    '--forest-color-surface-raised',
    '--forest-color-surface-inverse-hover',
    '--forest-color-surface-scrim',
    '--forest-color-border-subtle',
    '--forest-color-border-strong',
    '--forest-color-focus-ring',
    '--forest-color-success-surface',
    '--forest-color-success-border',
    '--forest-color-success-text',
    '--forest-color-warning-surface',
    '--forest-color-warning-border',
    '--forest-color-warning-text',
    '--forest-color-danger-surface',
    '--forest-color-danger-border',
    '--forest-color-danger-text',
    '--forest-color-info-surface',
    '--forest-color-info-border',
    '--forest-color-info-text',
    '--forest-font-body-size',
    '--forest-font-admin-size',
    '--forest-font-label-size',
    '--forest-font-supporting-size',
    '--forest-font-heading-1-size',
    '--forest-font-heading-2-size',
    '--forest-font-heading-3-size',
    '--forest-line-height-body',
    '--forest-line-height-heading',
    '--forest-control-min-height',
    '--forest-icon-control-size',
    '--forest-space-1',
    '--forest-space-2',
    '--forest-space-3',
    '--forest-space-4',
    '--forest-space-6',
    '--forest-space-8',
    '--forest-radius-control',
    '--forest-radius-card',
    '--forest-radius-dialog',
    '--forest-panel-padding',
  ];

  for (const name of required) assert.ok(readTokenValue(css, name), `${name} is missing`);
  assert.equal(readTokenValue(css, '--forest-color-brand-primary'), '#166534');
  assert.equal(readTokenValue(css, '--forest-control-min-height'), '3rem');
  assert.equal(readTokenValue(css, '--forest-icon-control-size'), '3rem');
});

test('index.css imports tokens instead of redefining them', async () => {
  const css = await readFile(indexFile, 'utf8');
  assert.match(css, /^@import "\.\/design-system\/tokens\/tokens\.css";/);
  assert.doesNotMatch(css, /--forest-color-brand-primary\s*:/);
});

test('Tailwind Forest aliases reference CSS variables', async () => {
  const config = (await import('../../../tailwind.config.cjs')).default;
  const forest = config.theme.extend.colors.forest;
  assert.equal(forest.primary, 'var(--forest-color-brand-primary)');
  assert.equal(forest.strong, 'var(--forest-color-brand-strong)');
  assert.equal(forest.surface.card, 'var(--forest-color-surface-card)');
  assert.equal(forest.surface['inverse-hover'], 'var(--forest-color-surface-inverse-hover)');
  assert.equal(forest.surface.scrim, 'var(--forest-color-surface-scrim)');
  assert.equal(forest.focus, 'var(--forest-color-focus-ring)');
  assert.equal(config.theme.extend.minHeight['forest-control'], 'var(--forest-control-min-height)');
  assert.equal(config.theme.extend.minWidth['forest-control'], 'var(--forest-icon-control-size)');
  assert.equal(config.theme.extend.width['forest-icon-control'], 'var(--forest-icon-control-size)');
  assert.equal(config.theme.extend.height['forest-icon-control'], 'var(--forest-icon-control-size)');
  assert.equal(config.theme.extend.borderRadius['forest-card'], 'var(--forest-radius-card)');
  assert.equal(config.theme.extend.spacing['forest-panel'], 'var(--forest-panel-padding)');
});

test('canonical text and surface pairs meet WCAG AA contrast', async () => {
  const css = await readFile(tokenFile, 'utf8');
  const pairs = [
    ['--forest-color-text-primary', '--forest-color-surface-page'],
    ['--forest-color-text-muted', '--forest-color-surface-card'],
    ['--forest-color-text-inverse', '--forest-color-brand-primary'],
    ['--forest-color-success-text', '--forest-color-success-surface'],
    ['--forest-color-warning-text', '--forest-color-warning-surface'],
    ['--forest-color-danger-text', '--forest-color-danger-surface'],
    ['--forest-color-info-text', '--forest-color-info-surface'],
  ];

  for (const [foreground, background] of pairs) {
    const ratio = contrastRatio(readTokenValue(css, foreground), readTokenValue(css, background));
    assert.ok(ratio >= 4.5, `${foreground} on ${background} has contrast ${ratio.toFixed(2)}:1`);
  }
});
```

Add these scripts to `package.json`:

```json
"test:unit:design-system": "node --test src/design-system/tests/*.test.js",
"test:unit": "node --test tests/unit/*.test.js src/design-system/tests/*.test.js",
"test:e2e:public:functional": "playwright test tests/e2e/public-home.spec.js tests/e2e/public-home-states.spec.js --grep-invert 'reviewed responsive baseline'"
```

- [ ] **Step 2: Run the contract test and verify RED**

Run:

```bash
npm run test:unit:design-system
```

Expected: FAIL with `ENOENT` for `src/design-system/tokens/tokens.css`.

- [ ] **Step 3: Create the exact token source**

Create `src/design-system/tokens/tokens.css`:

```css
:root {
  --forest-color-brand-primary: #166534;
  --forest-color-brand-strong: #14532d;
  --forest-color-brand-surface: #f8faf5;
  --forest-color-accent: #b45309;

  --forest-color-text-primary: #1f2937;
  --forest-color-text-muted: #4b5563;
  --forest-color-text-inverse: #ffffff;

  --forest-color-surface-page: #fffdf8;
  --forest-color-surface-card: #ffffff;
  --forest-color-surface-raised: #f8faf5;
  --forest-color-surface-inverse-hover: rgba(255, 255, 255, 0.12);
  --forest-color-surface-scrim: rgba(0, 0, 0, 0.60);
  --forest-color-border-subtle: #dbe5d8;
  --forest-color-border-strong: #6b7f68;
  --forest-color-focus-ring: #14532d;

  --forest-color-success-surface: #f0fdf4;
  --forest-color-success-border: #86efac;
  --forest-color-success-text: #14532d;
  --forest-color-warning-surface: #fffbeb;
  --forest-color-warning-border: #fcd34d;
  --forest-color-warning-text: #92400e;
  --forest-color-danger-surface: #fef2f2;
  --forest-color-danger-border: #fca5a5;
  --forest-color-danger-text: #991b1b;
  --forest-color-info-surface: #eff6ff;
  --forest-color-info-border: #93c5fd;
  --forest-color-info-text: #1e3a8a;

  --forest-font-body-size: 1.125rem;
  --forest-font-admin-size: 1rem;
  --forest-font-label-size: 1rem;
  --forest-font-supporting-size: 1rem;
  --forest-font-heading-1-size: 2.5rem;
  --forest-font-heading-2-size: 2rem;
  --forest-font-heading-3-size: 1.5rem;
  --forest-line-height-body: 1.7;
  --forest-line-height-heading: 1.25;
  --forest-control-min-height: 3rem;
  --forest-icon-control-size: 3rem;
  --forest-focus-width: 4px;

  --forest-space-1: 0.25rem;
  --forest-space-2: 0.5rem;
  --forest-space-3: 0.75rem;
  --forest-space-4: 1rem;
  --forest-space-6: 1.5rem;
  --forest-space-8: 2rem;

  --forest-radius-control: 0.75rem;
  --forest-radius-card: 1rem;
  --forest-radius-dialog: 1rem;
  --forest-panel-padding: 1.5rem;
}
```

- [ ] **Step 4: Create the agent-facing `DESIGN.md`**

Create `DESIGN.md` with this exact content:

```markdown
# Forest Design System

Forest는 전북생명의숲의 공개 홈페이지와 관리자 CMS다. 주 사용층은 50~60대이며, 빠른 인상보다 읽기·조작·예측 가능성을 우선한다.

## Source of truth

- 런타임 값: `src/design-system/tokens/tokens.css`
- 공용 조작 계약: `src/design-system/primitives/`
- 반복 배치: `src/design-system/patterns/`
- Forest 도메인 UI: `src/features/`와 기존 feature components
- 이 문서는 토큰의 의도와 사용 규칙을 설명하며 숫자 값의 두 번째 정본이 아니다.

## Semantic tokens

- 브랜드 행동: `forest-primary`, 강조·역상 표면: `forest-strong`, 제한적 강조: `forest-accent`
- 글자: `forest-text-primary`, `forest-text-muted`, `forest-text-inverse`
- 표면: `forest-surface-page`, `forest-surface-card`, `forest-surface-raised`
- 경계·포커스: `forest-border-subtle`, `forest-border-strong`, `forest-focus`
- 상태: `forest-success-*`, `forest-warning-*`, `forest-danger-*`, `forest-info-*`
- 글자 크기: `text-forest-body`, `text-forest-admin`, `text-forest-label`, `text-forest-supporting`, `text-forest-heading-*`
- 조작·형태: `min-h-forest-control`, `min-w-forest-control`, `h-forest-icon-control`, `w-forest-icon-control`, `rounded-forest-control`, `rounded-forest-card`, `rounded-forest-dialog`, `p-forest-panel`
- 공용 primitive에서는 위 의미 별칭을 사용하고 raw palette·임의 control 높이·임의 radius를 직접 쓰지 않는다.

## Public and admin

- 공개 본문은 18px 이상이고 충분한 설명과 문맥을 제공한다.
- 관리자 입력·레이블·작업 버튼은 16px 이상이며 저장·오류 상태를 명시한다.
- 공개 결과를 편집하는 관리자 미리보기는 실제 공개 렌더러를 사용한다.

## Content tone

- 익숙한 한국어로 짧고 직접적으로 쓰며, 버튼은 실행 결과를 동사로 설명한다.
- 오류는 원인 추측보다 사용자가 다음에 할 수 있는 행동을 안내한다.
- 관리자 용어를 공개 화면에 노출하지 않는다.

## Repository boundary

- 디자인 시스템은 이 Forest 프런트엔드 저장소 안에서 관리하고 지금은 npm 패키지나 별도 저장소로 분리하지 않는다.
- 동일 UI를 쓰는 독립 배포 프런트엔드가 둘 이상이고 primitive API와 릴리스 책임이 안정된 뒤에만 추출을 재검토한다.
- 다른 서비스와는 컴포넌트가 아니라 48px 조작 영역, 읽기 크기, 키보드 접근, 대비, reduced-motion 같은 품질 원칙만 공유한다.

## Visual direction

- 따뜻한 중립 배경, 진한 Forest 녹색, 얇고 분명한 경계를 사용한다.
- 공개 본문은 18px/1.7 이상, 관리자 핵심 정보는 16px 이상이다.
- 버튼·입력·아이콘 버튼은 48px 이상이다.
- 한 화면의 주 행동은 하나이며 위험 행동은 분리한다.
- 자동 슬라이드와 장식적 모션은 사용하지 않는다.
- pill은 필터·상태·짧은 선택지에만 사용한다.

## Accessibility

- 키보드 포커스를 4px로 분명히 표시한다.
- 상태는 텍스트를 항상 포함하고 색만으로 전달하지 않는다.
- 일반 텍스트와 조작 요소는 WCAG AA 대비를 만족해야 한다.
- `prefers-reduced-motion`을 존중한다.
- 관리자 미리보기는 실제 공개 렌더러를 사용한다.

## Do not

- raw palette utility를 새 디자인 시스템 코드에 추가하지 않는다.
- 중요한 정보에 12~14px 글자를 사용하지 않는다.
- 임의 색상, 임의 control 높이, 임의 radius를 primitive prop으로 받지 않는다.
- 다른 브랜드의 로고·전용 색·전용 서체·고유 외형을 복제하지 않는다.
- production build에 디자인 시스템 카탈로그를 포함하지 않는다.
```

- [ ] **Step 5: Make `index.css` consume the token source**

Insert this as the first line of `src/index.css` and remove only the active custom-property `:root` block immediately below the Tailwind directives (the later commented Vite scaffold is outside this task):

```css
@import "./design-system/tokens/tokens.css";
```

Change the base styles to:

```css
body {
  min-width: 320px;
  margin: 0;
  background: var(--forest-color-surface-page);
  color: var(--forest-color-text-primary);
  font-family: Pretendard, "Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: var(--forest-font-body-size);
  line-height: var(--forest-line-height-body);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:focus-visible {
  outline: var(--forest-focus-width) solid var(--forest-color-focus-ring);
  outline-offset: 3px;
}
```

Change `.skip-link` and `.accessible-touch-target` to:

```css
.skip-link {
  background: var(--forest-color-brand-strong);
  color: var(--forest-color-text-inverse);
}

.accessible-touch-target {
  min-width: var(--forest-icon-control-size);
  min-height: var(--forest-control-min-height);
}
```

Keep the existing positioning, padding, Quill, rich-content, and reduced-motion rules unchanged.

- [ ] **Step 6: Point Tailwind aliases at CSS variables**

Replace `theme.extend.colors.forest` with:

```js
forest: {
  primary: 'var(--forest-color-brand-primary)',
  strong: 'var(--forest-color-brand-strong)',
  accent: 'var(--forest-color-accent)',
  text: {
    primary: 'var(--forest-color-text-primary)',
    muted: 'var(--forest-color-text-muted)',
    inverse: 'var(--forest-color-text-inverse)',
  },
  surface: {
    DEFAULT: 'var(--forest-color-brand-surface)',
    page: 'var(--forest-color-surface-page)',
    card: 'var(--forest-color-surface-card)',
    raised: 'var(--forest-color-surface-raised)',
    'inverse-hover': 'var(--forest-color-surface-inverse-hover)',
    scrim: 'var(--forest-color-surface-scrim)',
  },
  border: {
    subtle: 'var(--forest-color-border-subtle)',
    strong: 'var(--forest-color-border-strong)',
  },
  focus: 'var(--forest-color-focus-ring)',
  success: {
    surface: 'var(--forest-color-success-surface)',
    border: 'var(--forest-color-success-border)',
    text: 'var(--forest-color-success-text)',
  },
  warning: {
    surface: 'var(--forest-color-warning-surface)',
    border: 'var(--forest-color-warning-border)',
    text: 'var(--forest-color-warning-text)',
  },
  danger: {
    surface: 'var(--forest-color-danger-surface)',
    border: 'var(--forest-color-danger-border)',
    text: 'var(--forest-color-danger-text)',
  },
  info: {
    surface: 'var(--forest-color-info-surface)',
    border: 'var(--forest-color-info-border)',
    text: 'var(--forest-color-info-text)',
  },
},
```

Also add these token-backed aliases under `theme.extend` so design-system runtime code never duplicates token values:

```js
fontSize: {
  'forest-body': ['var(--forest-font-body-size)', { lineHeight: 'var(--forest-line-height-body)' }],
  'forest-admin': 'var(--forest-font-admin-size)',
  'forest-label': 'var(--forest-font-label-size)',
  'forest-supporting': 'var(--forest-font-supporting-size)',
  'forest-heading-1': ['var(--forest-font-heading-1-size)', { lineHeight: 'var(--forest-line-height-heading)' }],
  'forest-heading-2': ['var(--forest-font-heading-2-size)', { lineHeight: 'var(--forest-line-height-heading)' }],
  'forest-heading-3': ['var(--forest-font-heading-3-size)', { lineHeight: 'var(--forest-line-height-heading)' }],
},
spacing: {
  'forest-1': 'var(--forest-space-1)',
  'forest-2': 'var(--forest-space-2)',
  'forest-3': 'var(--forest-space-3)',
  'forest-4': 'var(--forest-space-4)',
  'forest-6': 'var(--forest-space-6)',
  'forest-8': 'var(--forest-space-8)',
  'forest-panel': 'var(--forest-panel-padding)',
},
minHeight: {
  'forest-control': 'var(--forest-control-min-height)',
},
minWidth: {
  'forest-control': 'var(--forest-icon-control-size)',
},
width: {
  'forest-icon-control': 'var(--forest-icon-control-size)',
},
height: {
  'forest-icon-control': 'var(--forest-icon-control-size)',
},
borderRadius: {
  'forest-control': 'var(--forest-radius-control)',
  'forest-card': 'var(--forest-radius-card)',
  'forest-dialog': 'var(--forest-radius-dialog)',
},
outlineWidth: {
  forest: 'var(--forest-focus-width)',
},
```

Keep the existing raw `green` compatibility scale during the staged migration.

- [ ] **Step 7: Run GREEN and regression checks**

Run:

```bash
npm run test:unit:design-system
npm run lint
npm run build
```

Expected: token tests pass; lint and build exit 0; the canonical primary value remains `#166534` (the browser-level `rgb(22, 101, 52)` regression runs in Task 2's public functional suite).

- [ ] **Step 8: Commit Task 1**

```bash
git add DESIGN.md src/design-system/tokens/tokens.css src/design-system/tests/tokens.test.js src/index.css tailwind.config.cjs package.json package-lock.json
git commit -m "feat: establish Forest design tokens"
```

---

### Task 2: Add action primitives and the draft-only catalog boundary

**Files:**
- Create: `src/design-system/primitives/actionControlStyles.js`
- Create: `src/design-system/primitives/Button.jsx`
- Create: `src/design-system/primitives/ActionLink.jsx`
- Create: `src/design-system/primitives/IconButton.jsx`
- Create: `src/design-system/catalog/DesignSystemCatalog.jsx`
- Create: `tests/e2e/design-system-catalog.spec.js`
- Modify: `src/components/ui/ActionLink.jsx`
- Modify: `src/routes.jsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `getActionControlClassName({ variant, size, className })`; `Button({ variant, size, isPending, pendingLabel })`; `ActionLink({ to, href, variant, size })`; `IconButton({ label })`; `/__design-system` in draft/test only
- Variants: `primary | secondary | quiet | inverseQuiet | danger`; sizes: `md | lg | icon`

- [ ] **Step 1: Write the failing catalog action test**

Create `tests/e2e/design-system-catalog.spec.js`:

```js
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures/publicTest.js';

const ANONYMOUS_403 = /^Failed to load resource: the server responded with a status of 403 \(Forbidden\)$/;
const USERS_API_URL = /\/api\/v1\/users(?:[?#].*)?$/;

const openCatalog = async (page, pageQuality) => {
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  pageQuality.allowConsoleError(ANONYMOUS_403, USERS_API_URL);
  await page.goto('/__design-system');
  await expect(page.getByRole('heading', { level: 1, name: 'Forest 디자인 시스템' })).toBeVisible();
};

test('action primitives expose stable variants, pending state, and 48px targets', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const primary = page.getByRole('button', { name: '주 행동' });
  const pending = page.getByRole('button', { name: '저장 중…' });
  const disabled = page.getByRole('button', { name: '사용 불가' });
  const icon = page.getByRole('button', { name: '항목 닫기' });
  const dangerIcon = page.getByRole('button', { name: '항목 삭제' });
  const link = page.getByRole('link', { name: '프로그램 보기' });

  for (const control of [primary, pending, disabled, icon, dangerIcon, link]) {
    const box = await control.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
  }
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute('aria-busy', 'true');
  await expect(disabled).toBeDisabled();
  await expect(page.getByRole('button', { name: '조용한 행동' })).toBeVisible();
  await expect(page.getByRole('button', { name: '역상 행동' })).toBeVisible();
  await expect(link).toHaveAttribute('href', '/programs/participate');

  await primary.focus();
  const outlineWidth = await primary.evaluate((node) => Number.parseFloat(getComputedStyle(node).outlineWidth));
  expect(outlineWidth).toBeGreaterThanOrEqual(4);
});
```

Add to `package.json`:

```json
"test:e2e:design-system": "playwright test tests/e2e/design-system-catalog.spec.js"
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js --project=desktop
```

Expected: FAIL because `/__design-system` renders the not-found page.

- [ ] **Step 3: Implement the shared action class contract**

Create `src/design-system/primitives/actionControlStyles.js`:

```js
const variants = {
  primary: 'border-2 border-transparent bg-forest-primary text-forest-text-inverse hover:bg-forest-strong',
  secondary: 'border-2 border-forest-primary bg-forest-surface-card text-forest-strong hover:bg-forest-surface',
  quiet: 'border-2 border-transparent text-forest-strong underline decoration-2 underline-offset-4 hover:bg-forest-surface',
  inverseQuiet: 'border-2 border-transparent text-forest-text-inverse underline decoration-2 underline-offset-4 hover:bg-forest-surface-inverse-hover',
  danger: 'border-2 border-forest-danger-border bg-forest-danger-surface text-forest-danger-text hover:border-forest-danger-text',
};

const sizes = {
  md: 'min-h-forest-control min-w-forest-control px-forest-4 py-forest-2 text-forest-label',
  lg: 'min-h-forest-control min-w-forest-control px-forest-6 py-forest-3 text-forest-body',
  icon: 'h-forest-icon-control w-forest-icon-control p-0 text-forest-body',
};

export const getActionControlClassName = ({
  variant = 'primary',
  size = 'md',
  className = '',
} = {}) => [
  'inline-flex items-center justify-center rounded-forest-control font-bold',
  'focus-visible:outline focus-visible:outline-forest focus-visible:outline-offset-2 focus-visible:outline-forest-focus',
  'disabled:cursor-not-allowed disabled:opacity-60',
  variants[variant] ?? variants.primary,
  sizes[size] ?? sizes.md,
  className,
].filter(Boolean).join(' ');
```

- [ ] **Step 4: Implement Button, ActionLink, and IconButton**

Create `src/design-system/primitives/Button.jsx`:

```jsx
import { getActionControlClassName } from './actionControlStyles';

export default function Button({
  variant = 'primary',
  size = 'md',
  isPending = false,
  pendingLabel = '처리 중…',
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      className={getActionControlClassName({ variant, size, className })}
    >
      {isPending ? pendingLabel : children}
    </button>
  );
}
```

Create `src/design-system/primitives/ActionLink.jsx`:

```jsx
import { Link } from 'react-router-dom';
import { getActionControlClassName } from './actionControlStyles';

export default function ActionLink({
  to,
  href,
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
  ...props
}) {
  const classes = getActionControlClassName({ variant, size, className });
  if (href) return <a href={href} className={classes} {...props}>{children}</a>;
  return <Link to={to} className={classes} {...props}>{children}</Link>;
}
```

Create `src/design-system/primitives/IconButton.jsx`:

```jsx
import Button from './Button';

export default function IconButton({ label, children, ...props }) {
  if (!label) throw new Error('IconButton requires an accessible label');
  return (
    <Button {...props} size="icon" aria-label={label}>
      <span aria-hidden="true">{children}</span>
    </Button>
  );
}
```

Replace `src/components/ui/ActionLink.jsx` with:

```js
export { default } from '../../design-system/primitives/ActionLink';
```

- [ ] **Step 5: Add the initial catalog**

Create `src/design-system/catalog/DesignSystemCatalog.jsx`:

```jsx
import ActionLink from '../primitives/ActionLink';
import Button from '../primitives/Button';
import IconButton from '../primitives/IconButton';

export default function DesignSystemCatalog() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6" data-design-system-catalog="forest-v1">
      <header>
        <p className="text-forest-body font-bold text-forest-strong">개발·테스트 전용</p>
        <h1 className="mt-2 text-forest-heading-1 font-bold text-forest-text-primary">Forest 디자인 시스템</h1>
        <p className="mt-3 max-w-3xl text-forest-body text-forest-text-muted">
          공개 화면과 관리자 화면에서 함께 사용하는 상태와 조작을 검증합니다.
        </p>
      </header>

      <section aria-labelledby="catalog-actions" className="rounded-forest-card border border-forest-border-subtle bg-forest-surface-card p-forest-panel">
        <h2 id="catalog-actions" className="text-forest-heading-3 font-bold text-forest-text-primary">행동</h2>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button>주 행동</Button>
          <Button variant="secondary">보조 행동</Button>
          <Button variant="quiet">조용한 행동</Button>
          <Button variant="danger">위험 행동</Button>
          <Button isPending pendingLabel="저장 중…">저장</Button>
          <Button disabled>사용 불가</Button>
          <span className="rounded-forest-control bg-forest-strong p-forest-1">
            <Button variant="inverseQuiet">역상 행동</Button>
          </span>
          <IconButton label="항목 닫기">×</IconButton>
          <IconButton label="항목 삭제" variant="danger">×</IconButton>
          <ActionLink to="/programs/participate">프로그램 보기</ActionLink>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Register a conditional lazy route**

At the top of `src/routes.jsx` add:

```jsx
import { lazy, Suspense } from 'react';

const DesignSystemCatalog = import.meta.env.DEV && import.meta.env.VITE_DRAFT_MODE === 'true'
  ? lazy(() => import('./design-system/catalog/DesignSystemCatalog'))
  : null;

const designSystemRoutes = DesignSystemCatalog ? [{
  path: '__design-system',
  element: (
    <Suspense fallback={<p role="status">디자인 시스템을 불러오고 있습니다.</p>}>
      <DesignSystemCatalog />
    </Suspense>
  ),
}] : [];
```

Insert `...designSystemRoutes` as the first item in the root `children` array. Do not statically import the catalog anywhere else.

- [ ] **Step 7: Run GREEN and public regression**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js --project=desktop
npm run test:e2e:public:functional
npm run lint
npm run build
```

Expected: catalog test and public functional tests pass; production build exits 0. The existing visual baseline is intentionally deferred to Task 8 because the action styles changed.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/design-system/primitives src/design-system/catalog src/components/ui/ActionLink.jsx src/routes.jsx tests/e2e/design-system-catalog.spec.js package.json package-lock.json
git commit -m "feat: add Forest action primitives"
```

---

### Task 3: Add FormField, StatusBadge, Surface, and compatibility exports

**Files:**
- Create: `src/design-system/primitives/FormField.jsx`
- Create: `src/design-system/primitives/StatusBadge.jsx`
- Create: `src/design-system/primitives/AsyncState.jsx`
- Create: `src/design-system/patterns/Surface.jsx`
- Create: `src/design-system/patterns/SectionHeading.jsx`
- Modify: `src/design-system/catalog/DesignSystemCatalog.jsx`
- Modify: `src/components/AsyncState.jsx`
- Modify: `src/components/ui/SectionHeading.jsx`
- Modify: `tests/e2e/design-system-catalog.spec.js`

**Interfaces:**
- Produces: `FormField({ id, label, hint, error, required, children })` render prop; `StatusBadge({ tone, size, icon, children })`; `Surface({ as, children })`
- Keeps: existing AsyncState and SectionHeading public props unchanged through re-export; extends `AsyncState.status` with backward-compatible `forbidden`

- [ ] **Step 1: Append the failing form/status test**

Append to `tests/e2e/design-system-catalog.spec.js`:

```js
test('form and status primitives connect labels, errors, and non-color text', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const input = page.getByRole('textbox', { name: '그룹 이름' });
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAttribute('aria-describedby', /catalog-group-name-error/);
  await expect(page.locator('#catalog-group-name-error')).toHaveText('그룹 이름을 입력해 주세요.');
  expect((await input.boundingBox()).height).toBeGreaterThanOrEqual(48);
  for (const status of ['확인 전', '접수 중', '저장하지 않은 변경', '확인 필요', '안내']) {
    await expect(page.getByText(status, { exact: true })).toBeVisible();
  }
  for (const stateTitle of ['내용을 불러오고 있습니다', '등록된 내용이 없습니다', '내용을 불러오지 못했습니다', '접근 권한이 없습니다']) {
    await expect(page.getByRole('heading', { name: stateTitle })).toBeVisible();
  }
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js --project=desktop --grep "form and status"
```

Expected: FAIL because the catalog has no “그룹 이름” field.

- [ ] **Step 3: Implement FormField**

Create `src/design-system/primitives/FormField.jsx`:

```jsx
export default function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  className = '',
  children,
}) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const controlClassName = [
    'min-h-forest-control w-full rounded-forest-control border bg-forest-surface-card px-forest-4 py-forest-2 text-forest-label text-forest-text-primary',
    'focus:border-forest-primary focus:outline focus:outline-forest focus:outline-offset-2 focus:outline-forest-focus',
    error ? 'border-forest-danger-text' : 'border-forest-border-strong',
  ].join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-forest-label font-bold text-forest-text-primary">
        {label}{required && <span className="ml-1 text-forest-danger-text" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={hintId} className="mt-forest-1 text-forest-supporting text-forest-text-muted">{hint}</p>}
      <div className="mt-forest-2">
        {children({
          id,
          required,
          'aria-invalid': error ? 'true' : undefined,
          'aria-describedby': describedBy,
          className: controlClassName,
        })}
      </div>
      {error && <p id={errorId} className="mt-forest-2 text-forest-supporting font-semibold text-forest-danger-text">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Implement StatusBadge and Surface**

Create `src/design-system/primitives/StatusBadge.jsx`:

```jsx
const tones = {
  neutral: 'border-forest-border-subtle bg-forest-surface-raised text-forest-text-primary',
  success: 'border-forest-success-border bg-forest-success-surface text-forest-success-text',
  warning: 'border-forest-warning-border bg-forest-warning-surface text-forest-warning-text',
  danger: 'border-forest-danger-border bg-forest-danger-surface text-forest-danger-text',
  info: 'border-forest-info-border bg-forest-info-surface text-forest-info-text',
};

export default function StatusBadge({ tone = 'neutral', size = 'md', icon, children, className = '', ...props }) {
  const sizeClassName = size === 'sm'
    ? 'px-forest-3 py-forest-1 text-forest-label'
    : 'min-h-forest-control px-forest-4 py-forest-2 text-forest-label';
  return (
    <span className={`inline-flex items-center gap-forest-2 rounded-full border font-bold ${tones[tone] ?? tones.neutral} ${sizeClassName} ${className}`.trim()} {...props}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
```

Create `src/design-system/patterns/Surface.jsx`:

```jsx
export default function Surface({ as: Component = 'section', className = '', children, ...props }) {
  return (
    <Component className={`rounded-forest-card border border-forest-border-subtle bg-forest-surface-card p-forest-panel shadow-sm ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
```

- [ ] **Step 5: Move AsyncState and SectionHeading behind compatibility exports**

Create `src/design-system/primitives/AsyncState.jsx` with the existing public contract and semantic styles:

```jsx
import Button from './Button';
import Surface from '../patterns/Surface';

const STATE_DEFAULTS = {
  loading: {
    title: '내용을 불러오고 있습니다',
    description: '잠시만 기다려 주세요.',
  },
  error: {
    title: '내용을 불러오지 못했습니다',
    description: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  },
  forbidden: {
    title: '접근 권한이 없습니다',
    description: '이 내용을 볼 수 있는 계정인지 확인해 주세요.',
  },
  empty: {
    title: '등록된 내용이 없습니다',
    description: '새로운 내용이 등록되면 이곳에서 확인하실 수 있습니다.',
  },
};

export default function AsyncState({
  status = 'empty',
  title,
  description,
  onRetry,
  retryLabel = '다시 시도',
  isRetrying = false,
  className = '',
}) {
  const defaults = STATE_DEFAULTS[status] || STATE_DEFAULTS.empty;
  const isError = status === 'error';
  const isForbidden = status === 'forbidden';
  const isAlert = isError || isForbidden;
  const isLoading = status === 'loading';
  const stateTextClassName = isError
    ? 'text-forest-danger-text'
    : isForbidden
      ? 'text-forest-warning-text'
      : 'text-forest-text-muted';

  return (
    <Surface
      as="div"
      className={`px-forest-6 py-forest-8 text-center ${className}`.trim()}
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      aria-busy={isLoading || isRetrying}
    >
      <div className="mb-forest-4 flex justify-center" aria-hidden="true">
        {isLoading ? (
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-forest-border-subtle border-t-forest-primary" />
        ) : (
          <span className={`text-forest-heading-1 ${stateTextClassName}`}>
            {isAlert ? '!' : '—'}
          </span>
        )}
      </div>
      <h3 className={`text-forest-heading-3 font-bold ${isAlert ? stateTextClassName : 'text-forest-text-primary'}`}>
        {title || defaults.title}
      </h3>
      <p className="mx-auto mt-forest-2 max-w-2xl text-forest-body text-forest-text-muted">
        {description || defaults.description}
      </p>
      {isError && onRetry && (
        <Button
          className="mt-forest-6"
          onClick={() => onRetry()}
          isPending={isRetrying}
          pendingLabel="다시 불러오는 중…"
        >
          {retryLabel}
        </Button>
      )}
    </Surface>
  );
}
```

Create `src/design-system/patterns/SectionHeading.jsx`:

```jsx
import ActionLink from '../primitives/ActionLink';

export default function SectionHeading({ id, title, description, actionLabel, actionTo }) {
  return (
    <div className="mb-forest-6 flex flex-col gap-forest-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="text-forest-heading-2 font-bold text-forest-text-primary">{title}</h2>
        {description && (
          <p className="mt-forest-2 max-w-3xl text-forest-body text-forest-text-muted">{description}</p>
        )}
      </div>
      {actionLabel && <ActionLink to={actionTo} variant="quiet">{actionLabel}</ActionLink>}
    </div>
  );
}
```

Replace `src/components/AsyncState.jsx` with:

```js
export { default } from '../design-system/primitives/AsyncState';
```

Replace `src/components/ui/SectionHeading.jsx` with:

```js
export { default } from '../../design-system/patterns/SectionHeading';
```

- [ ] **Step 6: Add exact catalog examples**

In `DesignSystemCatalog.jsx`, import `useState`, `AsyncState`, `FormField`, `StatusBadge`, and `Surface`. Add:

```jsx
const [groupName, setGroupName] = useState('');
```

Then insert this section after the action section:

```jsx
<Surface aria-labelledby="catalog-forms">
  <h2 id="catalog-forms" className="text-forest-heading-3 font-bold text-forest-text-primary">폼과 상태</h2>
  <div className="mt-5 grid gap-6 md:grid-cols-2">
    <FormField id="catalog-group-name" label="그룹 이름" error="그룹 이름을 입력해 주세요." required>
      {(controlProps) => (
        <input {...controlProps} value={groupName} onChange={(event) => setGroupName(event.target.value)} />
      )}
    </FormField>
    <div className="flex flex-wrap items-start gap-3">
      <StatusBadge>확인 전</StatusBadge>
      <StatusBadge tone="success">접수 중</StatusBadge>
      <StatusBadge tone="warning">저장하지 않은 변경</StatusBadge>
      <StatusBadge tone="danger">확인 필요</StatusBadge>
      <StatusBadge tone="info">안내</StatusBadge>
    </div>
  </div>
</Surface>

<section aria-labelledby="catalog-async-states">
  <h2 id="catalog-async-states" className="text-forest-heading-3 font-bold text-forest-text-primary">비동기 상태</h2>
  <div className="mt-forest-4 grid gap-forest-4 lg:grid-cols-2">
    <AsyncState status="loading" />
    <AsyncState status="empty" />
    <AsyncState status="error" onRetry={() => {}} />
    <AsyncState status="forbidden" />
  </div>
</section>
```

- [ ] **Step 7: Run GREEN and dependent regressions**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js --project=desktop
npm run test:e2e:public:functional
npm run lint
```

Expected: catalog and public tests pass; existing AsyncState/SectionHeading importers require no changes.

- [ ] **Step 8: Commit Task 3**

```bash
git add src/design-system src/components/AsyncState.jsx src/components/ui/SectionHeading.jsx tests/e2e/design-system-catalog.spec.js
git commit -m "feat: add Forest form and status primitives"
```

---

### Task 4: Centralize dialog behavior and migrate organization dialogs

**Files:**
- Create: `src/design-system/primitives/useFocusTrap.js`
- Create: `src/design-system/primitives/AccessibleDialog.jsx`
- Modify: `src/hooks/useFocusTrap.js`
- Modify: `src/design-system/catalog/DesignSystemCatalog.jsx`
- Modify: `src/components/admin/organization/OrganizationDirectoryPreview.jsx`
- Modify: `src/components/admin/organization/OrganizationSaveConfirmation.jsx`
- Modify: `tests/e2e/design-system-catalog.spec.js`
- Modify: `tests/e2e/organization-directory-admin.spec.js`

**Interfaces:**
- Produces: `AccessibleDialog({ isOpen, title, description, onClose, initialFocusRef, focusVersion, closeOnBackdrop=false, size='lg', footer, closeLabel })`
- Preserves: `useFocusTrap({ containerRef, initialFocusRef, isActive, onEscape, version })`
- Excludes: portals, MobileNav, ImageModal, ApplyProgramModal, ProgramFormBuilder

- [ ] **Step 1: Write the failing dialog interaction test**

Append to `tests/e2e/design-system-catalog.spec.js`:

```js
test('AccessibleDialog traps focus, closes with Escape, restores focus, and locks scrolling', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const trigger = page.getByRole('button', { name: '대화상자 열기' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '변경사항 확인' });
  const close = dialog.getByRole('button', { name: '대화상자 닫기' });
  await expect(close).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});
```

Also add `legacyPeopleHtml` to the existing organization fixture import and append this migration-specific test to `organization-directory-admin.spec.js`:

```js
test('save confirmation resists backdrop dismissal and preserves the explicit save path', async ({
  page,
  organizationApi,
}, testInfo) => {
  test.skip(testInfo.config.metadata.organizationPreviewMode, 'normal write-enabled regression only');
  organizationApi.setOrganization(copyOrganization({ configured: false }));
  organizationApi.setLegacyHtml(legacyPeopleHtml);
  await openOrganizationEditor(page, organizationApi);

  await page.getByLabel('그룹 이름').fill('저장 확인용 이름');
  const saveTrigger = page.getByRole('button', { name: '변경사항 저장' });
  await expect(saveTrigger).toBeEnabled();
  await saveTrigger.click();

  let dialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await dialog.locator('xpath=..').click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(saveTrigger).toBeFocused();

  await saveTrigger.click();
  dialog = page.getByRole('dialog', { name: '기존 함께하는이들 내용 전환 확인' });
  organizationApi.expectPutCount(1);
  await dialog.getByRole('button', { name: '확인하고 저장' }).click();
  await expect(page.locator('[data-save-feedback]')).toContainText('조직도를 저장했습니다');
  expect(organizationApi.getPutRequests()).toHaveLength(1);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js --project=desktop --grep "AccessibleDialog"
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-admin.spec.js --project=desktop --grep "save confirmation resists backdrop"
```

Expected: catalog FAILS because there is no “대화상자 열기” button; the organization regression FAILS because the old save-confirmation backdrop dismisses the dialog.

- [ ] **Step 3: Move the focus hook implementation to the design system**

Move the exact current implementation without editing it, preserving its public signature and keyboard behavior:

```bash
git mv src/hooks/useFocusTrap.js src/design-system/primitives/useFocusTrap.js
```

Replace `src/hooks/useFocusTrap.js` with:

```js
export { default } from '../design-system/primitives/useFocusTrap';
```

- [ ] **Step 4: Implement AccessibleDialog without a portal**

Create `src/design-system/primitives/AccessibleDialog.jsx`:

```jsx
import { useEffect, useId, useRef } from 'react';
import Button from './Button';
import useFocusTrap from './useFocusTrap';

const sizeClasses = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export default function AccessibleDialog({
  isOpen,
  title,
  description,
  onClose,
  initialFocusRef,
  focusVersion,
  closeOnBackdrop = false,
  size = 'lg',
  footer,
  closeLabel = '닫기',
  className = '',
  children,
}) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description ? `${generatedId}-description` : undefined;
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap({
    containerRef: dialogRef,
    initialFocusRef: initialFocusRef ?? closeButtonRef,
    isActive: isOpen,
    onEscape: onClose,
    version: focusVersion,
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-surface-scrim p-forest-3 sm:p-forest-6"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`max-h-full w-full overflow-y-auto rounded-forest-dialog border border-forest-border-subtle bg-forest-surface-card p-forest-panel shadow-2xl ${sizeClasses[size] ?? sizeClasses.lg} ${className}`.trim()}
      >
        <header className="flex flex-col items-stretch justify-between gap-forest-4 sm:flex-row sm:items-start">
          <div>
            <h2 id={titleId} className="text-forest-heading-2 font-bold text-forest-text-primary">{title}</h2>
            {description && <p id={descriptionId} className="mt-forest-2 text-forest-supporting text-forest-text-muted">{description}</p>}
          </div>
          <Button ref={closeButtonRef} variant="secondary" onClick={onClose}>{closeLabel}</Button>
        </header>
        <div className="mt-forest-4">{children}</div>
        {footer && <footer className="mt-forest-6">{footer}</footer>}
      </div>
    </div>
  );
}
```

Because `Button` receives refs here, update `Button.jsx` to use `forwardRef`:

```jsx
import { forwardRef } from 'react';
import { getActionControlClassName } from './actionControlStyles';

const Button = forwardRef(function Button({
  variant = 'primary', size = 'md', isPending = false, pendingLabel = '처리 중…',
  disabled = false, type = 'button', className = '', children, ...props
}, ref) {
  return (
    <button {...props} ref={ref} type={type} disabled={disabled || isPending} aria-busy={isPending || undefined}
      className={getActionControlClassName({ variant, size, className })}>
      {isPending ? pendingLabel : children}
    </button>
  );
});

export default Button;
```

- [ ] **Step 5: Add the catalog dialog example**

Add this import alongside the catalog's existing primitive imports:

```js
import AccessibleDialog from '../primitives/AccessibleDialog';
```

Then add state and this button/dialog to `DesignSystemCatalog.jsx`:

```jsx
const [dialogOpen, setDialogOpen] = useState(false);

<Button variant="secondary" onClick={() => setDialogOpen(true)}>대화상자 열기</Button>
<AccessibleDialog
  isOpen={dialogOpen}
  title="변경사항 확인"
  description="저장하기 전에 내용을 확인해 주세요."
  onClose={() => setDialogOpen(false)}
  closeLabel="대화상자 닫기"
>
  <p className="text-forest-body text-forest-text-primary">대화상자 본문입니다.</p>
</AccessibleDialog>
```

- [ ] **Step 6: Migrate both organization dialogs**

In `OrganizationDirectoryPreview.jsx`, replace `import { useRef, useState } from 'react'` with `import { useState } from 'react'`, remove the `useFocusTrap` import, and add:

```js
import AccessibleDialog from '../../../design-system/primitives/AccessibleDialog';
```

In `OrganizationSaveConfirmation.jsx`, remove both the React `useRef` and `useFocusTrap` imports, then add:

```js
import AccessibleDialog from '../../../design-system/primitives/AccessibleDialog';
import Button from '../../../design-system/primitives/Button';
```

`OrganizationDirectoryPreview.jsx` must keep its draft projection and selected-group state, but replace its overlay/focus markup with:

```jsx
<AccessibleDialog
  isOpen
  title="저장 전 조직도 미리보기"
  description="공개 화면과 같은 구성으로 표시하며 서버에는 반영하지 않습니다."
  onClose={onClose}
  closeOnBackdrop
  closeLabel="미리보기 닫기"
  size="xl"
>
  {!ORGANIZATION_WRITES_ENABLED && (
    <p role="status" className="mb-5 rounded-xl border border-forest-info-border bg-forest-info-surface p-4 font-semibold text-forest-info-text">
      미리보기 환경은 읽기 전용이며 이 화면의 변경사항을 서버에 저장하지 않습니다.
    </p>
  )}
  <div className="[&_nav]:!grid-cols-1">
    <OrganizationDirectory snapshot={snapshot} selectedGroupId={selectedGroupId}
      onSelectGroup={setSelectedGroupId} ariaLabel="저장 전 미리보기 그룹" />
  </div>
</AccessibleDialog>
```

`OrganizationSaveConfirmation.jsx` must remove its own focus refs and overlay and render:

```jsx
<AccessibleDialog
  isOpen
  title="기존 함께하는이들 내용 전환 확인"
  description={mode === 'drift'
    ? '기존 내용 변경을 확인했습니다. 현재 편집 중인 조직도를 새 기준으로 저장합니다.'
    : '저장하면 조직도가 공개 화면의 기존 내용을 대체합니다. 기존 정적 콘텐츠는 삭제하지 않습니다.'}
  onClose={onCancel}
  closeLabel="취소"
  size="md"
  footer={<Button className="w-full" onClick={onConfirm}>확인하고 저장</Button>}
>
  {legacyHtml && (
    <div className="rounded-xl border border-forest-warning-border bg-forest-warning-surface p-4">
      <p className="mb-2 font-bold text-forest-warning-text">현재 확인한 기존 내용</p>
      <div className="prose max-w-none break-words text-forest-text-primary" dangerouslySetInnerHTML={{ __html: legacyHtml }} />
    </div>
  )}
</AccessibleDialog>
```

The preview keeps backdrop dismissal with `closeOnBackdrop`; the save confirmation intentionally does not, preventing an accidental pointer click outside the destructive confirmation from dismissing it. Escape and the explicit 취소 button still close it and restore focus.

- [ ] **Step 7: Run GREEN and organization preview regressions**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js --project=desktop --grep "AccessibleDialog"
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-admin.spec.js --project=desktop --grep "save confirmation resists backdrop"
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-admin.spec.js --project=desktop --grep "group edits stay in an unsaved preview|tri-state affiliation and disabled people use the shared unsaved public preview"
npm run lint
```

Expected: catalog dialog test passes; two targeted organization preview tests pass with focus restoration and Escape behavior unchanged.

- [ ] **Step 8: Commit Task 4**

```bash
git add src/design-system/primitives src/design-system/catalog src/hooks/useFocusTrap.js src/components/admin/organization/OrganizationDirectoryPreview.jsx src/components/admin/organization/OrganizationSaveConfirmation.jsx tests/e2e/design-system-catalog.spec.js tests/e2e/organization-directory-admin.spec.js
git commit -m "feat: centralize accessible dialog behavior"
```

---

### Task 5: Define the Home Hero model and preserve the backend contract

**Files:**
- Create: `src/features/home/homeHeroModel.js`
- Create: `tests/unit/homeHeroModel.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `HOME_HERO_DEFAULT`; `HOME_HERO_IMAGE_FALLBACK`; `HOME_HERO_VISIBLE_FIELDS`; `createHeroImageCandidates(value, origins)`; `normalizeHomeBanners(value)`; `selectHomeHeroActions(banner)`; `validateHomeHeroBanners(banners)`; `resetHomeHeroVisibleFields(banner)`; `createHomeBannerUpdatePayload(banners)`
- Guarantees: public participation CTA priority; full non-null backend banner fields; input strings are trimmed; blank visible fields are rejected before the backend can substitute its own defaults; no `autoSlideSeconds` in update payload

- [ ] **Step 1: Write the failing pure model tests**

Create `tests/unit/homeHeroModel.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_HERO_DEFAULT,
  HOME_HERO_IMAGE_FALLBACK,
  createHeroImageCandidates,
  createHomeBannerUpdatePayload,
  normalizeHomeBanners,
  resetHomeHeroVisibleFields,
  selectHomeHeroActions,
  validateHomeHeroBanners,
} from '../../src/features/home/homeHeroModel.js';

test('program participation is the primary public action', () => {
  const banner = {
    ...HOME_HERO_DEFAULT,
    primaryButtonText: '단체 소개',
    primaryButtonLink: '/intro',
    secondaryButtonText: '프로그램 참여',
    secondaryButtonLink: '/programs/participate',
  };
  const actions = selectHomeHeroActions(banner);
  assert.equal(actions.primary.link, '/programs/participate');
  assert.equal(actions.secondary.link, '/intro');
});

test('empty API values normalize to one complete banner', () => {
  const [banner] = normalizeHomeBanners({ banners: [] });
  assert.equal(banner.title, HOME_HERO_DEFAULT.title);
  assert.equal(typeof banner.sideImageUrl, 'string');
  assert.equal(typeof banner.titleColor, 'string');
});

test('nullable legacy API values normalize to non-null strings', () => {
  const [banner] = normalizeHomeBanners([{ title: '새 제목', sideImageUrl: null, titleColor: null }]);
  assert.equal(banner.title, '새 제목');
  assert.equal(banner.sideImageUrl, HOME_HERO_DEFAULT.sideImageUrl);
  assert.equal(banner.titleColor, HOME_HERO_DEFAULT.titleColor);
});

test('API whitespace is trimmed and blank strings use the explicit public fallback', () => {
  const [banner] = normalizeHomeBanners([{
    title: '  공백을 정리한 제목  ',
    description: '   ',
    primaryButtonLink: '',
  }]);
  assert.equal(banner.title, '공백을 정리한 제목');
  assert.equal(banner.description, HOME_HERO_DEFAULT.description);
  assert.equal(banner.primaryButtonLink, HOME_HERO_DEFAULT.primaryButtonLink);
});

test('blank editor fields are reported before the backend can replace them with defaults', () => {
  const errors = validateHomeHeroBanners([{
    ...HOME_HERO_DEFAULT,
    title: '   ',
    primaryButtonLink: '',
  }]);
  assert.deepEqual(errors, [{
    title: '제목을 입력해 주세요.',
    primaryButtonLink: '버튼 A 링크를 입력해 주세요.',
  }]);
});

test('root-relative Hero images try the page origin, API origin, then the local fallback', () => {
  assert.deepEqual(createHeroImageCandidates('/uploads/hero.png', {
    pageOrigin: 'https://www.forest.example',
    apiOrigin: 'https://api.forest.example',
  }), [
    'https://www.forest.example/uploads/hero.png',
    'https://api.forest.example/uploads/hero.png',
    HOME_HERO_IMAGE_FALLBACK,
  ]);
});

test('save payload preserves legacy non-null fields and omits auto-slide settings', () => {
  const legacyValues = {
    sideImageUrl: '/legacy/custom-side.png',
    titleColor: '#123456',
    descriptionColor: '#234567',
    badgeTextColor: '#345678',
    sideTitle: '기존 우측 제목',
    sideDescription: '기존 우측 설명',
  };
  const payload = createHomeBannerUpdatePayload([{ title: '새 제목', ...legacyValues }]);
  assert.equal(payload.banners[0].title, '새 제목');
  for (const [field, value] of Object.entries(legacyValues)) {
    assert.equal(payload.banners[0][field], value);
  }
  assert.equal(Object.hasOwn(payload, 'autoSlideSeconds'), false);
});

test('visible-field reset preserves hidden legacy customization', () => {
  const legacyValues = {
    sideImageUrl: '/legacy/reset-side.png',
    titleColor: '#456789',
    descriptionColor: '#56789A',
    badgeTextColor: '#6789AB',
    sideTitle: '초기화 전 기존 제목',
    sideDescription: '초기화 전 기존 설명',
  };
  const reset = resetHomeHeroVisibleFields({
    ...HOME_HERO_DEFAULT,
    ...legacyValues,
    title: '배너 구분용 제목',
    description: '초기화할 공개 설명',
  });
  assert.equal(reset.title, '배너 구분용 제목');
  assert.equal(reset.description, HOME_HERO_DEFAULT.description);
  for (const [field, value] of Object.entries(legacyValues)) assert.equal(reset[field], value);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
node --test tests/unit/homeHeroModel.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/features/home/homeHeroModel.js`.

- [ ] **Step 3: Implement the model exactly**

Create `src/features/home/homeHeroModel.js`:

```js
export const HOME_HERO_DEFAULT = Object.freeze({
  badgeText: '전북의 숲, 시민과 함께',
  title: '숲을 지키는 가장 가까운 방법',
  description: '전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.',
  backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
  primaryButtonText: '단체 소개',
  primaryButtonLink: '/intro',
  secondaryButtonText: '프로그램 참여',
  secondaryButtonLink: '/programs/participate',

  // Backend HomeBannerContent compatibility fields. The public renderer ignores them.
  sideImageUrl: '/draft/forest-hero-placeholder.svg',
  titleColor: '#FFFFFF',
  descriptionColor: '#ECFDF5',
  badgeTextColor: '#ECFDF5',
  sideTitle: '',
  sideDescription: '',
});

export const HOME_HERO_IMAGE_FALLBACK = '/draft/forest-hero-placeholder.svg';

export const HOME_HERO_VISIBLE_FIELDS = Object.freeze({
  badgeText: '배지 문구를 입력해 주세요.',
  title: '제목을 입력해 주세요.',
  description: '설명 문구를 입력해 주세요.',
  backgroundImageUrl: '배경 이미지 주소를 입력하거나 이미지를 업로드해 주세요.',
  primaryButtonText: '버튼 A 문구를 입력해 주세요.',
  primaryButtonLink: '버튼 A 링크를 입력해 주세요.',
  secondaryButtonText: '버튼 B 문구를 입력해 주세요.',
  secondaryButtonLink: '버튼 B 링크를 입력해 주세요.',
});

export const createHeroImageCandidates = (rawValue, { pageOrigin, apiOrigin }) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  const candidates = [];
  if (/^(https?:\/\/|data:|blob:)/i.test(value)) candidates.push(value);
  else if (/^\/\//.test(value)) candidates.push(`https:${value}`);
  else if (value.startsWith('/')) {
    candidates.push(`${pageOrigin.replace(/\/$/, '')}${value}`);
    candidates.push(`${apiOrigin.replace(/\/$/, '')}${value}`);
  } else if (value) candidates.push(value);
  candidates.push(HOME_HERO_IMAGE_FALLBACK);
  return [...new Set(candidates.filter(Boolean))];
};

const configuredActions = (banner) => [
  { text: banner.primaryButtonText, link: banner.primaryButtonLink },
  { text: banner.secondaryButtonText, link: banner.secondaryButtonLink },
].filter(({ text, link }) => typeof text === 'string' && text.trim() && typeof link === 'string' && link.trim());

export const selectHomeHeroActions = (banner) => {
  const actions = configuredActions(banner);
  const primary = actions.find(({ link }) => link.startsWith('/programs'))
    ?? { text: '프로그램 참여', link: '/programs/participate' };
  return { primary, secondary: actions.find(({ link }) => link !== primary.link) };
};

const normalizeBanner = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.entries(HOME_HERO_DEFAULT).map(([field, fallback]) => [
    field,
    typeof source[field] === 'string' && source[field].trim()
      ? source[field].trim()
      : fallback,
  ]));
};

export const normalizeHomeBanners = (value) => {
  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(value?.banners) && value.banners.length > 0
      ? value.banners
      : value?.content
        ? [value.content]
        : [];
  const source = candidates.length > 0 ? candidates : [HOME_HERO_DEFAULT];
  return source.map(normalizeBanner);
};

export const validateHomeHeroBanners = (banners) => {
  const source = Array.isArray(banners) && banners.length > 0 ? banners : [{}];
  return source.map((banner) => Object.fromEntries(
    Object.entries(HOME_HERO_VISIBLE_FIELDS).filter(([field]) => (
      typeof banner?.[field] !== 'string' || !banner[field].trim()
    )),
  ));
};

export const resetHomeHeroVisibleFields = (banner) => {
  const current = normalizeBanner(banner);
  return {
    ...current,
    badgeText: HOME_HERO_DEFAULT.badgeText,
    title: current.title || HOME_HERO_DEFAULT.title,
    description: HOME_HERO_DEFAULT.description,
    backgroundImageUrl: HOME_HERO_DEFAULT.backgroundImageUrl,
    primaryButtonText: HOME_HERO_DEFAULT.primaryButtonText,
    primaryButtonLink: HOME_HERO_DEFAULT.primaryButtonLink,
    secondaryButtonText: HOME_HERO_DEFAULT.secondaryButtonText,
    secondaryButtonLink: HOME_HERO_DEFAULT.secondaryButtonLink,
  };
};

export const createHomeBannerUpdatePayload = (banners) => ({
  banners: normalizeHomeBanners(banners),
});
```

- [ ] **Step 4: Add the model test to the full unit command**

The Task 1 `test:unit` glob already includes `tests/unit/*.test.js`; no new dependency is needed. Keep `test:unit:design-system` limited to `src/design-system/tests`.

- [ ] **Step 5: Run GREEN**

Run:

```bash
node --test tests/unit/homeHeroModel.test.js
npm run test:unit
```

Expected: all model, organization, and design-system unit tests pass.

- [ ] **Step 6: Commit Task 5**

```bash
git add src/features/home/homeHeroModel.js tests/unit/homeHeroModel.test.js
git commit -m "feat: define the shared home hero contract"
```

---

### Task 6: Unify public Hero and admin preview with one renderer

**Files:**
- Create: `src/features/home/HomeHero.jsx`
- Create: `tests/e2e/home-hero-parity.spec.js`
- Create: `tests/e2e/home-hero-admin-save.spec.js`
- Modify: `src/pages/user/UserHome.jsx`
- Modify: `src/pages/admin/AdminDashboard.jsx`
- Modify: `tests/e2e/public-home.spec.js`
- Modify: `tests/e2e/support/mockOrganizationApi.js`
- Modify: `playwright.organization.config.js`
- Modify: `package.json`
- Delete: `src/components/HomeBannerHero.jsx`
- Delete: `src/components/home/PublicHomeHero.jsx`

**Interfaces:**
- Consumes: Task 5 model plus Button, FormField, AsyncState, StatusBadge, Surface
- Produces: `HomeHero({ banners, isPreview=false, headingLevel=1 })`
- Admin save behavior: block load/error and invalid blank states; `createHomeBannerUpdatePayload(homeBanners)` sends one mock-verified PUT; no `autoSlideSeconds` field; hidden legacy values are preserved in normalized banners

- [ ] **Step 1: Write the failing parity and editor-contract tests**

Create `tests/e2e/home-hero-parity.spec.js`. The controllable `setHomeBanner` mock used here is added in Step 2, so these checks cannot accidentally pass on the shared fallback:

```js
import { test, expect } from './fixtures/organizationTest.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: {
    userId: 'home-hero-admin',
    role: 'ROLE_ADMIN',
    canManageContent: true,
    hasMaxAccess: false,
  } },
};

const API_500 = /^Failed to load resource: the server responded with a status of 500 \(Internal Server Error\)$/;
const HOME_BANNER_API_URL = /\/api\/v1\/home-banner(?:[?#].*)?$/;
const HOME_BANNER_SERVICE_URL = /\/src\/services\/homeBannerService\.js(?:[?#].*)?$/;

const HERO_FIXTURE = {
  banners: [{
    badgeText: '공유 렌더러 전용 배지',
    title: 'API에서 받은 공유 Hero 제목',
    description: 'fallback과 구분되는 관리자·공개 공통 설명입니다.',
    backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
    sideImageUrl: '/legacy/fixture-side.png',
    titleColor: '#123456',
    descriptionColor: '#234567',
    badgeTextColor: '#345678',
    primaryButtonText: '단체 소개',
    primaryButtonLink: '/intro',
    secondaryButtonText: '프로그램 참여',
    secondaryButtonLink: '/programs/participate',
    sideTitle: '렌더링하지 않는 기존 제목',
    sideDescription: '렌더링하지 않는 기존 설명',
  }],
  autoSlideSeconds: 17,
};

const readHeroSignature = (hero) => hero.evaluate((root) => ({
  badge: root.querySelector('[data-hero-part="badge"]')?.textContent.trim(),
  title: root.querySelector('[data-hero-part="title"]')?.textContent.trim(),
  description: root.querySelector('[data-hero-part="description"]')?.textContent.trim(),
  actions: [...root.querySelectorAll('[data-hero-part="actions"] a')].map((link) => link.textContent.trim()),
  surfaceClass: root.querySelector('[data-hero-part="surface"]')?.className,
  titleClass: root.querySelector('[data-hero-part="title"]')?.className,
}));

test('admin preview and public home use the same Hero content, order, and visual contract', async ({ page, organizationApi }) => {
  organizationApi.setHomeBanner(HERO_FIXTURE);
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=homeBanner');
  const adminHero = page.locator('[data-component="home-hero"]');
  await expect(adminHero).toBeVisible();
  const adminSignature = await readHeroSignature(adminHero);

  await page.goto('/');
  const publicHero = page.locator('[data-component="home-hero"]');
  await expect(publicHero).toBeVisible();
  const publicSignature = await readHeroSignature(publicHero);

  expect(adminSignature).toEqual(publicSignature);
  expect(publicSignature.title).toBe('API에서 받은 공유 Hero 제목');
  expect(publicSignature.actions).toEqual(['프로그램 참여', '단체 소개']);
});

test('admin editor exposes only fields rendered by the public Hero', async ({ page, organizationApi }) => {
  organizationApi.setHomeBanner(HERO_FIXTURE);
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  await editor.getByLabel('제목', { exact: true }).fill('관리자 미리보기 확인');
  await expect(page.locator('[data-component="home-hero"]').getByRole('heading', { name: '관리자 미리보기 확인' })).toBeVisible();

  for (const hiddenLabel of ['자동 전환 간격(초)', '배지 색상', '제목 색상', '설명 색상', '우측 카드 이미지', '우측 카드 제목', '우측 카드 설명']) {
    await expect(editor.getByLabel(hiddenLabel, { exact: true })).toHaveCount(0);
  }
  for (const visibleLabel of ['배지 문구', '제목', '설명 문구', '버튼 A 문구', '버튼 A 링크', '버튼 B 문구', '버튼 B 링크', '배경 이미지']) {
    expect((await editor.getByLabel(visibleLabel, { exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(48);
  }
  await expect(editor.getByText('버튼 A와 B 중 프로그램 페이지로 연결되는 버튼은 공개 화면에서 먼저 표시됩니다.', { exact: true }).first()).toBeVisible();
  for (const actionName of ['현재 배너 초기화', '배너 추가', '현재 배너 삭제', '저장']) {
    expect((await editor.getByRole('button', { name: actionName, exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(48);
  }
});

test('Hero background advances through page, API, and local fallback candidates', async ({ page, organizationApi }) => {
  await page.route('**/uploads/hero.png', async (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#166534"/></svg>',
  }));
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({
    ...HERO_FIXTURE,
    banners: [{ ...HERO_FIXTURE.banners[0], backgroundImageUrl: '/uploads/hero.png' }],
  });
  await page.goto('/');
  const image = page.locator('[data-hero-part="background"]');
  await expect(image).toHaveAttribute('src', 'http://127.0.0.1:3000/uploads/hero.png');
  await image.dispatchEvent('error');
  await expect(image).toHaveAttribute('src', 'http://localhost:8080/uploads/hero.png');
  await image.dispatchEvent('error');
  await expect(image).toHaveAttribute('src', '/draft/forest-hero-placeholder.svg');
});

test('admin home banner load failure blocks editing and offers a safe retry', async ({ page, organizationApi, pageQuality }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.fail('/home-banner', 500);
  for (let index = 0; index < 2; index += 1) {
    pageQuality.allowConsoleError(API_500, HOME_BANNER_API_URL);
    pageQuality.allowConsoleError(/^Error fetching home banner: AxiosError$/, HOME_BANNER_SERVICE_URL);
  }

  await page.goto('/admin?section=homeBanner');
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: '홈 배너를 불러오지 못했습니다' })).toBeVisible();
  await expect(page.getByRole('region', { name: '홈 화면 메인 배너 편집' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '저장', exact: true })).toHaveCount(0);

  organizationApi.recover('/home-banner');
  await error.getByRole('button', { name: '다시 시도' }).click();
  await expect(page.getByRole('region', { name: '홈 화면 메인 배너 편집' })).toBeVisible();
});
```

- [ ] **Step 2: Add an organization-E2E Home Banner PUT mock and integration test**

In `mockOrganizationApi.js`, import `publicHomeData`, initialize `homeBanner`, `homeBannerPutRequests`, `expectedHomeBannerPutCount`, and one deferred response gate, then register this route after `installPublicApiMocks()` so no real write can escape:

```js
import { publicHomeData } from '../fixtures/publicHomeData.js';

// Inside installOrganizationApiMocks, before routes are registered:
let homeBanner = structuredClone(publicHomeData.banner);
const homeBannerPutRequests = [];
let expectedHomeBannerPutCount = 0;
let nextHomeBannerPutResponseGate = null;
let deferredHomeBannerPutResponseGate = null;

// After installPublicApiMocks(page, ...):
await page.route(/\/api\/v1\/home-banner(?:[?#].*)?$/, async (route) => {
  const request = route.request();
  const method = request.method();
  requests.push(`${method} /home-banner`);
  const forcedStatus = failures.get('/home-banner');
  if (forcedStatus) {
    return route.fulfill({
      status: forcedStatus,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'forced organization test failure: /home-banner' }),
    });
  }
  if (method === 'GET') {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: homeBanner }) });
  }
  if (method === 'PUT') {
    const payload = request.postDataJSON();
    homeBannerPutRequests.push(payload);
    homeBanner = { ...homeBanner, ...payload };
    if (nextHomeBannerPutResponseGate) {
      const gate = nextHomeBannerPutResponseGate;
      nextHomeBannerPutResponseGate = null;
      await gate.promise;
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: homeBanner }) });
  }
  unhandled.push(`${method} /home-banner`);
  return route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'method not allowed' }) });
});
```

Replace the earlier narrow `setHomeBanner` return helper and extend the returned API with:

```js
setHomeBanner(next) {
  homeBanner = structuredClone(next);
  publicApi.setData({ banner: homeBanner });
},
deferNextHomeBannerPutResponse() {
  if (nextHomeBannerPutResponseGate) throw new Error('a home banner PUT response is already deferred');
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  nextHomeBannerPutResponseGate = { promise, release };
  deferredHomeBannerPutResponseGate = nextHomeBannerPutResponseGate;
},
releaseDeferredHomeBannerPutResponse() {
  if (!deferredHomeBannerPutResponseGate) throw new Error('no deferred home banner PUT response');
  deferredHomeBannerPutResponseGate.release();
  deferredHomeBannerPutResponseGate = null;
},
expectHomeBannerPutCount(count) {
  expectedHomeBannerPutCount = count;
},
getHomeBannerPutRequests() {
  return [...homeBannerPutRequests];
},
```

Include `/home-banner` in the local `fail()` allow-list. In `assertHandled()`, add:

```js
expect(homeBannerPutRequests, 'unexpected home banner PUT request count')
  .toHaveLength(expectedHomeBannerPutCount);
```

Change `playwright.organization.config.js` to include the write-focused spec while retaining the existing organization specs:

```js
testMatch: /(?:organization-directory-.*|home-hero-admin-save)\.spec\.js/,
```

Create `tests/e2e/home-hero-admin-save.spec.js`:

```js
import { test, expect } from './fixtures/organizationTest.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: { userId: 'home-hero-admin', role: 'ROLE_ADMIN', canManageContent: true, hasMaxAccess: false } },
};

const LEGACY_SENTINELS = {
  sideImageUrl: '/legacy/save-side.png',
  titleColor: '#123456',
  descriptionColor: '#234567',
  badgeTextColor: '#345678',
  sideTitle: '숨겨진 기존 제목',
  sideDescription: '숨겨진 기존 설명',
};

test('admin validates visible fields and sends one compatibility-safe Home Banner update', async ({ page, organizationApi }) => {
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  organizationApi.setHomeBanner({
    banners: [{
      badgeText: '저장 테스트 배지',
      title: '저장 전 제목',
      description: '저장 전 설명',
      backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
      primaryButtonText: '단체 소개',
      primaryButtonLink: '/intro',
      secondaryButtonText: '프로그램 참여',
      secondaryButtonLink: '/programs/participate',
      ...LEGACY_SENTINELS,
    }],
    autoSlideSeconds: 17,
  });
  organizationApi.expectHomeBannerPutCount(1);
  organizationApi.deferNextHomeBannerPutResponse();

  await page.goto('/admin?section=homeBanner');
  const editor = page.getByRole('region', { name: '홈 화면 메인 배너 편집' });
  const title = editor.getByLabel('제목', { exact: true });
  const save = editor.getByRole('button', { name: '저장', exact: true });

  await title.fill('   ');
  await save.click();
  await expect(editor.getByText('제목을 입력해 주세요.', { exact: true })).toBeVisible();
  expect(organizationApi.getHomeBannerPutRequests()).toHaveLength(0);

  await title.fill('저장한 새 제목');
  await save.click();
  await expect.poll(() => organizationApi.getHomeBannerPutRequests().length).toBe(1);
  await expect(save).toBeDisabled();
  await expect(save).toHaveText('저장 중…');

  const [payload] = organizationApi.getHomeBannerPutRequests();
  expect(Object.hasOwn(payload, 'autoSlideSeconds')).toBe(false);
  expect(payload.banners[0].title).toBe('저장한 새 제목');
  for (const [field, value] of Object.entries(LEGACY_SENTINELS)) {
    expect(payload.banners[0][field]).toBe(value);
  }

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('홈 배너가 저장되었습니다.');
    await dialog.accept();
  });
  organizationApi.releaseDeferredHomeBannerPutResponse();
  await expect(save).toBeEnabled();
  await expect(save).toHaveText('저장');
});
```

- [ ] **Step 3: Run RED**

Run:

```bash
npx playwright test tests/e2e/home-hero-parity.spec.js --project=desktop
npx playwright test --config=playwright.organization.config.js tests/e2e/home-hero-admin-save.spec.js --project=desktop
```

Expected: both commands FAIL because admin/public use different components, the admin editor still exposes unsupported controls, blank values are not validated, and the PUT payload still includes `autoSlideSeconds`.

- [ ] **Step 4: Implement the shared HomeHero**

Create `src/features/home/HomeHero.jsx` by moving the existing `PublicHomeHero` behavior and changing it to this interface:

```jsx
import { useEffect, useId, useMemo, useState } from 'react';
import ActionLink from '../../design-system/primitives/ActionLink';
import Button from '../../design-system/primitives/Button';
import {
  createHeroImageCandidates,
  normalizeHomeBanners,
  selectHomeHeroActions,
} from './homeHeroModel';

const isExternalLink = (link = '') => /^https?:\/\//i.test(link);

const getApiOrigin = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (/^https?:\/\//i.test(configuredBaseUrl || '')) return new URL(configuredBaseUrl).origin;
  return import.meta.env.DEV ? 'http://localhost:8080' : 'https://forest.platformholder.site';
};

function HeroBackgroundImage({ src }) {
  const candidates = useMemo(() => createHeroImageCandidates(src, {
    pageOrigin: window.location.origin,
    apiOrigin: getApiOrigin(),
  }), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => setCandidateIndex(0), [candidates]);
  const currentSrc = candidates[Math.min(candidateIndex, candidates.length - 1)];

  return (
    <img
      data-hero-part="background"
      className="absolute inset-0 h-full w-full object-cover"
      alt=""
      src={currentSrc}
      onError={() => setCandidateIndex((current) => Math.min(current + 1, candidates.length - 1))}
    />
  );
}

export default function HomeHero({ banners = [], isPreview = false, headingLevel = 1 }) {
  const items = normalizeHomeBanners(banners);
  const [requestedIndex, setRequestedIndex] = useState(0);
  const index = Math.min(requestedIndex, items.length - 1);
  const banner = items[index];
  const titleId = `${useId()}-title`;
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  const { primary, secondary } = selectHomeHeroActions(banner);
  const selectRelative = (offset) => setRequestedIndex((current) => (
    (Math.min(current, items.length - 1) + offset + items.length) % items.length
  ));
  const actionProps = (link) => ({
    ...(isExternalLink(link)
      ? { href: link, target: '_blank', rel: 'noopener noreferrer' }
      : { to: link }),
    ...(isPreview ? { onClick: (event) => event.preventDefault(), 'aria-disabled': 'true', tabIndex: -1 } : {}),
  });

  return (
    <div data-component="home-hero">
      <section data-hero-part="surface" aria-labelledby={titleId} className="overflow-hidden rounded-3xl bg-forest-strong text-forest-text-inverse shadow-xl">
        <div className="relative min-h-[31rem]">
          <HeroBackgroundImage src={banner.backgroundImageUrl} />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/75 to-green-800/45" />
          <div className="relative max-w-3xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
            {banner.badgeText && <p data-hero-part="badge" className="text-forest-body font-bold text-forest-text-inverse">{banner.badgeText}</p>}
            <Heading id={titleId} data-hero-part="title" className="mt-4 text-forest-heading-1 font-bold">{banner.title}</Heading>
            {banner.description && <p data-hero-part="description" className="mt-5 text-forest-body text-forest-text-inverse">{banner.description}</p>}
            <div data-hero-part="actions" className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <ActionLink {...actionProps(primary.link)}>{primary.text}</ActionLink>
              {secondary && <ActionLink {...actionProps(secondary.link)} variant="inverseQuiet">{secondary.text}</ActionLink>}
            </div>
          </div>
        </div>
      </section>
      {items.length > 1 && (
        <div role="group" className="mt-4 flex flex-wrap items-center justify-center gap-3" aria-label="대표 배너 선택">
          <Button variant="secondary" onClick={() => selectRelative(-1)} aria-label="이전 배너">이전</Button>
          {items.map((item, itemIndex) => (
            <Button key={`${item.title}-${itemIndex}`} variant={itemIndex === index ? 'primary' : 'secondary'}
              aria-label={`${itemIndex + 1}번 배너 보기`} aria-pressed={itemIndex === index}
              onClick={() => setRequestedIndex(itemIndex)}>{itemIndex + 1}</Button>
          ))}
          <Button variant="secondary" onClick={() => selectRelative(1)} aria-label="다음 배너">다음</Button>
        </div>
      )}
    </div>
  );
}
```

The image gradient can continue using the existing green compatibility scale in this feature component; it is not part of the generic design-system source policy.

- [ ] **Step 5: Move UserHome to the shared model/renderer**

Remove `DEFAULT_HOME_BANNER` from `UserHome.jsx`. Import:

```js
import HomeHero from '../../features/home/HomeHero';
import { normalizeHomeBanners } from '../../features/home/homeHeroModel';
```

Replace the existing memo with:

```js
const homeBanners = useMemo(() => normalizeHomeBanners(homeBannerData), [homeBannerData]);
```

Render:

```jsx
<HomeHero banners={homeBanners} />
```

- [ ] **Step 6: Simplify the admin editor without breaking the API**

In `AdminDashboard.jsx`:

1. Import `HomeHero`, `HOME_HERO_DEFAULT`, `normalizeHomeBanners`, `resetHomeHeroVisibleFields`, `validateHomeHeroBanners`, and `createHomeBannerUpdatePayload`, plus `Button`, `FormField`, `StatusBadge`, and `Surface` from the design-system paths. Keep the existing `AsyncState` compatibility import from `../../components/AsyncState`; Task 3 already redirects it to the single design-system implementation, so adding a second import would create a duplicate binding.
2. Delete local `HOME_BANNER_DEFAULT`, `HOME_BANNER_DEFAULT_SLIDE_SECONDS`, and `homeBannerAutoSlideSeconds` state. Add `const [homeBannerFieldErrors, setHomeBannerFieldErrors] = useState([]);` beside the existing Home Banner state.
3. Expand the existing query destructuring exactly so loading, failure, retry, and retry-pending are distinct:

```js
const {
  data: homeBannerData,
  isLoading: homeBannerLoading,
  isError: homeBannerError,
  isFetching: homeBannerFetching,
  refetch: refetchHomeBanner,
} = useQuery({
  queryKey: ['homeBanner', 'admin'],
  queryFn: getHomeBanner,
  enabled: activeMenu === 'homeBanner',
  retry: false,
});
```

`retry: false` makes the explicit “다시 시도” action the only retry path and keeps the error-state test deterministic.

4. Initialize `homeBanners` and the `homeBannerForm` fallback with `HOME_HERO_DEFAULT`; replace every remaining local-default reference in add/reset handlers with that import. Replace the loading effect with:

```js
useEffect(() => {
  const nextBanners = normalizeHomeBanners(homeBannerData);
  setHomeBanners(nextBanners);
  setHomeBannerFieldErrors(nextBanners.map(() => ({})));
  setSelectedHomeBannerIndex(0);
}, [homeBannerData]);
```

When adding or removing a banner, update the parallel error array in the same handler:

```js
// In handleAddHomeBanner, after appending nextBanner:
setHomeBannerFieldErrors((current) => [...current, {}]);

// In handleRemoveCurrentHomeBanner, with the same selected index used for homeBanners:
setHomeBannerFieldErrors((current) => current.filter((_, index) => index !== selectedHomeBannerIndex));
```

Apply the existing selected-index clamp after both removals. This keeps validation messages attached to the correct banner after list edits.

Replace `handleApplyDefaultHomeBanner` with the model helper so only publicly supported fields reset and hidden legacy values survive:

```js
const handleApplyDefaultHomeBanner = () => {
  setHomeBannerFieldErrors((current) => current.map((errors, index) => (
    index === selectedHomeBannerIndex ? {} : errors
  )));
  setHomeBanners((current) => current.map((banner, index) => (
    index === selectedHomeBannerIndex ? resetHomeHeroVisibleFields(banner) : banner
  )));
};
```
5. Replace `handleHomeBannerFieldChange` so changing a field clears only that field's error for the selected banner:

```js
const handleHomeBannerFieldChange = (field, value) => {
  setHomeBanners((current) => current.map((banner, index) => (
    index === selectedHomeBannerIndex ? { ...banner, [field]: value } : banner
  )));
  setHomeBannerFieldErrors((current) => current.map((errors, index) => (
    index === selectedHomeBannerIndex ? { ...errors, [field]: undefined } : errors
  )));
};
```

Then change save to validate every banner before the mutation and guard against unavailable query data:

```js
const handleSaveHomeBanner = () => {
  if (homeBannerLoading || homeBannerError) return;
  const validation = validateHomeHeroBanners(homeBanners);
  const firstInvalidIndex = validation.findIndex((errors) => Object.keys(errors).length > 0);
  setHomeBannerFieldErrors(validation);
  if (firstInvalidIndex >= 0) {
    setSelectedHomeBannerIndex(firstInvalidIndex);
    return;
  }
  saveHomeBanner(createHomeBannerUpdatePayload(homeBanners));
};
```

6. Delete controls for `autoSlideSeconds`, all three color fields, and all three side-card fields. Keep badge/title/description, two buttons, and background image URL/upload.
7. Change the editor description to “문구, 버튼, 배경 이미지를 수정하면 아래 실제 공개 화면 미리보기에 반영됩니다.” Add a visible button-field explanation: “버튼 A와 B 중 프로그램 페이지로 연결되는 버튼은 공개 화면에서 먼저 표시됩니다.” Do not call either stored field “주 버튼”, because public priority is derived from its destination.
8. Replace the editor action buttons with these primitive contracts, preserving their current handlers:

```jsx
<Button variant="secondary" onClick={handleApplyDefaultHomeBanner}>현재 배너 초기화</Button>
<Button variant="secondary" onClick={handleAddHomeBanner}>배너 추가</Button>
<Button variant="danger" onClick={handleRemoveCurrentHomeBanner}>현재 배너 삭제</Button>
<Button onClick={handleSaveHomeBanner} isPending={isSavingHomeBanner}
  disabled={homeBannerLoading} pendingLabel="저장 중…">저장</Button>
```

Use `Button` for the numbered banner selectors as well, with `aria-pressed={selectedHomeBannerIndex === index}`, `variant` primary for the selected banner and secondary otherwise. This removes the 14px pill tabs while keeping `setSelectedHomeBannerIndex(index)` unchanged.

9. Render the supported inputs through `FormField` with these exact IDs and mappings:

```js
const homeBannerTextFields = [
  ['home-banner-badge-text', '배지 문구', 'badgeText'],
  ['home-banner-title', '제목', 'title'],
];
const homeBannerActionFields = [
  ['home-banner-primary-button-text', '버튼 A 문구', 'primaryButtonText'],
  ['home-banner-primary-button-link', '버튼 A 링크', 'primaryButtonLink'],
  ['home-banner-secondary-button-text', '버튼 B 문구', 'secondaryButtonText'],
  ['home-banner-secondary-button-link', '버튼 B 링크', 'secondaryButtonLink'],
];
```

For every `[id, label, field]` tuple render:

```jsx
<FormField key={field} id={id} label={label}
  error={homeBannerFieldErrors[selectedHomeBannerIndex]?.[field]} required>
  {(controlProps) => (
    <input {...controlProps} type="text" value={homeBannerForm[field]}
      onChange={(event) => handleHomeBannerFieldChange(field, event.target.value)} />
  )}
</FormField>
```

Render `homeBannerActionFields` once inside this labelled group so the priority explanation is visible without being repeated under every input:

```jsx
<fieldset aria-describedby="home-banner-action-priority">
  <legend className="text-forest-label font-bold text-forest-text-primary">공개 화면 버튼</legend>
  <p id="home-banner-action-priority" className="mt-forest-2 text-forest-supporting text-forest-text-muted">
    버튼 A와 B 중 프로그램 페이지로 연결되는 버튼은 공개 화면에서 먼저 표시됩니다.
  </p>
  <div className="mt-forest-4 grid gap-forest-4 md:grid-cols-2">
    {homeBannerActionFields.map(([id, label, field]) => (
      <FormField key={field} id={id} label={label}
        error={homeBannerFieldErrors[selectedHomeBannerIndex]?.[field]} required>
        {(controlProps) => (
          <input {...controlProps} type="text" value={homeBannerForm[field]}
            onChange={(event) => handleHomeBannerFieldChange(field, event.target.value)} />
        )}
      </FormField>
    ))}
  </div>
</fieldset>
```

Render description and background URL with the same contract:

```jsx
<FormField id="home-banner-description" label="설명 문구"
  error={homeBannerFieldErrors[selectedHomeBannerIndex]?.description} required>
  {(controlProps) => (
    <textarea {...controlProps} rows={3} value={homeBannerForm.description}
      onChange={(event) => handleHomeBannerFieldChange('description', event.target.value)} />
  )}
</FormField>
<FormField id="home-banner-background-image" label="배경 이미지"
  error={homeBannerFieldErrors[selectedHomeBannerIndex]?.backgroundImageUrl} required>
  {(controlProps) => (
    <input {...controlProps} type="text" value={homeBannerForm.backgroundImageUrl}
      onChange={(event) => handleHomeBannerFieldChange('backgroundImageUrl', event.target.value)} />
  )}
</FormField>
```

Keep the existing background file input and upload handler with this keyboard-reachable markup:

```jsx
<label className="inline-flex min-h-forest-control cursor-pointer items-center rounded-forest-control border border-forest-border-strong bg-forest-surface-raised px-forest-4 font-bold text-forest-strong focus-within:outline focus-within:outline-forest focus-within:outline-offset-2 focus-within:outline-forest-focus">
  이미지 업로드
  <input type="file" accept="image/*" className="sr-only"
    onChange={(event) => handleHomeBannerImageUpload('backgroundImageUrl', event)} />
</label>
```

While uploading, render `<StatusBadge tone="info">배경 이미지 업로드 중…</StatusBadge>`. Replace the loading spinner with `<AsyncState status="loading" />`.

10. Render the entire Home Banner section as an explicit query-state branch. Loading renders `<AsyncState status="loading" title="홈 배너를 불러오고 있습니다" />`. Error renders only:

```jsx
<AsyncState
  status="error"
  title="홈 배너를 불러오지 못했습니다"
  description="기존 운영 값을 보호하기 위해 편집을 중단했습니다. 다시 불러온 뒤 수정해 주세요."
  onRetry={() => refetchHomeBanner()}
  isRetrying={homeBannerFetching}
/>
```

Render the editor, its actions, and preview only in the success branch. Never expose `HOME_HERO_DEFAULT` as an editable/saveable substitute after a GET failure.

11. Wrap the editor card with:

```jsx
<Surface aria-labelledby="home-banner-editor-title">
  <h3 id="home-banner-editor-title" className="text-forest-heading-3 font-bold text-forest-text-primary">홈 화면 메인 배너 편집</h3>
  {/* existing supported controls */}
</Surface>
```

12. Render the preview with the same component:

```jsx
<Surface aria-labelledby="home-banner-preview-title">
  <h4 id="home-banner-preview-title" className="mb-forest-4 text-forest-heading-3 font-bold text-forest-text-primary">실제 공개 화면 미리보기</h4>
  <HomeHero banners={[homeBannerForm]} isPreview headingLevel={2} />
</Surface>
```

The organization-E2E save test is the integration boundary: it must exercise the real handler and mutation against only the local mock route, while the pure model test continues to define normalization and compatibility-field behavior.

- [ ] **Step 7: Delete the split renderers and update existing test selectors**

Delete:

```text
src/components/HomeBannerHero.jsx
src/components/home/PublicHomeHero.jsx
```

Update `public-home.spec.js` only where a selector depends on old markup. In the existing two-banner test, add this assertion before using the controls so the named grouping contract is covered:

```js
await expect(page.getByRole('group', { name: '대표 배너 선택' })).toBeVisible();
```

Preserve the test that waits 5.5 seconds and verifies no auto-advance.

Now that both catalog and parity specs exist, update the package script to:

```json
"test:e2e:design-system": "playwright test tests/e2e/design-system-catalog.spec.js tests/e2e/home-hero-parity.spec.js"
```

- [ ] **Step 8: Run GREEN and all public states**

Run:

```bash
npx playwright test tests/e2e/home-hero-parity.spec.js --project=desktop
npx playwright test --config=playwright.organization.config.js tests/e2e/home-hero-admin-save.spec.js --project=desktop
npm run test:e2e:public:functional
npm run test:unit
npm run lint
npm run build
```

Expected: parity, local-mock save integration, and public functional tests pass; the invalid blank title produces zero PUTs; the valid save sends exactly one PUT with hidden legacy sentinels and without `autoSlideSeconds`; public Hero still never auto-advances; build has no imports of either deleted renderer. Do not accept or update the changed public screenshot yet.

- [ ] **Step 9: Commit Task 6**

```bash
git add src/features/home src/pages/user/UserHome.jsx src/pages/admin/AdminDashboard.jsx tests/e2e/home-hero-parity.spec.js tests/e2e/home-hero-admin-save.spec.js tests/e2e/public-home.spec.js tests/e2e/support/mockOrganizationApi.js playwright.organization.config.js package.json
git add -u src/components/HomeBannerHero.jsx src/components/home/PublicHomeHero.jsx
git commit -m "feat: unify public and admin home hero"
```

---

### Task 7: Apply the design system to the representative organization pilot

**Files:**
- Create: `src/design-system/tests/sourcePolicy.test.js`
- Modify: `src/components/admin/organization/OrganizationDirectoryEditor.jsx`
- Modify: `src/components/admin/organization/OrganizationGroupForm.jsx`
- Modify: `src/components/admin/organization/OrganizationGroupTree.jsx`
- Modify: `src/components/organization/OrganizationDirectory.jsx`
- Modify: `src/components/organization/OrganizationMemberList.jsx`
- Modify: `tests/e2e/organization-directory-admin.spec.js`
- Modify: `tests/e2e/organization-directory-public.spec.js`

**Interfaces:**
- Consumes: Button, FormField, StatusBadge, Surface, AccessibleDialog, semantic tokens
- Produces: token-conformant structured public directory, representative admin group editor, and migrated organization dialogs while preserving all current organization data/state contracts
- Does not touch: organization services, draft validation, revision/fingerprint concurrency, people/membership domain logic

- [ ] **Step 1: Add the failing pilot source-policy test**

Create `src/design-system/tests/sourcePolicy.test.js`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const designSystemRuntimeFiles = [
  '../primitives/actionControlStyles.js',
  '../primitives/Button.jsx',
  '../primitives/ActionLink.jsx',
  '../primitives/IconButton.jsx',
  '../primitives/FormField.jsx',
  '../primitives/StatusBadge.jsx',
  '../primitives/AsyncState.jsx',
  '../primitives/AccessibleDialog.jsx',
  '../patterns/Surface.jsx',
  '../patterns/SectionHeading.jsx',
  '../catalog/DesignSystemCatalog.jsx',
];

const pilotFiles = [
  '../../components/admin/organization/OrganizationDirectoryPreview.jsx',
  '../../components/admin/organization/OrganizationSaveConfirmation.jsx',
  '../../components/admin/organization/OrganizationGroupForm.jsx',
  '../../components/admin/organization/OrganizationGroupTree.jsx',
  '../../components/organization/OrganizationDirectory.jsx',
  '../../components/organization/OrganizationMemberList.jsx',
];

const forbiddenPalette = /\b(?:accent|bg|text|border|ring|outline|fill|stroke|decoration|from|via|to)-(?:(?:green|emerald|blue|red|amber|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)|(?:white|black)(?:\/\d+)?)\b/;
const forbiddenRuntimeLiteral = /\b(?:text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)|min-h-12|h-12|w-12|rounded-(?:lg|xl|2xl)|p-(?:5|6))\b/;
const forbiddenPilotAccessibility = /\btext-xs\b|\bmin-h-1[01]\b/;

test('design-system runtime and organization pilot use semantic tokens', async () => {
  for (const relativePath of designSystemRuntimeFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, forbiddenPalette, `${relativePath} contains a raw palette utility`);
    assert.doesNotMatch(source, forbiddenRuntimeLiteral, `${relativePath} bypasses a typography, size, or radius token`);
  }
  for (const relativePath of pilotFiles) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, forbiddenPalette, `${relativePath} contains a raw palette utility`);
    assert.doesNotMatch(source, forbiddenPilotAccessibility, `${relativePath} contains an undersized accessibility utility`);
  }
});

test('production routes do not statically import the catalog', async () => {
  const source = await readFile(new URL('../../routes.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^import DesignSystemCatalog/m);
  assert.match(source, /import\.meta\.env\.DEV && import\.meta\.env\.VITE_DRAFT_MODE === 'true'/);
  assert.match(source, /lazy\(\(\) => import\('\.\/design-system\/catalog\/DesignSystemCatalog'\)\)/);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm run test:unit:design-system
```

Expected: FAIL and name the first organization pilot file containing raw palette utilities.

- [ ] **Step 3: Migrate OrganizationGroupForm to FormField and Surface**

Keep `errorFor(field)` and all `onChange` calls. Use these exact field IDs:

```js
const nameId = `organization-group-name-${group.id}`;
const descriptionId = `organization-group-description-${group.id}`;
const parentId = `organization-group-parent-${group.id}`;
```

Convert the no-selection branch as well, so the whole source-policy file passes:

```jsx
if (!group) {
  return (
    <Surface aria-label="그룹 상세 편집">
      <p className="text-forest-text-muted">왼쪽에서 편집할 그룹을 선택해 주세요.</p>
    </Surface>
  );
}
```

Wrap the content in:

```jsx
<Surface aria-labelledby="organization-group-form-title">
  <h3 id="organization-group-form-title" className="text-forest-heading-3 font-bold text-forest-text-primary">
    선택한 그룹 편집
  </h3>
  {/* FormField controls and the existing public checkbox */}
</Surface>
```

Render each text/select field with the same pattern:

```jsx
<FormField id={nameId} label="그룹 이름" error={errorFor('name')} required>
  {(controlProps) => (
    <input {...controlProps} type="text" value={group.name} maxLength={100}
      onChange={(event) => onChange('name', event.target.value)} />
  )}
</FormField>
```

Use `descriptionId` with `errorFor('description')` and a `<textarea rows={4}>`; use `parentId` with `errorFor('parentGroupId')` and the existing `<select>` options. Keep the “공개” checkbox label at least 48px, give the checkbox `accent-forest-primary`, and change every remaining raw color to semantic Forest tokens.

- [ ] **Step 4: Migrate the group tree actions and status text**

In `OrganizationGroupTree.jsx`:

- Wrap the root in `Surface`.
- Render “최상위 조직 추가” with `<Button onClick={onAddRoot}>`.
- Render group visibility with `<StatusBadge size="sm" tone={group.enabled ? 'success' : 'neutral'}>`.
- Render 하위 추가/위로/아래로/공개 전환 with `Button variant="secondary"`.
- Render 삭제 with `Button variant="danger"`.
- Preserve every current `aria-label`, disabled expression, `data-*` attribute, sibling order calculation, and `marginInlineStart` style.
- Change the group selection button and list item surfaces only to `forest-*` semantic tokens; do not turn selection into a generic Button variant.

- [ ] **Step 5: Migrate the public directory and member cards to semantic tokens**

In `OrganizationDirectory.jsx` and `OrganizationMemberList.jsx`, replace raw palette utilities with their semantic equivalents:

```text
green-900/950 → forest-strong or forest-text-primary
green-700/800 → forest-primary or forest-strong
green-50/100/200 → forest-surface, forest-success-surface, forest-border-subtle
gray-600/700/900 → forest-text-muted or forest-text-primary
white → forest-surface-card
```

Keep the public group controls as native buttons with the existing `aria-current`, local state behavior, focus preservation, 48px target, and responsive columns. Do not change URL/history/scroll behavior.

- [ ] **Step 6: Strengthen organization E2E assertions**

In `OrganizationDirectoryEditor.jsx`, add a stable visual-test boundary to the existing grid that directly wraps `OrganizationGroupTree` and `OrganizationGroupForm`:

```jsx
<div data-component="organization-group-editor"
  className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)]">
```

In `organization-directory-admin.spec.js`, inside the existing group form test, assert:

```js
for (const control of [page.getByLabel('그룹 이름'), page.getByLabel('그룹 설명'), page.getByLabel('상위 그룹')]) {
  expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(48);
}
```

In `organization-directory-public.spec.js`, inside the existing responsive-controls test, assert:

```js
const focusRing = await page.getByRole('button', { name: '운영위원회' }).evaluate((node) => {
  node.focus();
  return Number.parseFloat(getComputedStyle(node).outlineWidth);
});
expect(focusRing).toBeGreaterThanOrEqual(4);
```

- [ ] **Step 7: Run GREEN and the complete organization matrix**

Run:

```bash
npm run test:unit:design-system
npm run test:e2e:organization
npm run test:e2e:organization:preview
npm run lint
```

Expected: source policy passes; normal and Preview organization matrices pass; there are zero unexpected writes in Preview.

- [ ] **Step 8: Commit Task 7**

```bash
git add src/design-system/tests/sourcePolicy.test.js src/components/admin/organization/OrganizationDirectoryEditor.jsx src/components/admin/organization/OrganizationGroupForm.jsx src/components/admin/organization/OrganizationGroupTree.jsx src/components/organization/OrganizationDirectory.jsx src/components/organization/OrganizationMemberList.jsx tests/e2e/organization-directory-admin.spec.js tests/e2e/organization-directory-public.spec.js
git commit -m "refactor: apply design system to organization pilot surfaces"
```

---

### Task 8: Add the built-artifact boundary and OS-suffix-free visual baselines

**Files:**
- Create: `playwright.built.config.js`
- Create: `tests/e2e/design-system-production-boundary.spec.js`
- Modify: `tests/e2e/design-system-catalog.spec.js`
- Modify: `tests/e2e/home-hero-parity.spec.js`
- Modify: `tests/e2e/organization-directory-public.spec.js`
- Modify: `tests/e2e/organization-directory-admin.spec.js`
- Modify: `playwright.config.js`
- Modify: `package.json`
- Rename: existing public-home snapshot files to remove `-darwin`
- Create after user approval: catalog, admin Home Hero preview, public organization, admin organization group editor, and admin organization preview snapshots for desktop/tablet/mobile

**Interfaces:**
- Produces: `npm run preview:built`; `npm run test:e2e:built`; built Preview mutation-guard evidence; one reviewed snapshot filename per viewport without an OS suffix
- Requires: `npm run build` or `VERCEL_ENV=preview npm run build` before built E2E

- [ ] **Step 1: Add the built preview configuration**

Create `playwright.built.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /design-system-production-boundary\.spec\.js/,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview:built',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
```

Add to `package.json`:

```json
"preview:built": "vite preview --host 127.0.0.1 --port 4173 --strictPort",
"test:e2e:built": "playwright test --config=playwright.built.config.js"
```

- [ ] **Step 2: Add the production-boundary test**

Create `tests/e2e/design-system-production-boundary.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { installOrganizationApiMocks } from './support/mockOrganizationApi.js';

const ADMIN_USER_RESPONSE = {
  status: 200,
  body: { data: {
    userId: 'built-preview-admin',
    role: 'ROLE_ADMIN',
    canManageContent: true,
    hasMaxAccess: false,
  } },
};

const readBuiltJavaScript = async () => {
  const assetsUrl = new URL('../../dist/assets/', import.meta.url);
  const files = (await readdir(assetsUrl)).filter((file) => file.endsWith('.js'));
  return (await Promise.all(files.map((file) => readFile(new URL(file, assetsUrl), 'utf8')))).join('\n');
};

test('production artifact has no design-system catalog route or marker', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const isUsersRequest = new URL(route.request().url()).pathname.endsWith('/api/v1/users');
    await route.fulfill({
      status: isUsersRequest ? 403 : 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: isUsersRequest ? 'anonymous' : 'not found' }),
    });
  });
  await page.goto('/__design-system');
  await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
  await expect(page.locator('[data-design-system-catalog="forest-v1"]')).toHaveCount(0);
  await expect(readBuiltJavaScript()).resolves.not.toContain('forest-v1');
});

test('built Preview artifact disables organization saves before any PUT', async ({ page }) => {
  test.skip(process.env.FOREST_BUILT_PREVIEW !== 'true', 'built Preview regression only');
  const organizationApi = await installOrganizationApiMocks(page);
  organizationApi.setUser(ADMIN_USER_RESPONSE);

  await page.goto('/admin?section=intro');
  const peopleRow = page.getByRole('row').filter({ hasText: '함께하는이들' });
  await peopleRow.getByRole('button', { name: '조직도 관리' }).click();
  await expect(page.getByRole('heading', { name: '함께하는이들 조직도 관리' })).toBeVisible();
  await expect(page.getByRole('button', { name: '미리보기에서는 저장할 수 없습니다' })).toBeDisabled();
  expect(organizationApi.getPutRequests()).toEqual([]);
  organizationApi.assertHandled();
});
```

- [ ] **Step 3: Verify the normal built boundary**

Run separately:

```bash
npm run build
npm run test:e2e:built
```

Expected: build exits 0; the production boundary test passes; no emitted JavaScript contains the catalog marker.

- [ ] **Step 4: Make snapshot naming OS-neutral**

Add to `playwright.config.js` at the top config level. `updateSnapshots: 'none'` is the approval guard: missing baselines fail without being written, while the later explicit `--update-snapshots` CLI flag overrides it after approval.

```js
snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
updateSnapshots: 'none',
```

Rename the existing baselines:

```bash
git mv tests/e2e/public-home.spec.js-snapshots/forest-public-home-desktop-desktop-darwin.png tests/e2e/public-home.spec.js-snapshots/forest-public-home-desktop.png
git mv tests/e2e/public-home.spec.js-snapshots/forest-public-home-tablet-tablet-darwin.png tests/e2e/public-home.spec.js-snapshots/forest-public-home-tablet.png
git mv tests/e2e/public-home.spec.js-snapshots/forest-public-home-mobile-mobile-darwin.png tests/e2e/public-home.spec.js-snapshots/forest-public-home-mobile.png
```

In `public-home.spec.js`, replace the existing screenshot assertion with a review-only branch plus the static baseline name that `snapshotPathTemplate` will suffix:

```js
if (process.env.FOREST_VISUAL_REVIEW === 'true') {
  await page.screenshot({
    path: testInfo.outputPath('forest-public-home-review.png'),
    fullPage: true,
    animations: 'disabled',
  });
  return;
}
await expect(page).toHaveScreenshot('forest-public-home.png', { fullPage: true, animations: 'disabled' });
```

- [ ] **Step 5: Add catalog axe, reflow, reduced-motion, and screenshot coverage**

Append to `design-system-catalog.spec.js`:

```js
test('catalog has no critical or serious axe findings', async ({ page, pageQuality }) => {
  await openCatalog(page, pageQuality);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});

test('catalog reflows at 720 CSS pixels and honors reduced motion', async ({ page, pageQuality }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop 200% equivalent only');
  await page.setViewportSize({ width: 720, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCatalog(page, pageQuality);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  const motion = await page.locator('[aria-busy="true"] .animate-spin').evaluate((node) => ({
    durationMs: Number.parseFloat(getComputedStyle(node).animationDuration) * 1000,
    iterationCount: getComputedStyle(node).animationIterationCount,
  }));
  expect(motion.durationMs).toBeLessThanOrEqual(0.01);
  expect(motion.iterationCount).toBe('1');
});

test('catalog matches the reviewed responsive baseline', async ({ page, pageQuality }, testInfo) => {
  await openCatalog(page, pageQuality);
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await page.screenshot({
      path: testInfo.outputPath('forest-design-system-review.png'),
      fullPage: true,
      animations: 'disabled',
    });
    return;
  }
  await expect(page).toHaveScreenshot('forest-design-system.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

Append to `organization-directory-public.spec.js`, reusing its existing helpers:

```js
test('public organization matches the reviewed responsive baseline', async ({ page, organizationApi }, testInfo) => {
  test.skip(testInfo.config.metadata.organizationPreviewMode, 'normal organization visual baseline only');
  await openPeople(page, organizationApi);
  await expectStructuredDirectory(page);
  const directory = page.getByRole('navigation', { name: '조직 선택' }).locator('xpath=..');
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await directory.screenshot({
      path: testInfo.outputPath('forest-organization-public-review.png'),
      animations: 'disabled',
    });
    return;
  }
  await expect(directory).toHaveScreenshot('forest-organization-public.png', {
    animations: 'disabled',
  });
});
```

Append to `home-hero-parity.spec.js`, reusing its existing admin fixture:

```js
test('admin home Hero preview matches the reviewed responsive baseline', async ({ page, organizationApi }, testInfo) => {
  organizationApi.setHomeBanner(HERO_FIXTURE);
  organizationApi.setUser(ADMIN_USER_RESPONSE);
  await page.goto('/admin?section=homeBanner');
  const preview = page.locator('[data-component="home-hero"]');
  await expect(preview).toBeVisible();
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await preview.screenshot({
      path: testInfo.outputPath('forest-home-hero-admin-preview-review.png'),
      animations: 'disabled',
    });
    return;
  }
  await expect(preview).toHaveScreenshot('forest-home-hero-admin-preview.png', {
    animations: 'disabled',
  });
});
```

Append to `organization-directory-admin.spec.js`, reusing `openOrganizationEditor`:

```js
test('admin organization group editor matches the reviewed responsive baseline', async ({ page, organizationApi }, testInfo) => {
  test.skip(testInfo.config.metadata.organizationPreviewMode, 'normal organization visual baseline only');
  await openOrganizationEditor(page, organizationApi);
  const groupEditor = page.locator('[data-component="organization-group-editor"]');
  await expect(groupEditor).toBeVisible();
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await groupEditor.screenshot({
      path: testInfo.outputPath('forest-organization-admin-editor-review.png'),
      animations: 'disabled',
    });
    return;
  }
  await expect(groupEditor).toHaveScreenshot('forest-organization-admin-editor.png', {
    animations: 'disabled',
  });
});

test('admin organization preview matches the reviewed responsive baseline', async ({ page, organizationApi }, testInfo) => {
  test.skip(testInfo.config.metadata.organizationPreviewMode, 'normal organization visual baseline only');
  await openOrganizationEditor(page, organizationApi);
  await page.getByRole('button', { name: '저장 전 미리보기' }).click();
  const dialog = page.getByRole('dialog', { name: '저장 전 조직도 미리보기' });
  await expect(dialog).toBeVisible();
  if (process.env.FOREST_VISUAL_REVIEW === 'true') {
    await dialog.screenshot({
      path: testInfo.outputPath('forest-organization-admin-preview-review.png'),
      animations: 'disabled',
    });
    return;
  }
  await expect(dialog).toHaveScreenshot('forest-organization-admin-preview.png', {
    animations: 'disabled',
  });
});
```

- [ ] **Step 6: Generate review artifacts without creating baselines**

Run:

```bash
FOREST_VISUAL_REVIEW=true npx playwright test tests/e2e/design-system-catalog.spec.js tests/e2e/home-hero-parity.spec.js tests/e2e/public-home.spec.js --grep "reviewed responsive baseline" --output=test-results/design-system-review
FOREST_VISUAL_REVIEW=true npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-public.spec.js tests/e2e/organization-directory-admin.spec.js --grep "reviewed responsive baseline" --output=test-results/organization-review
```

Expected: both commands pass and write review-only PNGs under the two distinct output directories without touching any snapshot baseline. Organization artifacts use the normal organization-E2E write policy so the read-only Preview banner does not create a false visual diff.

- [ ] **Step 7: Stop for the required user visual review checkpoint**

Present the desktop, tablet, and mobile actual images for the catalog, public home, admin Home Hero preview, public organization, admin organization group editor, and admin organization preview. Do not run `--update-snapshots`, commit baseline PNGs, push, or deploy until the user explicitly approves the visual draft.

- [ ] **Step 8: After approval, record baselines and run GREEN**

Run:

```bash
npx playwright test tests/e2e/design-system-catalog.spec.js tests/e2e/home-hero-parity.spec.js tests/e2e/public-home.spec.js --grep "reviewed responsive baseline" --update-snapshots
npx playwright test --config=playwright.organization.config.js tests/e2e/organization-directory-public.spec.js tests/e2e/organization-directory-admin.spec.js --grep "reviewed responsive baseline" --update-snapshots
npm run test:e2e:design-system
npm run test:e2e:public
npm run test:e2e:organization
```

Expected: all three projects pass for every reviewed surface and snapshot filenames contain no OS suffix. This standardizes naming; it does not claim pixel-identical rendering across operating systems. Record the Playwright/Chromium version and host OS used to approve the baselines in the completion report.

- [ ] **Step 9: Verify the built Preview boundary and mutation guard**

Run separately:

```bash
VERCEL_ENV=preview npm run build
FOREST_BUILT_PREVIEW=true npm run test:e2e:built
```

Expected: Preview build exits 0; the catalog route and marker remain absent; the built admin disables organization save and records zero PUT requests.

- [ ] **Step 10: Commit Task 8**

```bash
git add playwright.config.js playwright.built.config.js package.json package-lock.json tests/e2e/design-system-catalog.spec.js tests/e2e/design-system-production-boundary.spec.js tests/e2e/home-hero-parity.spec.js tests/e2e/public-home.spec.js tests/e2e/organization-directory-public.spec.js tests/e2e/organization-directory-admin.spec.js tests/e2e/home-hero-parity.spec.js-snapshots tests/e2e/public-home.spec.js-snapshots tests/e2e/design-system-catalog.spec.js-snapshots tests/e2e/organization-directory-public.spec.js-snapshots tests/e2e/organization-directory-admin.spec.js-snapshots
git commit -m "test: guard Forest design system boundaries"
```

---

### Task 9: Run the completion gate and synchronize product truth

**Files:**
- Modify if required by sync: `/Users/park/Desktop/project/prd/forest/requirements.md`
- Do not modify unless endpoint/schema changed: `/Users/park/Desktop/project/prd/forest/api-spec.md`
- Modify: `docs/superpowers/specs/2026-07-22-forest-design-system-foundation-design.md`

**Interfaces:**
- Consumes: every prior task
- Produces: verified foundation/pilot, explicit remaining migration scope, synchronized Forest requirements

- [ ] **Step 1: Run all unit and focused E2E suites**

Run each command separately:

```bash
npm run test:unit
npm run test:e2e:design-system
npm run test:e2e:public
npm run test:e2e:organization
npm run test:e2e:organization:preview
```

Expected: all commands exit 0. Record current pass/skip counts from this run.

- [ ] **Step 2: Run static and built-artifact gates**

Run each command separately:

```bash
npm run lint
npm run build
npm run test:e2e:built
VERCEL_ENV=preview npm run build
FOREST_BUILT_PREVIEW=true npm run test:e2e:built
npm run build
git diff --check
```

Expected: every command exits 0; the final `dist` is a normal production build; no whitespace errors.

- [ ] **Step 3: Audit imports and deferred scope**

Run:

```bash
rg -n "HomeBannerHero|PublicHomeHero|autoSlideSeconds|sideImageUrl|titleColor|badgeTextColor" src tests/e2e
rg -n "from ['\"](?:\.\./)*components/(?:ui/ActionLink|ui/SectionHeading|AsyncState)|from ['\"](?:\.\./)*hooks/useFocusTrap" src
rg -n "(?:green|blue|red|amber|gray)-|text-xs|min-h-1[01]" src/components/admin/organization/OrganizationDirectoryEditor.jsx src/components/admin/organization/OrganizationPeopleDirectory.jsx src/components/admin/organization/OrganizationMembershipEditor.jsx src/components/organization/LegacyOrganizationDirectory.jsx
git status --short
```

Expected:

- no imports of the deleted Hero renderers;
- `autoSlideSeconds` and legacy fields appear only in compatibility model/tests or API fixture, not admin controls/public renderer;
- old shared paths remain only as compatibility imports backed by re-exports;
- the remaining organization raw utilities are reported as explicit follow-up scope rather than counted as migrated;
- only intended documentation/PRD changes remain uncommitted.

- [ ] **Step 4: Invoke `source-command-prd-sync` once for this code change**

Run the `source-command-prd-sync` skill from `/Users/park/Desktop/project`. Synchronize `prd/forest/requirements.md` so it states:

- public Hero never auto-advances;
- admin edits only content, CTA, and background image that the public renderer supports;
- admin blocks editing/saving after a Home Banner load failure and rejects blank visible fields before save;
- legacy color/side-card/auto-slide fields remain API-compatible but are not active public customization controls;
- public and admin preview share one renderer;
- design system is maintained inside the Forest frontend repository.

Do not change `prd/forest/api-spec.md` unless the implementation actually changed an endpoint, request field, response field, authentication rule, or status code. This plan intentionally makes no API contract change.

- [ ] **Step 5: Mark the implementation state and document deferred work**

In `docs/superpowers/specs/2026-07-22-forest-design-system-foundation-design.md`, change status to:

```markdown
- 상태: 기반·배너/조직도 대표 파일럿 구현 및 검증 완료, 조직도 나머지 및 전체 레거시 전환 대기
```

Keep the approved scope honest by changing the second bullet under “3단계: 파일럿” from the whole-organization wording to:

```markdown
- 구조화 공개 디렉터리와 관리자 그룹 트리·폼, 미리보기·저장확인 대화상자를 대표 파일럿으로 전환
```

In “13. 완료 기준”, replace the broad organization bullet with:

```markdown
- 배너와 구조화 공개 디렉터리·관리자 그룹 편집/대화상자 대표 범위가 새 토큰·컴포넌트의 파일럿으로 전환됐다.
```

In “10.3 시각 회귀”, annotate the “프로그램·게시글 관리자 대표 화면” bullet as “4단계 전환 시 추가” so it is not reported as part of this pilot's completed visual gate.

Under “다음 단계”, record these separate follow-up plans in order:

1. 조직도 인물·구성원 편집, legacy directory, 관리자 편집기 헤더/상태
2. 프로그램 상태·폼·ResponsiveDataView
3. 게시글·공지 작성/수정과 AccessibleDialog/FormField
4. 사용자·후원·카테고리 관리자 모바일 데이터뷰
5. 공개 Programs/Intro/News/Resources PageSubnav
6. stale CSS와 raw utility 예외 목록 정리

- [ ] **Step 6: Commit completion documentation in the frontend worktree**

```bash
git add docs/superpowers/specs/2026-07-22-forest-design-system-foundation-design.md
git commit -m "docs: record Forest design system pilot"
```

The PRD directory is not a Git repository under this workspace. Report the exact PRD files changed by the sync separately; do not claim they are included in the frontend commit.

- [ ] **Step 7: Final local-state report**

Run:

```bash
git status --short
git log --oneline --decorate -12
git rev-list --count @{upstream}..HEAD
```

Expected: frontend worktree is clean; local commits are ahead of the remote preview branch. Report that nothing has been pushed or deployed, and request explicit approval before either action.
