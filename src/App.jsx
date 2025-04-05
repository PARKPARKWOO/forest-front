import { Routes, Route } from 'react-router-dom';
import AdminHome from './pages/admin/AdminHome';
import UserHome from './pages/user/UserHome';
import { AuthProvider } from './contexts/AuthContext';
import Category from './components/Category';
import Layout from './components/Layout';
import Login from './pages/Login';
import PostWrite from './pages/post/PostWrite';
import PostDetail from './pages/post/PostDetail';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<UserHome />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/category/:categoryId" element={<Category />} />
          <Route path="/category/:categoryId/write" element={<PostWrite />} />
          <Route path="/post/:postId" element={<PostDetail />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
