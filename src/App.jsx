import { Outlet, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import SEO from './components/SEO';
import { useState } from 'react';

const queryClient = new QueryClient();

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  return (
    <HelmetProvider>
      {/*
        모든 화면의 기본 메타. 정적 index.html 태그는 data-rh 로 Helmet 이 인계하므로,
        자체 SEO 블록이 없는 화면으로 이동하면 대체 태그가 없어 캐노니컬이 사라지고 제목이
        이전 화면에 남는다. 여기서 경로 기반 기본값을 항상 렌더해 그 공백을 막는다.
        화면별 SEO 는 나중에 마운트되므로 이 값을 덮어쓴다.
      */}
      <SEO path={location.pathname} />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Layout showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal}>
            <Outlet context={{ setShowLoginModal }} />
          </Layout>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
