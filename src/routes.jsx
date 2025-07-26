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
import Notice from './pages/static/Notice';
import ProgramCreate from './pages/program/ProgramCreate';
import ProgramDetail from './pages/program/ProgramDetail';
import ProgramEdit from './pages/program/ProgramEdit';
import NoticeDetail from './pages/notice/NoticeDetail';
import NoticeWrite from './pages/notice/NoticeWrite';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/admin/UserManagement';
import ForestAndSharing from './pages/static/ForestAndSharing';
import CitizenParticipation from './pages/static/CitizenParticipation';
import ForestNews from './pages/static/ForestNews';
import OurForest from './pages/static/OurForest';
import BeautifulCompanion from './pages/static/BeautifulCompanion';
import MembershipGuide from './pages/static/MembershipGuide';
import ProgramApplication from './pages/static/ProgramApplication';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <UserHome /> },
      { path: 'login', element: <Login /> },
      { path: 'intro', element: <Intro /> },
      { path: 'intro/:subCategory', element: <Intro /> },
      { path: 'forest-and-sharing/forest-news', element: <ForestNews /> },
      { path: 'forest-and-sharing/our-forest', element: <OurForest /> },
      { path: 'forest-and-sharing/beautiful-companion', element: <BeautifulCompanion /> },
      { path: 'citizen-participation/membership-guide', element: <MembershipGuide /> },
      { path: 'citizen-participation/program-application', element: <ProgramApplication /> },
      { path: 'notice', element: <Notice /> },
      { path: 'notice/:noticeId', element: <NoticeDetail /> },
      { path: 'notice/write', element: (
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
