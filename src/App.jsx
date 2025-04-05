import { Routes, Route } from 'react-router-dom';
import AdminHome from './pages/admin/AdminHome';
import UserHome from './pages/user/UserHome';
import CategoryPage from './pages/user/CategoryPage';
import { AuthProvider } from './contexts/AuthContext';
import Category from './components/Category';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<UserHome />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/category/:categoryId" element={
          <Layout>
            <Category />
          </Layout>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
