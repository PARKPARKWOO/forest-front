import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import UserHome from './pages/user/UserHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import Category from './components/Category';
import CategoryCreate from './pages/admin/CategoryCreate';
import PostWrite from './pages/post/PostWrite';
import PostDetail from './pages/post/PostDetail';
import Login from './pages/Login';
import Intro from './pages/static/Intro';
import Programs from './pages/static/Programs';
import Donation from './pages/static/Donation';
import ProgramCreate from './pages/program/ProgramCreate';
import ProgramDetail from './pages/program/ProgramDetail';
import ProgramEdit from './pages/program/ProgramEdit';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/admin/UserManagement';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <UserHome /> },
      { path: 'login', element: <Login /> },
      { path: 'intro', element: <Intro /> },
      { path: 'programs', element: <Programs /> },
      { path: 'donation', element: <Donation /> },
      { path: 'admin', element: (
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      ) },
      { path: 'admin/category/create', element: (
        <ProtectedRoute>
          <CategoryCreate />
        </ProtectedRoute>
      ) },
      { path: 'admin/users', element: (
        <ProtectedRoute>
          <UserManagement />
        </ProtectedRoute>
      ) },
      { path: 'category/:categoryId', element: <Category /> },
      { path: 'category/:categoryId/write', element: <PostWrite /> },
      { path: 'post/:postId', element: <PostDetail /> },
      { path: 'programs/create', element: <ProgramCreate /> },
      { path: 'programs/:id', element: <ProgramDetail /> },
      { path: 'programs/edit/:id', element: <ProgramEdit /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
