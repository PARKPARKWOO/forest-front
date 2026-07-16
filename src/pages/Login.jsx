import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clearPendingNavigation, readPendingNavigation } from '../utils/pendingNavigation';
import LoginOptions from '../components/LoginOptions';

/**
 * SSO 콜백 후 진입 페이지.
 * 토큰은 httpOnly 쿠키이므로 JS 가 읽을 수 없고 읽을 필요도 없다.
 * AuthContext.fetchUserData() 가 GET /users 성공 또는 401/403으로 로그인 상태를 판정한다.
 * 인증되면 이전 화면으로 복귀하고, 아니면 실제 로그인 방법을 보여준다.
 */
export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const pendingNavigation = readPendingNavigation();
    const returnTo = pendingNavigation?.returnTo || '/';

    // 프로그램 신청 재개 액션은 상세 화면에서 소비한다. 단순 세션 만료 복귀는
    // 여기에서 정리해 오래된 경로가 다음 로그인에 재사용되지 않게 한다.
    if (!pendingNavigation?.action) {
      clearPendingNavigation();
    }

    navigate(returnTo, { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm" aria-labelledby="login-page-title">
        <h1 id="login-page-title" className="text-center text-3xl font-bold text-gray-900">로그인이 필요합니다</h1>
        <p className="mb-7 mt-3 text-center text-lg leading-relaxed text-gray-700">
          계속하려면 사용하실 로그인 방법을 선택해 주세요. 로그인 뒤 이전 화면으로 돌아갑니다.
        </p>
        <LoginOptions />
        <button
          type="button"
          onClick={() => {
            clearPendingNavigation();
            navigate('/', { replace: true });
          }}
          className="mt-4 min-h-12 w-full rounded-lg border border-gray-400 px-4 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-50"
        >
          홈으로 돌아가기
        </button>
      </section>
    </div>
  );
}
