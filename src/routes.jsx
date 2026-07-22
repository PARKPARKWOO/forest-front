import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import UserHome from './pages/user/UserHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import Category from './components/Category';
import CategoryCreate from './pages/admin/CategoryCreate';
import PostWrite from './pages/post/PostWrite';
import PostDetail from './pages/post/PostDetail';
import PostEdit from './pages/post/PostEdit';
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
import NoticeEdit from './pages/notice/NoticeEdit';
import ProtectedRoute from './components/ProtectedRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import UserManagement from './pages/admin/UserManagement';
import NotFoundPage from './pages/NotFoundPage';

const DesignSystemCatalog = import.meta.env.DEV && import.meta.env.VITE_DRAFT_MODE === 'true'
  ? lazy(() => import('./design-system/catalog/DesignSystemCatalog'))
  : null;

const designSystemRoutes = DesignSystemCatalog ? [{
  path: '__design-system',
  element: (
    <Suspense fallback={<p role="status">디자인 시스템을 불러오고 있습니다.</p>}>
      <DesignSystemCatalog />
    </Suspense>
  ),
}] : [];

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      ...designSystemRoutes,
      { index: true, element: <UserHome /> },
      { path: 'login', element: <Login /> },
      { path: 'intro', element: <Intro /> },
      { path: 'intro/:subCategory', element: <Intro /> },
      { path: 'programs', element: <Programs /> },
      { path: 'programs/create', element: (
        <ProtectedRoute>
          <ProgramCreate />
        </ProtectedRoute>
      ) },
      { path: 'programs/edit/:id', element: (
        <ProtectedRoute>
          <ProgramEdit />
        </ProtectedRoute>
      ) },
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
      { path: 'news/notice/edit/:noticeId', element: (
        <ProtectedRoute>
          <NoticeEdit />
        </ProtectedRoute>
      ) },
      { path: 'admin', element: (
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      ) },
      { path: 'admin/category/create', element: (
        <ProtectedRoute requireMaxAccess>
          <CategoryCreate />
        </ProtectedRoute>
      ) },
      { path: 'admin/users', element: (
        <ProtectedRoute requireMaxAccess>
          <UserManagement />
        </ProtectedRoute>
      ) },
      { path: 'category/:categoryId', element: <Category /> },
      { path: 'category/:categoryId/write', element: (
        <AuthenticatedRoute>
          <PostWrite />
        </AuthenticatedRoute>
      ) },
      { path: 'category/:categoryId/edit/:postId', element: (
        <AuthenticatedRoute>
          <PostEdit />
        </AuthenticatedRoute>
      ) },
      { path: 'post/:categoryId/:postId', element: <PostDetail /> },
      { path: 'post/:postId', element: <PostDetail /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
