import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import { useState } from 'react';

const queryClient = new QueryClient();

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal}>
          <Outlet context={{ setShowLoginModal }} />
        </Layout>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
