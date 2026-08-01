/* eslint-disable react-refresh/only-export-components */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext.jsx';

function AuthContextHarnessControls() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <section aria-label="인증 컨텍스트 테스트 하니스">
      <output data-testid="auth-harness-session">
        {isAuthenticated ? `authenticated:${user?.userId ?? 'unknown'}` : 'signed-out'}
      </output>
      <button type="button" data-testid="auth-harness-login" onClick={() => { void login(); }}>
        하니스 로그인
      </button>
      <button type="button" data-testid="auth-harness-logout" onClick={() => { void logout(); }}>
        하니스 로그아웃
      </button>
    </section>
  );
}

export function mountAuthContextHarness() {
  const host = document.createElement('div');
  host.dataset.testid = 'auth-context-harness';
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(AuthProvider, null, createElement(AuthContextHarnessControls)));

  return () => {
    root.unmount();
    host.remove();
  };
}
