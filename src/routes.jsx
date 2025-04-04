import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import UserHome from './pages/user/UserHome';
import AdminDashboard from './pages/admin/AdminDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // 사용자 페이지 영역
      { index: true, element: <UserHome /> },
      
      // 관리자 페이지 영역
      { path: 'admin', element: <AdminDashboard /> },
    ],
  },
]);

export default router;
