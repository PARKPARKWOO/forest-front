# Forest 로그아웃 세션 클라이언트 설계

- 작성일: 2026-08-01
- 상태: 대화 설계 승인 및 자체 검토 완료
- 대상 저장소: `cms-react-project/`
- 대상 기능: 데스크톱·모바일 명시적 로그아웃과 인증 상태 정리
- 참고 구현: `find-my-pet-frontend/src/lib/auth.ts`, `find-my-pet-frontend/src/lib/api.ts`

## 1. 배경과 확인된 원인

Forest의 명시적 로그아웃은 `Layout.handleLogout()` → `AuthContext.logout()` → `userService.revokeToken()` 순서로 실행된다. 정상 흐름에서는 Auth 서버가 Redis refresh를 폐기하고 `.platformholder.site` 범위의 `accessToken`, `refreshToken` HttpOnly 쿠키를 만료시킨 뒤에만 프론트 인증 상태와 신청 초안을 정리한다.

현재 Vercel Preview와 로컬 draft에서는 `FOREST_MUTATIONS_ENABLED=false`가 컴파일된다. `revokeToken()`은 이 콘텐츠 mutation 플래그를 직접 검사해 `FOREST_MUTATIONS_DISABLED`를 throw하므로 로그아웃 버튼을 눌러도 네트워크 요청이 한 번도 발생하지 않는다. UI는 로그아웃 버튼을 활성 상태로 보여주면서도 항상 인터넷 연결 오류 안내를 표시한다. 이는 콘텐츠 편집 차단 정책과 인증 세션 수명주기 동작을 같은 mutation 범주로 취급한 것이 직접 원인이다.

추가로 현재 구현은 성공한 revoke 응답에 `response.json()`을 강제한다. 현재 Auth 구현은 200 JSON wrapper를 반환하지만 로그아웃의 실질 계약은 성공 상태와 `Set-Cookie`이며, 빈 200 또는 204로 바뀌면 쿠키가 이미 삭제된 성공을 프론트가 실패로 오인할 수 있다.

인증 확인은 60초 주기의 `/users` 요청과 동시에 실행될 수 있다. 로그아웃 전에 시작한 `/users` 요청이 revoke 성공 뒤 200으로 완료되면 현재 코드는 인증 상태를 다시 `true`로 만들 수 있다. 이 경쟁 조건도 같은 세션 종료 경계에서 차단한다.

## 2. 승인된 목표 동작

1. Vercel Preview, 로컬 개발, 운영에서 로그아웃 버튼은 실제 `POST /auth/token/revoke`를 실행한다.
2. Preview의 게시글·프로그램·조직도 등 콘텐츠 mutation 차단은 그대로 유지한다.
3. 로그아웃 성공은 HTTP 2xx만으로 판정하고 응답 본문 형식에 의존하지 않는다.
4. 성공 후 Forest 인증 상태, 관리자/MAX 권한, 사용자 정보, 인증 폴링, 신청 초안과 보류 중 이동 정보를 정리하고 홈으로 이동한다.
5. revoke가 네트워크 오류 또는 4xx/5xx로 실패하면 현재 로그인 상태와 사용자 데이터를 유지하고 재시도 안내를 표시한다.
6. 성공한 로그아웃보다 먼저 시작된 `/users` 응답은 이후 인증 상태를 변경하거나 로그인 화면 이동을 일으키지 못한다.
7. 공유 parent-domain 쿠키가 삭제되므로 동일 브라우저의 FMP 등 PlatformHolder SSO 서비스도 함께 로그아웃되는 동작을 의도된 계약으로 인정한다.

## 3. 검토한 접근법

### 채택: 전용 인증 세션 클라이언트

공통 API base URL과 `withCredentials: true`를 재사용하는 별도 Axios 인스턴스를 만들고, 명시적 로그아웃은 이 인스턴스로만 전송한다. 인증 클라이언트에는 콘텐츠 mutation 차단 interceptor와 일반 API의 401 로그인 이동 interceptor를 설치하지 않는다.

이 방식은 인증 세션 종료와 CMS 쓰기 정책을 구조적으로 분리한다. URL 문자열 예외보다 정책 경계가 명확하고, revoke 실패를 `AuthContext`가 직접 판단하므로 실패 시 로그인 상태 보존 계약도 유지한다.

### 기각: 일반 Axios mutation interceptor에 URL 예외 추가

변경량은 작지만 전역 콘텐츠 정책이 특정 인증 URL을 알아야 한다. URL 정규화, base URL 변경, 향후 인증 endpoint 추가 때 예외가 흩어질 수 있으며 logout 401이 일반 401 redirect interceptor와 충돌한다.

### 기각: 기존 native fetch의 Preview 차단만 제거

직접 원인은 제거하지만 API base URL과 credential 설정이 중복되고 공통 클라이언트 계약에서 벗어난다. 응답·timeout·환경 URL 처리가 별도 경로로 남아 FMP의 검증된 credentialed-client 패턴을 충분히 재사용하지 못한다.

## 4. 파일 경계와 책임

### 4.1 공통 API base URL

새 구성 모듈은 개발 기본값 `http://localhost:8080/api/v1`, 배포 기본값 `https://forest.platformholder.site/api/v1`, `VITE_API_BASE_URL` override를 한 곳에서 결정한다.

- 일반 `axiosInstance`와 인증 세션 클라이언트가 같은 값을 import한다.
- 기존 환경별 API 주소와 override 우선순위는 바꾸지 않는다.
- 인증 URL을 `auth.platformholder.site`로 하드코딩하지 않는다. Forest host의 `/api/v1/auth/**`도 Gateway 우선순위 route를 통해 동일 Auth 서비스로 전달된다.

### 4.2 인증 세션 클라이언트

`src/authSessionClient.js`는 다음 계약만 가진다.

- `baseURL`: 공통 API base URL
- `withCredentials: true`
- 콘텐츠 mutation 차단 interceptor 없음
- 401/403 자동 navigation interceptor 없음
- 토큰 read/write, Authorization header 생성, reissue 로직 없음

이 클라이언트는 로그인 세션을 종료하는 Auth lifecycle 요청 전용이다. 일반 콘텐츠 서비스가 import하지 않도록 테스트로 경계를 고정한다.

### 4.3 `revokeToken()`

`userService.revokeToken()`은 `FOREST_MUTATIONS_ENABLED` 검사를 제거하고 인증 세션 클라이언트로 `POST /auth/token/revoke`를 호출한다.

- 요청 body는 보내지 않는다.
- 2xx이면 body를 읽거나 반환 형식을 해석하지 않고 완료한다.
- Axios가 reject한 네트워크 오류와 4xx/5xx는 그대로 호출자에게 전달한다.
- 쿠키를 JavaScript로 읽거나 삭제하지 않는다.

### 4.4 인증 요청 세대 관리

`AuthContext`는 `/users` 요청 세대 번호를 ref로 관리한다.

1. `fetchUserData()` 시작 시 현재 세대 번호를 캡처한다.
2. 성공 또는 실패 응답이 돌아왔을 때 캡처 값이 현재 값과 다르면 모든 state 변경, pending-navigation 저장과 redirect를 생략한다.
3. revoke가 성공한 직후 세대 번호를 증가시킨 다음 인증 상태를 정리한다.
4. revoke 실패 시 세대 번호를 바꾸지 않아 현재 세션과 기존 폴링을 그대로 유지한다.

따라서 로그아웃 전 시작된 200 응답은 사용자를 다시 로그인시키지 않고, 늦은 401/403도 불필요한 `/login` 이동을 만들지 않는다.

### 4.5 현재 사용자 401 처리 책임

일반 Axios 응답 interceptor는 현재 모든 401을 `AuthContext`보다 먼저 `/login` 이동으로 처리한다. 이 상태에서는 세대 번호가 늦은 `/users` 401을 무효화하더라도 interceptor의 이동 부작용이 이미 발생한다.

- 정규화된 `GET /api/v1/users` 요청은 일반 Axios 401 navigation 대상에서 제외한다.
- `/users`의 401/403 판정, pending-navigation 저장과 로그인 이동은 `AuthContext` 한 곳에서 담당한다.
- `AuthContext`는 세대가 오래된 응답을 먼저 반환하므로 로그아웃 전 시작된 401/403은 저장이나 이동을 일으키지 않는다.
- `/users` 이외 요청의 기존 401 navigation 동작은 유지한다.

## 5. 사용자 흐름과 오류 처리

### 성공

1. 데스크톱 또는 모바일 로그아웃 버튼을 누른다.
2. credentialed `POST /auth/token/revoke`가 Forest Gateway를 거쳐 Auth 서비스에 도달한다.
3. 2xx를 받으면 진행 중이던 이전 `/users` 응답을 논리적으로 무효화한다.
4. `isAuthenticated`, `user`, `isAdmin`, `hasMaxAccess`, authenticated-session ref와 폴링 interval을 정리한다.
5. 모든 프로그램 신청 초안과 pending navigation을 정리한다.
6. `/`로 이동하고 헤더는 로그인 버튼을 표시한다.

### 실패

- revoke가 실패하면 인증 state, 신청 초안, pending navigation과 현재 경로를 변경하지 않는다.
- 데스크톱과 모바일 모두 같은 재시도 안내를 표시한다.
- 모바일 메뉴를 먼저 닫는 현재 UI 동작은 유지한다. 실패해도 로그아웃 버튼은 다음 메뉴 열기에서 다시 사용할 수 있다.
- 401/403을 로컬 성공으로 간주하지 않는다. Forest의 F-AUTH-7 fail-closed 계약을 유지한다.

## 6. FMP에서 재사용하는 것과 제외하는 것

재사용한다.

- `withCredentials: true`인 API client를 통한 상대 경로 revoke
- HttpOnly 쿠키를 JavaScript로 다루지 않는 원칙
- 프론트에서 refresh/reissue를 직접 수행하지 않는 원칙
- 성공 응답 body에 의존하지 않는 처리
- 서버 SSOT 응답으로 로그인 상태를 판정하는 구조

복사하지 않는다.

- revoke 오류를 모두 삼키고 로컬 로그아웃을 성공 처리하는 FMP의 best-effort 정책
- FMP의 LocalStorage `email`, `name`, `role` 정리 목록
- FMP의 `/user/me`, Zustand store, Next router 구현
- FMP의 route guard 부재

Forest는 `/users`, React AuthContext, 관리자/MAX 상태, 프로그램 신청 초안과 pending navigation이라는 자체 계약을 유지한다.

## 7. 테스트 설계

### 서비스·정책 회귀

1. Preview 환경에서도 `revokeToken()`이 `FOREST_MUTATIONS_DISABLED`를 throw하지 않고 인증 세션 클라이언트에 정확히 한 번 POST하는지 확인한다.
2. 빈 200과 204 응답을 모두 성공으로 처리하고 JSON 파싱을 요구하지 않는지 확인한다.
3. 4xx/5xx와 네트워크 오류를 swallow하지 않는지 확인한다.
4. 일반 Axios 콘텐츠 POST는 Preview에서 계속 네트워크 전에 차단되는지 확인한다.
5. 인증 세션 클라이언트를 로그아웃 서비스 외 일반 콘텐츠 모듈이 import하지 않는지 확인한다.

### 실제 UI E2E

1. 인증된 데스크톱 화면에서 로그아웃 버튼을 클릭한다.
   - revoke POST 1회
   - 홈 이동
   - 로그인 버튼 표시, 사용자명·관리자 링크 제거
   - 신청 초안과 pending navigation 제거
2. 모바일 메뉴에서 같은 동작을 확인한다.
3. revoke 500에서는 현재 경로·로그인 UI·신청 초안이 유지되고 안내가 표시되는지 확인한다.
4. `/users` 응답을 지연시킨 상태에서 revoke를 성공시킨 뒤 늦은 200을 반환해도 로그인 UI가 되살아나지 않는지 확인한다.
5. 늦은 401/403이 `/login`으로 이동시키지 않는지 확인한다.
6. Preview E2E에서 조직도·홈 배너 등 기존 콘텐츠 mutation zero-network 계약이 유지되는지 확인한다.

### 전체 회귀

- Forest unit 전체
- 공개 홈·인증·관리자 관련 Playwright
- 조직도 Preview E2E
- ESLint
- production 및 `VERCEL_ENV=preview` build
- `git diff --check`

## 8. 비목표와 위험 통제

- Auth 서버, Gateway, Forest 백엔드 endpoint 또는 쿠키 속성을 변경하지 않는다.
- 서비스별 독립 로그아웃을 새로 만들지 않는다. 현재 공유 SSO 쿠키 계약을 유지한다.
- access token blacklist, 전 애플리케이션 refresh 일괄 삭제, 계정 탈퇴 흐름은 범위 밖이다.
- Preview에서 콘텐츠 쓰기를 허용하지 않는다.
- 로그아웃 실패를 성공처럼 보이게 만드는 로컬 전용 synthetic logout을 도입하지 않는다.
- React Query 전체 캐시 정리는 사용자별 비공개 데이터 캐시가 확인될 때 별도 범위로 다룬다. 이번 수정은 검증된 인증 state와 신청 초안 정리에 한정한다.
- 배포된 Auth application의 `REDIRECT_WITH_COOKIE` 설정과 운영 Gateway 버전은 별도 운영 확인 대상이며, 프론트 코드는 현재 PRD와 저장소 계약을 기준으로 한다.

## 9. 완료 기준

- Preview와 운영에서 실제 revoke 요청이 성공하면 즉시 로그아웃 UI와 홈 화면으로 전환된다.
- 빈 성공 body를 포함한 모든 2xx revoke 응답이 성공 처리된다.
- revoke 실패 시 로그인 상태와 사용자 작업 데이터가 보존된다.
- 로그아웃 전 시작된 `/users` 성공·실패 응답이 세션 종료 뒤 상태나 URL을 바꾸지 않는다.
- Preview의 다른 모든 콘텐츠 mutation 차단 테스트가 유지된다.
- 데스크톱·모바일 로그아웃 E2E, unit, lint, production/Preview build와 `git diff --check`가 통과한다.
- PRD 동기화 후 별도 승인 없이 `main` 병합이나 Vercel Production 배포를 하지 않는다.
