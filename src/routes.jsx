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
import News from './pages/static/News';
import Resources from './pages/static/Resources';
import ESG from './pages/static/ESG';
import Notice from './pages/static/Notice';
import ProgramCreate from './pages/program/ProgramCreate';
import ProgramDetail from './pages/program/ProgramDetail';
import ProgramEdit from './pages/program/ProgramEdit';
import NoticeDetail from './pages/notice/NoticeDetail';
import NoticeWrite from './pages/notice/NoticeWrite';
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
      { path: 'intro/:subCategory', element: <Intro /> },
      { path: 'programs', element: <Programs /> },
      { path: 'programs/create', element: <ProgramCreate /> },
      { path: 'programs/edit/:id', element: <ProgramEdit /> },
      { path: 'programs/detail/:id', element: <ProgramDetail /> },
      { path: 'programs/:subCategory', element: <Programs /> },
      { path: 'news', element: <News /> },
      { path: 'news/:subCategory', element: <News /> },
      { path: 'resources', element: <Resources /> },
      { path: 'resources/:subCategory', element: <Resources /> },
      { path: 'resources/jbforest/video', element: <Resources /> },
      { path: 'resources/jbforest/photo', element: <Resources /> },
      { path: 'donation', element: <Donation /> },
      { path: 'donation/:subCategory', element: <Donation /> },
      { path: 'esg', element: <ESG /> },
      { path: 'esg/:subCategory', element: <ESG /> },
      { path: 'news/notice', element: <Notice /> },
      { path: 'news/notice/:noticeId', element: <NoticeDetail /> },
      { path: 'news/notice/write', element: (
        <ProtectedRoute>
          <NoticeWrite />
        </ProtectedRoute>
      ) },
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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
