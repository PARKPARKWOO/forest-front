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
