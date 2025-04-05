import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import UserHome from './pages/user/UserHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import Category from './components/Category';
import CategoryCreate from './pages/admin/CategoryCreate';
import PostWrite from './pages/post/PostWrite';
import PostDetail from './pages/post/PostDetail';
import Login from './pages/Login';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <UserHome /> },
      { path: 'login', element: <Login /> },
      { path: 'admin', element: <AdminDashboard /> },
      { path: 'admin/category/create', element: <CategoryCreate /> },
      { path: 'category/:categoryId', element: <Category /> },
      { path: 'category/:categoryId/write', element: <PostWrite /> },
      { path: 'post/:postId', element: <PostDetail /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
