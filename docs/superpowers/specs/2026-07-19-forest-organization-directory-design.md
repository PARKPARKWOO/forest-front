# Forest C형 조직도·관리자 편집 설계

- 작성일: 2026-07-19
- 상태: 사용자 UI·기능 범위 승인 완료, 구현 전 명세
- 대상 저장소: `forest/`, `cms-react-project/`
- 공개 경로: `/intro/people`
- 배포 순서: 백엔드 선배포 → 프론트 별도 브랜치 Vercel Preview → 사용자 확인
- 운영 정책: 구현·검증 완료 후 실제 배포 직전에 다시 확인하며, 프론트 운영 배포는 Preview 승인 전 실행하지 않는다.

## 1. 배경과 현재 사실

현재 `함께하는이들` 페이지는 두 가지 소스를 사용한다.

1. `intro-people` 정적 콘텐츠가 있으면 HTML을 sanitize하여 페이지 전체를 대신 렌더링한다.
2. 정적 콘텐츠가 없으면 `src/pages/static/Intro.jsx`의 하드코딩 조직도와 명단을 렌더링한다.

관리자는 `AdminDashboard`의 범용 Quill 편집기로 `intro-people` HTML을 수정한다. 이 방식은 조직 관계, 인물 재사용, 표시 순서, 공개 여부를 구조적으로 검증할 수 없으며 HTML이 조금이라도 저장되면 코드 기반 조직도 전체가 사라진다.

2026-07-19 읽기 전용 운영 확인에서 `GET https://forest.platformholder.site/api/v1/static-content/intro-people`은 HTTP 200과 `{ "data": null, "success": true }`를 반환했다. 따라서 현재 확인 시점에는 보존하거나 자동 변환해야 할 운영 HTML이 없다. 다만 백엔드 선배포와 프론트 전환 사이에도 기존 관리자가 이 값을 저장할 수 있으므로, 한 번의 사전 확인 결과에 의존하지 않고 런타임 fallback 규칙으로 기존 HTML을 보존한다.

## 2. 승인된 결정

- 공개 UI는 사용자가 선택한 C형 `조직 목록 · 인명 통합형`을 사용한다.
- 관리자는 그룹 추가·삭제, 상하관계, 표시 순서, 공개 여부까지 수정할 수 있다.
- 인물과 그룹 소속을 분리하여 한 인물이 여러 그룹에서 서로 다른 직책을 가질 수 있다.
- 조직 편집 권한은 기존 소개글 관리와 동일하게 `ROLE_ADMIN` 또는 Forest 최고관리자에게 제공한다.
- 기존 `intro-people` HTML과 기존 프론트 fallback은 롤백을 위해 보존한다.
- 아직 구조 데이터가 저장되지 않은 `configured: false` 상태에서는 의미 있는 기존 `intro-people` HTML을 C형 기본 snapshot보다 우선한다.
- 백엔드는 기존 프론트에 영향을 주지 않는 추가형 API로 먼저 배포한다.
- 프론트는 별도 브랜치 Vercel Preview에서 확인하며 Preview에서는 운영 조직 데이터를 저장할 수 없게 한다.

## 3. 목표와 비목표

### 목표

1. 50~60대 사용자가 조직을 선택하고 구성원·직책·소속을 빠르게 읽게 한다.
2. 390px 모바일과 200% 확대에서도 가로 스크롤 없이 같은 정보를 제공한다.
3. 관리자가 HTML을 다루지 않고 조직·인물·소속 관계를 안전하게 편집하게 한다.
4. 순환 계층, 유실된 참조, 중복 ID, 동시 저장 덮어쓰기를 서버에서 차단한다.
5. 백엔드 선배포와 프론트 롤백이 공개 서비스에 영향을 주지 않게 한다.
6. 기존 하드코딩 명단을 초기 기본 구조로 제공하되, GET만으로 운영 DB를 변경하지 않는다.

### 비목표

- 조직도 색상, 글꼴, 임의 HTML·CSS를 관리자가 편집하게 하지 않는다.
- 인사평가, 연락처, 이메일 등 비공개 인사정보를 저장하지 않는다.
- 드래그앤드롭만으로 순서를 바꾸는 UI를 만들지 않는다.
- 기존 `intro-people` HTML을 자동 파싱해 조직 데이터로 변환하지 않는다.
- Vercel Preview에서 운영 조직 데이터를 생성·수정·삭제하지 않는다.
- Preview 승인만으로 프론트 운영 배포까지 자동 진행하지 않는다.

## 4. 공개 C형 조직도

### 4.1 데스크톱

- 왼쪽에 공개 그룹 목록, 오른쪽에 선택한 그룹의 설명과 구성원 목록을 둔다.
- 그룹 버튼은 최소 48px 높이, 본문과 핵심 레이블은 18px 이상을 유지한다.
- 현재 그룹은 색뿐 아니라 굵은 왼쪽 표시선과 `aria-current="true"`로 구분한다.
- 자식 그룹은 한 단계 들여쓰되, 깊이가 늘어나도 텍스트가 지나치게 좁아지지 않게 최대 한 단계만 시각적으로 들여쓴다.
- 오른쪽 구성원 행은 이름·직책과 소속을 분리해 읽을 수 있게 한다.
- 구성원 수는 공개 응답에 남은 실제 membership 수로 계산하며 추측하지 않는다.
- 첫 진입 시 정렬된 첫 번째 공개 그룹을 선택한다.

### 4.2 모바일과 확대

- 390px에서는 그룹 버튼을 두 열로 배치하고 긴 이름은 줄바꿈한다.
- 320px 이하에서는 그룹 버튼을 한 열로 전환한다.
- 선택한 그룹의 구성원은 항상 한 열 목록이다.
- 데스크톱 200% 확대에서 그룹 목록과 상세를 세로로 쌓는다.
- 내부 가로 스크롤과 고정 폭을 사용하지 않는다.

### 4.3 탐색과 접근성

- 그룹 선택은 실제 `<button type="button">`을 사용한다.
- URL의 `group` 쿼리에 stable group ID를 기록해 새로고침과 뒤로가기를 보존한다.
- 존재하지 않거나 비공개인 `group` 값은 첫 공개 그룹으로 교정한다.
- DOM 순서는 그룹 탐색 다음 상세 영역이며, 선택 후 상세 제목에 프로그램 방식의 강제 포커스 이동은 하지 않는다. 선택 결과는 `aria-live="polite"` 상태 문구로 알린다.
- 빈 공개 그룹은 `등록된 공개 구성원이 없습니다`를 표시한다.
- 전체 공개 그룹이 없으면 `현재 공개된 조직 정보가 없습니다`를 표시한다.
- 로딩, API 오류, 재시도를 `AsyncState` 패턴으로 구분한다.

## 5. 관리자 조직도 편집기

### 5.1 진입과 화면 구조

- `소개글 관리 → 함께하는이들 → 조직도 관리`에서 진입한다.
- 복잡한 편집을 기존 Quill 모달 안에 추가하지 않고 별도 `OrganizationDirectoryEditor` 패널로 분리한다.
- 관리자 URL은 `/admin?section=intro&item=people`로 복원 가능하게 한다.
- 왼쪽은 그룹 트리, 오른쪽은 선택한 그룹의 필드와 membership 목록이다.
- `인물 명부` 보조 화면에서 이름·소속·공개 여부와 연결된 그룹을 확인한다.

### 5.2 그룹 편집

관리자는 다음 값을 편집한다.

- 그룹 이름
- 공개 설명
- 상위 그룹
- 같은 상위 그룹 안의 표시 순서
- 공개 여부

그룹 추가 시 클라이언트가 UUID v4 ID를 생성한다. 상위 그룹 선택 목록에서는 자기 자신과 모든 하위 그룹을 제외한다. 순서는 드래그앤드롭 대신 `위로`, `아래로` 버튼으로 변경한다.

그룹 삭제는 다음 조건에서만 허용한다.

- 하위 그룹이 없다.
- membership이 없다.

조건을 만족하지 않으면 어떤 항목을 먼저 이동하거나 제거해야 하는지 설명한다. 공개 중단만 필요할 때는 삭제 대신 `비공개`를 사용할 수 있다.

### 5.3 인물과 소속관계 편집

인물은 다음 값을 가진다.

- 이름
- 소속
- 공개 여부

membership은 인물과 그룹을 연결하며 다음 값을 가진다.

- 그룹별 직책 문구
- 그룹별 소속 표시 방식: 기본 소속 상속, 숨김, 별도 문구
- 그룹 안 표시 순서

`구성원 추가`는 기존 인물 선택과 새 인물 등록을 모두 제공한다. 같은 인물이 여러 그룹에 연결될 수 있지만 같은 그룹·인물 조합은 한 번만 허용한다. `affiliationOverride`는 `null`이면 인물의 기본 소속을 상속하고, 빈 문자열이면 해당 그룹에서 소속을 명시적으로 숨기며, 공백이 아닌 문자열이면 그 문구를 표시한다. 관리 UI는 이를 `기본 소속 사용 / 소속 숨김 / 다른 소속 입력` 라디오 그룹으로 제공한다. 이를 통해 현재 명단처럼 한 인물이 그룹마다 소속이 다르거나 특정 그룹에서 소속을 표시하지 않는 경우도 손실 없이 보존한다. 인물 삭제는 membership이 남아 있으면 차단하고, 연결된 그룹을 먼저 보여준다.

### 5.4 미리보기와 저장

- 편집 중 데이터는 서버에 자동 저장하지 않는다.
- `미리보기`는 저장 전 draft를 실제 공개 `OrganizationDirectory` 컴포넌트로 렌더링한다.
- `변경사항 저장` 한 번이 전체 snapshot PUT 한 건을 보낸다.
- 저장 중 버튼을 비활성화하고 중복 요청을 차단한다.
- 성공하면 새 revision과 updatedAt을 반영하고 관리자·공개 쿼리를 무효화한다.
- 저장하지 않은 변경이 있으면 다른 관리자 메뉴 이동, 브라우저 이탈, 편집기 닫기 전에 확인한다.
- Vercel이 제공하는 `VERCEL_ENV=preview`를 빌드 시 명시적 상수로 주입한다. Preview 빌드에서는 저장 버튼과 프론트 organization service의 PUT 호출을 모두 비활성화해 애플리케이션 UI에서 운영 mutation을 전송하지 않는다. 백엔드 관리 API의 권한 자체는 Preview와 무관하게 유지된다. 로컬 draft도 기본적으로 read-only이며 E2E fixture가 명시적으로 허용한 경우에만 mock PUT을 사용한다.

### 5.5 동시 수정 충돌

- 관리 GET은 정수 revision을 반환한다.
- PUT은 읽었던 revision을 반드시 포함한다.
- 다른 관리자가 먼저 저장해 revision이 달라지면 서버는 HTTP 409와 `ORGANIZATION_REVISION_CONFLICT`를 반환한다.
- 클라이언트는 자동 재시도나 강제 덮어쓰기를 하지 않는다.
- 로컬 draft를 유지한 채 `다른 관리자가 먼저 저장했습니다`와 `최신 내용 불러오기`를 제공한다.
- 최신 내용을 불러오기 전에는 저장을 다시 활성화하지 않는다.

## 6. 데이터 모델

관리 API 응답은 정규화된 snapshot을 사용한다. 관리 PUT 요청은 응답에서 서버 파생값인 `configured`, `updatedAt`, `legacyContentDrift`를 제외하고 동시성 기준인 `revision`, `legacyContentFingerprint`와 `schemaVersion`, `groups`, `people`, `memberships`를 포함한다. Mongo 문서는 API의 `configured` 대신 문서 존재 여부를 사용한다.

```json
{
  "schemaVersion": 1,
  "configured": true,
  "revision": 3,
  "legacyContentDrift": false,
  "legacyContentFingerprint": "sha256:1cae417042e0935f824a69a2b480a8b3374583781e371fdd0665de51c81eb2b7",
  "groups": [
    {
      "id": "4b0461ad-8f91-4c66-9f65-89df7c2bef31",
      "name": "이사회",
      "description": "단체의 주요 의사결정을 담당합니다.",
      "parentGroupId": null,
      "displayOrder": 20,
      "enabled": true
    }
  ],
  "people": [
    {
      "id": "f42db191-63dd-4ba2-ae3b-c2bf858ad2ae",
      "name": "홍길동",
      "affiliation": "소속",
      "enabled": true
    }
  ],
  "memberships": [
    {
      "id": "08d5885c-d92f-40cf-8f8d-bdbba68a7849",
      "groupId": "4b0461ad-8f91-4c66-9f65-89df7c2bef31",
      "personId": "f42db191-63dd-4ba2-ae3b-c2bf858ad2ae",
      "roleLabel": "이사",
      "affiliationOverride": null,
      "displayOrder": 10
    }
  ],
  "updatedAt": "2026-07-19T12:00:00+09:00"
}
```

예시 fingerprint는 `intro-people` 문서가 없거나 content가 null일 때 사용하는 domain-separated sentinel의 실제 SHA-256 값이다. `legacyContentFingerprint`는 관리 응답에만 포함된다.

### 6.1 제한

- 그룹 최대 100개
- 인물 최대 500명
- membership 최대 2,000개
- 계층 최대 깊이 8
- 이름: trim 후 1~100자
- 그룹 설명: 0~300자
- 소속: 0~200자
- 그룹별 소속 덮어쓰기: null, 빈 문자열, 또는 trim 후 1~200자
- 직책: 0~100자
- 모든 ID: UUID v4
- 같은 sibling 안의 displayOrder는 서버가 10 단위로 다시 정규화한다.
- 같은 그룹 안의 membership displayOrder도 서버가 10 단위로 다시 정규화한다.
- 모든 텍스트는 plain text이며 HTML을 허용하지 않는다.
- 지원하는 schemaVersion은 1이며 다른 값은 저장을 거부한다.

### 6.2 불변조건

- group, person, membership ID는 snapshot 안에서 각각 유일하다.
- parentGroupId는 존재하는 다른 그룹을 가리키거나 null이다.
- 그룹 계층에는 자기참조와 순환이 없다.
- membership의 groupId와 personId는 모두 존재한다.
- 같은 groupId·personId 조합은 중복될 수 없다.
- 공개 membership의 소속은 `affiliationOverride == null`이면 연결된 person의 `affiliation`, `affiliationOverride == ""`이면 미표시, 그 외에는 trim한 override를 사용한다. 공백만 있는 override는 저장을 거부한다.
- 인물 이름은 고유 키가 아니며 동명이인을 허용한다. 동일 인물 여부는 UUID로만 판정하고 이름이 같다는 이유로 자동 병합하지 않는다.
- 공개 응답에는 enabled 그룹과 enabled 인물에 연결된 membership만 포함한다.
- 공개 people 배열에는 최종 공개 membership에서 실제로 참조하는 인물만 포함한다.
- 비공개 부모 아래의 자식 그룹은 자식이 enabled여도 공개 응답에서 제외한다.

## 7. 저장소와 호환성

### 7.1 Mongo 저장

- 조직 구조는 범용 `static_content`와 분리한 전용 Mongo 컬렉션 `organization_directory`에 저장한다.
- 전용 문서는 고정 ID `public` 한 건이며 schemaVersion, revision, groups, people, memberships, legacyContentFingerprintAtSave, createdAt, updatedAt을 typed field로 가진다.
- `configured`는 저장 필드가 아니라 `public` 문서의 존재 여부에서 파생한다.
- 기존 백엔드로 롤백해도 이 컬렉션을 읽는 controller나 repository가 없으므로 비공개 항목을 포함한 raw 구조가 범용 공개 API에 노출되지 않는다.
- 수정은 MongoTemplate의 `_id + revision` 조건부 갱신과 revision 증가를 한 연산으로 수행한다. 일치하는 문서가 없으면 409로 처리한다.
- 최초 저장 요청은 `revision: 0`만 허용하고 `revision: 1` 문서를 insert한다. 동시 최초 insert의 duplicate-key 충돌도 409로 변환한다.
- 기존 `StaticContent` 저장 형식과 공개 GET 계약은 변경하지 않는다. 관리 PUT은 `intro-people`에 한해 organization 문서가 이미 존재하면 409를 반환하고, 그 외 키와 아직 `configured: false`인 경우에는 기존 동작을 유지한다.

### 7.2 초기 기본 데이터

- 현재 `Intro.jsx` 하드코딩 명단을 사람이 대조한 versioned backend resource `organization/default-directory-v1.json`으로 옮긴다.
- 그룹·인물·membership에는 한 번 정한 stable UUID v4를 사용하며 런타임 HTML/JSX 파싱으로 ID나 관계를 생성하지 않는다.
- resource는 애플리케이션 시작 시 한 번 로드해 동일한 서버 validation을 통과해야 하며, 실패하면 잘못된 기본 데이터를 제공하지 않고 시작을 실패시킨다. 계약 테스트에서 ID 유일성, 참조 무결성, 표시 문구와 현재 명단의 대응을 검증한다.
- 저장 문서가 없으면 organization API는 이 immutable 기본 snapshot을 `configured: false`, `revision: 0`, `updatedAt: null`로 반환한다.
- 이때 공개 응답의 `legacyContentDrift`는 기준 문서가 아직 없으므로 false이며, 관리 응답은 현재 legacy 원문에서 계산한 fingerprint를 별도로 제공한다.
- GET은 기본 snapshot을 DB에 자동 저장하지 않는다.
- 초기 그룹은 공동대표, 이사회, 감사, 운영위원회, 네 개 분과, 사무국이다.
- 네 개 분과만 운영위원회의 자식으로 시작하고 나머지 그룹은 root로 시작한다. 관리자가 승인된 UI에서 관계를 바꿀 수 있다.

### 7.3 legacy 우선순위와 fallback

- 서버는 현재 `intro-people` 원문을 domain-separated SHA-256으로 fingerprint한다. 문서 부재·null은 `forest:intro-people:absent:v1`, 값이 있으면 `forest:intro-people:content:v1\0` 뒤에 raw UTF-8 content를 붙인 바이트를 해시한다. title이나 sanitize 결과는 fingerprint에 포함하지 않는다.
- 관리 GET은 현재 `legacyContentFingerprint`와 저장 기준 대비 `legacyContentDrift`를 반환한다. organization PUT은 첫 저장과 이후 저장 모두 GET에서 읽은 fingerprint를 요구하고, 서버가 저장 직전에 다시 계산한 값과 다르면 409 `ORGANIZATION_LEGACY_CONTENT_CONFLICT`로 거부한다.
- 성공한 organization 저장은 검증한 fingerprint를 `legacyContentFingerprintAtSave`로 함께 기록한다. 공개·관리 GET은 현재 fingerprint가 저장 기준과 다르면 `legacyContentDrift: true`를 반환한다. fingerprint 검증 직후 발생한 legacy 저장 경쟁도 다음 GET에서 drift로 감지하므로 조용히 숨기지 않는다.
- organization API가 `configured: true`, `legacyContentDrift: false`를 반환하면 구조 데이터가 관리자의 명시적 저장을 거친 상태이므로 C형 UI를 렌더링한다.
- organization API가 `configured: true`, `legacyContentDrift: true`를 반환하면 의미 있는 legacy HTML을 C형보다 우선해 표시한다. legacy가 빈 값이면 C형을 유지하되 관리 화면에는 drift 경고를 표시한다.
- organization API가 `configured: false`를 반환하면 기존 `intro-people`도 조회한다. sanitize 후 의미 있는 legacy HTML이 있으면 그 HTML을 우선 렌더링하고, null·빈 문자열·내용 없는 마크업이면 API의 C형 기본 snapshot을 렌더링한다.
- 의미 있는 legacy HTML은 기존 sanitizer를 통과한 DOM에 공백이 아닌 텍스트 또는 유효한 `src`를 가진 허용 이미지가 하나 이상 있는 경우로 판정한다. `<p><br></p>` 같은 편집기 빈 마크업은 빈 값으로 본다.
- organization API가 404이면 구버전 백엔드로 판단해 legacy HTML, 그다음 기존 하드코딩 JSX 순으로 fallback한다.
- organization API가 500 또는 네트워크 오류이고 의미 있는 legacy HTML이 있으면 legacy HTML을 표시한다. legacy도 없으면 오류와 재시도를 표시하며 하드코딩 데이터를 최신 정보처럼 대신 표시하지 않는다.
- 관리 화면에서 `configured: false`이면서 의미 있는 legacy HTML이 감지되면 `현재 공개 화면은 기존 소개글을 사용 중입니다` 경고를 지속 표시한다. 첫 구조 저장은 C형 UI가 legacy HTML을 대체한다는 별도 확인을 거쳐야 하며 legacy 값 자체는 삭제하지 않는다.
- `configured: true`의 drift 경고에서는 현재 legacy 내용을 다시 확인한 뒤 `기존 소개글 변경을 확인하고 C형 구조 사용`을 명시적으로 선택해야 다음 organization 저장이 새 fingerprint를 기준으로 받아들인다.
- organization 설정 후 신버전 backend의 기존 `intro-people` 관리 PUT은 409 `ORGANIZATION_DIRECTORY_ALREADY_CONFIGURED`로 차단한다. 설정 직전 시작된 요청, 구버전 롤백 중 저장, 재배포 사이의 변경은 fingerprint drift가 안전망으로 남는다.
- 프론트 운영 반영 직전에 organization configured·drift 상태와 `intro-people`을 다시 조회해 실제 전환 상태를 기록한다. 위 검증·차단·drift 우선순위 때문에 의미 있는 legacy HTML이 경고 없이 영구적으로 숨겨지지 않는다.

### 7.4 손상 데이터 처리

- 저장 문서가 schemaVersion 또는 불변조건을 만족하지 않으면 공개 API는 비공개 항목을 추측해 필터링하지 않고 fail-closed 500을 반환한다.
- 관리 API도 같은 문서를 편집 가능한 정상 데이터로 위장하지 않고 500과 운영 로그 식별자를 반환한다.
- 복구는 DB 백업 또는 검증된 관리자 snapshot의 명시적 저장으로 수행하며, 기본 snapshot으로 자동 교체하지 않는다.

## 8. API 계약

모든 응답은 기존 `SucceededApiResponseBody` envelope의 `data` 안에 아래 payload를 넣는다.

### 8.1 공개 조회

`GET /api/v1/organization`

- `@PublicEndPoint`
- 인증 불필요
- 공개 가능한 그룹·인물·membership만 필터링하고 정렬해서 반환
- 저장 문서가 없으면 `configured: false` 기본 snapshot 반환
- 저장 문서가 있으면 현재 legacy fingerprint와 저장 기준을 비교한 `legacyContentDrift` 반환; fingerprint 자체는 공개하지 않음

### 8.2 관리 조회

`GET /api/v1/organization/manage`

- `@AuthenticationUser`
- `ROLE_ADMIN` 또는 Forest 최고관리자만 허용
- 비공개 항목과 revision을 포함한 전체 snapshot 반환
- 저장 문서가 없으면 `configured: false`, `revision: 0` 기본 snapshot 반환
- 현재 `legacyContentFingerprint`와 `legacyContentDrift` 포함

### 8.3 관리 저장

`PUT /api/v1/organization/manage`

- `@AuthenticationUser`
- `ROLE_ADMIN` 또는 Forest 최고관리자만 허용
- body에 schemaVersion, revision, legacyContentFingerprint, groups, people, memberships 필수
- snapshot 전체 검증 후 조건부 원자 저장
- 서버의 최신 legacy fingerprint가 요청값과 다르면 저장하지 않음
- 성공 시 증가한 revision을 포함한 전체 관리 snapshot 반환

### 8.4 오류

- 400 `INVALID_ORGANIZATION_STRUCTURE`: 필드 제한, 순환, 중복, 유실 참조 위반
- 403: 현재 Forest 인증 계약에 따라 Passport가 없거나 유효하지 않거나 관리 권한이 없음
- 409 `ORGANIZATION_REVISION_CONFLICT`: 동시 수정 충돌
- 409 `ORGANIZATION_LEGACY_CONTENT_CONFLICT`: organization을 읽은 뒤 기존 `intro-people`이 변경됨
- 409 `ORGANIZATION_DIRECTORY_ALREADY_CONFIGURED`: 구조 전환 후 기존 static-content 관리 PUT으로 `intro-people` 변경 시도
- 500: 예상하지 못한 저장·직렬화 오류 또는 손상된 저장 문서

이번 기능은 공통 인증 상태 코드를 401/403으로 재분류하지 않는다. 400 응답은 기존 실패 envelope의 code와 message만 사용하며 공통 응답 스키마에 조직 기능 전용 field-error 구조를 추가하지 않는다.

## 9. 보안

- 공개 GET만 `@PublicEndPoint`를 사용한다.
- 관리 GET·PUT Passport 파라미터에는 `@AuthenticationUser`를 사용한다.
- 서비스는 `AccessControlService.onlyAdmin`과 동일한 `ROLE_ADMIN || accessLevel == Int.MAX_VALUE` 검사를 수행한다.
- 비공개 필터링은 프론트가 아니라 백엔드에서 수행한다.
- 관리 PUT의 모든 텍스트는 plain text로 검증하며 HTML을 저장하지 않는다.
- 조직 문서는 전용 컬렉션에만 저장하고 해당 컬렉션을 raw로 공개하는 범용 endpoint를 만들지 않는다.
- C형 구조 설정 후 기존 `intro-people` 관리 PUT을 차단하고, 저장 경쟁·롤백 중 변경은 fingerprint drift로 탐지한다.
- 브라우저 관리 요청은 Gateway의 Origin/Referer CSRF 검사를 그대로 통과해야 한다.
- Gateway가 외부 Passport 헤더를 제거하고 검증된 헤더를 다시 주입하는 경로만 운영에 사용한다.
- Forest 서비스 포트를 Gateway 밖에 직접 노출하지 않는다.

## 10. 프론트 컴포넌트 경계

### 서비스와 모델

- `services/organizationDirectoryService.js`: 공개 GET, 관리 GET·PUT과 payload 경계 검증
- `utils/organizationDirectory.js`: 정렬, 트리 생성, cycle 사전 검증, 기본 선택 계산
- `fixtures/organizationDirectory.js`: draft/E2E 전용 합성 데이터. 운영 명단의 사실 기준은 backend의 versioned resource 한 곳에만 둔다.

### 공개

- `components/organization/OrganizationDirectory.jsx`: C형 그룹 탐색과 선택 상태
- `components/organization/OrganizationMemberList.jsx`: 구성원 행과 빈 상태
- `pages/static/Intro.jsx`: people 분기의 데이터 조회, legacy fallback, 오류 처리만 담당

### 관리자

- `components/admin/organization/OrganizationDirectoryEditor.jsx`: draft와 저장 상태 조정
- `OrganizationGroupTree.jsx`: 그룹 선택·추가·이동·공개 상태
- `OrganizationGroupForm.jsx`: 그룹 필드와 parent 선택
- `OrganizationMembershipEditor.jsx`: 기존 인물 연결, 직책, 소속 상속·숨김·별도 문구, 순서, 제외
- `OrganizationPeopleDirectory.jsx`: 인물 추가·수정·비공개·삭제
- `OrganizationDirectoryPreview.jsx`: 공개 컴포넌트에 unsaved draft 전달

`AdminDashboard.jsx`에는 진입 분기와 query invalidation만 남기고 조직 편집 상태를 추가하지 않는다.

## 11. 오류와 상태 처리

### 공개

- 로딩: 조직도 영역 skeleton 또는 명시적 로딩 문구
- API 성공 + `configured: true`, drift 없음: C형 UI
- API 성공 + `configured: true`, drift 있음: 의미 있는 legacy HTML이 있으면 legacy, 없으면 C형 UI
- API 성공 + `configured: false`: 의미 있는 legacy HTML이 있으면 legacy, 없으면 C형 기본 snapshot
- API 404: legacy HTML → 하드코딩 JSX fallback
- API 500/네트워크 오류: 의미 있는 legacy HTML이 있으면 legacy를 표시하고, 없으면 오류 메시지와 `다시 시도`; 하드코딩 조직정보를 최신처럼 위장하지 않는다.
- 빈 구성: 설명 가능한 빈 상태

### 관리자

- GET 실패: 편집기 대신 오류와 재시도
- 클라이언트 validation 실패: 서버와 동일한 공개된 제약을 검사해 관련 필드와 구조 항목에 오류를 표시하고 첫 오류로 포커스 이동
- 서버 400: 공통 오류 message를 편집기 상단 alert에 표시하고 local draft를 유지한다. 공통 envelope에 field path가 없으므로 특정 필드 오류라고 추측하지 않고 alert로 포커스를 이동한다.
- 403: 로그인 또는 관리 권한을 확인하라는 안내, local draft 유지
- revision 409: 다른 관리자 충돌 안내, local draft 유지, 최신 구조를 불러오기 전 저장 차단
- legacy fingerprint 409: 기존 소개글이 방금 변경됐음을 알리고 local draft를 유지한다. 최신 legacy 상태를 불러와 의미 있는 내용이면 전환 확인을 다시 받기 전 저장을 차단한다.
- configured 이후 기존 Quill 저장 409: 조직도 관리 화면을 사용하라는 안내
- 500: 저장 실패 안내, local draft 유지, 명시적 재시도
- 저장 성공: revision 갱신, dirty 상태 해제, 성공 상태 문구

## 12. 테스트 설계

### 12.1 백엔드

- 기본 snapshot 반환과 DB 무변경
- 공개 GET의 비공개 그룹·인물·하위 그룹 필터링
- 그룹과 구성원 정렬
- 동일 인물의 복수 membership과 서로 다른 직책
- membership 소속의 null=기본 상속, 빈 문자열=숨김, 문구=override 3상태
- 빈 이름, 길이 제한, 중복 UUID, 중복 membership 거부
- 존재하지 않는 parent/group/person 참조 거부
- 자기참조, 간접 순환, 깊이 8 초과 거부
- 권한 없는 관리 GET·PUT 403
- ROLE_ADMIN과 Forest 최고관리자 성공
- revision 조건부 갱신과 동시 PUT 409
- 모든 organization PUT의 legacy fingerprint 일치 검증과 불일치 409
- fingerprint 검증 직후 legacy 저장 경쟁을 다음 GET의 drift로 탐지
- configured 이후 `intro-people` static-content PUT 409와 다른 static-content 키 무회귀
- 전용 collection 저장, 다른 static-content 키 무회귀, `intro-people`은 configured 전 기존 동작·후 409 계약
- 구버전 백엔드로 롤백해도 전용 collection raw 데이터에 공개 경로가 생기지 않음
- versioned 기본 resource의 stable UUID, 현재 명단 대응, 참조 무결성
- 직렬화 실패와 손상 문서의 fail-closed 처리
- Controller envelope와 오류 코드 계약 테스트

### 12.2 프론트 공개 E2E

- 1440px, 768px, 390px 프로젝트
- 200% 확대 reflow와 가로 overflow 없음
- 그룹 선택, URL query 보존, 새로고침 복원
- 긴 그룹명·이름·소속 줄바꿈
- 공개 구성원 없음과 전체 공개 그룹 없음
- `configured: false`에서 legacy HTML 우선 및 legacy가 없을 때 C형 기본 snapshot
- `configured: true`에서 남아 있는 legacy HTML보다 C형 구조 우선
- `configured: true`에서 legacy fingerprint drift가 생기면 의미 있는 legacy 우선, 빈 legacy면 C형 유지
- API 404 legacy → hardcoded fallback
- API 500에서 legacy가 있으면 legacy, 없으면 오류와 다시 시도
- 키보드 탐색, 포커스 표시, Axe 주요 위반 없음
- page error, request failure, 허용하지 않은 console error 없음

### 12.3 관리자 E2E

- 그룹 추가·수정·상위 변경·위/아래 이동·비공개
- 하위 그룹 또는 membership이 있는 그룹 삭제 차단
- 인물 추가·수정·복수 그룹 연결·직책별 수정
- membership 소속 상속·숨김·별도 문구 3상태 편집과 공개 미리보기
- 연결된 인물 삭제 차단
- 순환 parent 후보 UI 제외와 서버 400 표시
- unsaved 미리보기와 서버 미변경
- dirty 이탈 확인
- 저장 중 중복 클릭 한 건 보장
- 400, 403, revision 409, legacy fingerprint 409, 500에서 draft 유지
- 서버 400은 상단 alert, 클라이언트 validation은 필드 오류와 첫 오류 포커스
- legacy HTML이 활성화된 첫 저장의 교체 경고·확인과 legacy 원문 보존
- 관리 GET 이후 legacy가 바뀐 첫 저장 거부, 새 fingerprint 재조회, 전환 재확인
- configured 상태의 drift 경고와 새 fingerprint 승인 저장
- 저장 성공 후 revision과 공개 query 갱신
- Vercel Preview read-only 저장 차단
- 390px 관리자 카드/단일 열 레이아웃과 48px 조작 영역
- 모달이 필요한 보조 흐름의 focus trap, Escape, trigger focus 복귀

### 12.4 검증 명령과 수동 점검

- 백엔드 단위·통합 테스트와 `./gradlew build`
- 프론트 lint, build, 조직도 E2E, 기존 공개 홈 E2E
- `git diff --check`
- 로컬 draft 공개·관리자 캡처
- 실제 API는 로컬 또는 격리 DB에서 mutation E2E를 수행한다.
- 운영에서는 배포 후 공개 GET과 권한 없는 관리 GET 차단을 smoke test하며 테스트 데이터를 저장하지 않는다.

## 13. 배포와 롤백

### 13.1 백엔드 선배포

1. 백엔드 구현·테스트·코드 리뷰를 완료한다.
2. PRD API spec과 requirements를 구현 사실에 맞춰 동기화한다.
3. 실제 배포 직전에 사용자 확인을 받는다.
4. Forest 백엔드만 배포한다.
5. `GET /api/v1/organization`이 `configured: false` 기본 snapshot을 반환하는지 확인한다.
6. 인증 없는 `/organization/manage`가 차단되는지 확인한다.
7. 기존 공개 `/intro/people`이 이전 프론트에서 그대로 동작하는지 확인한다.
8. 아직 `configured: false`이므로 기존 `intro-people` 관리 PUT과 다른 static-content 조회·수정 계약이 그대로인지 회귀 확인한다. 운영 값은 변경하지 않는다.

백엔드 API는 추가형이며 기존 프론트가 호출하지 않으므로 이 단계에서 공개 UI는 바뀌지 않는다.

### 13.2 프론트 Vercel Preview

1. 프론트 구현·E2E·코드 리뷰를 완료한다.
2. 별도 브랜치만 push한다.
3. Vercel Preview가 선배포한 실제 공개 API를 읽게 한다.
4. `VERCEL_ENV=preview`에서는 저장 버튼과 organization service PUT을 모두 비활성화한다.
5. 공개 C형 조직도와 관리자 편집 화면을 사용자에게 보여준다.
6. 사용자가 Preview를 승인하기 전 main 병합과 프론트 운영 배포를 하지 않는다.

### 13.3 운영 전환

- 프론트 운영 반영 직전에 organization의 `configured`, `legacyContentDrift`, 관리 fingerprint와 `intro-people` 정적 콘텐츠를 다시 조회해 어느 소스가 공개될지 확인한다.
- `configured: false`에서 의미 있는 HTML이 생겼다면 새 프론트도 legacy HTML을 계속 공개한다. 이후 첫 구조 저장 시 관리자에게 C형 구조로 전환된다는 확인을 요구한다.
- 프론트 운영 배포는 별도 확인 후 진행한다.
- 최초 구조 저장 전에는 의미 있는 legacy HTML이 없을 때 API 기본 snapshot으로 C형 공개 UI가 동작한다.
- 관리자가 처음 저장하면 서버가 legacy fingerprint를 다시 검증한 뒤 `configured: true`, revision 1 문서를 생성한다. 이후 기존 Quill의 `intro-people` 저장은 차단된다.

### 13.4 롤백

- 프론트만 롤백하면 기존 HTML/hardcoded 조직도로 즉시 복귀하고 저장된 구조 JSON은 보존된다.
- 백엔드만 먼저 롤백해야 할 경우 신버전 프론트는 API 404에서 legacy fallback을 사용한다.
- 구버전 백엔드는 전용 `organization_directory` 컬렉션을 알지 못하므로 롤백 후에도 저장된 raw 구조를 범용 공개 endpoint로 노출하지 않는다.
- 구버전 롤백 중 `intro-people`이 바뀌면 신버전 백엔드 재배포 후 fingerprint drift로 감지하고, 관리자가 다시 확인하기 전까지 의미 있는 legacy HTML을 우선한다.
- 구조 데이터 자체를 되돌릴 필요가 있으면 배포 롤백과 분리해 명시적 관리자 저장 또는 DB 백업 복구로 처리하며 자동 삭제하지 않는다.

## 14. 완료 기준

- C형 공개 UI가 승인된 데스크톱·모바일 구조와 일치한다.
- 그룹·인물·membership 전체 편집이 관리자에서 동작한다.
- 동일 인물의 복수 그룹·복수 직책이 정확히 표현된다.
- 동일 인물의 그룹별 소속 상속·숨김·별도 표기가 손실 없이 표현된다.
- 모든 구조 불변조건과 revision 충돌이 서버에서 검증된다.
- 전용 Mongo 컬렉션을 사용해 현재·구버전 backend 모두에서 비공개 raw 구조가 범용 API로 노출되지 않는다.
- 기존 공개 화면과 `intro-people` fallback이 보존된다.
- legacy HTML의 첫 전환·저장 경쟁·롤백 중 변경이 fingerprint 검증과 drift fallback으로 경고 없이 숨겨지지 않는다.
- 백엔드 선배포 후 기존 프론트 회귀가 없다.
- Vercel Preview에서 공개·관리 UI를 확인할 수 있고 운영 저장은 차단된다.
- 승인된 E2E·lint·build·backend build가 통과한다.
- Preview 승인 전 프론트 운영 반영이 발생하지 않는다.
