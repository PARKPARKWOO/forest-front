import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import UserHome from './pages/user/UserHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import Category from './components/Category';
import Login from './pages/Login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // 사용자 페이지 영역
      { index: true, element: <UserHome /> },
      { path: 'category/:categoryId', element: <Category /> },
      
      // 관리자 페이지 영역
      { path: 'admin', element: <AdminDashboard /> },
      { path: 'login', element: <Login /> },
    ],
  },
]);

export default router;
