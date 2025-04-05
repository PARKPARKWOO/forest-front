import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { fetchCategoryById } from '../../services/categoryService';
import { useAuth } from '../../contexts/AuthContext';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { user } = useAuth();
  
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => fetchCategoryById(categoryId),
    onError: (error) => {
      console.error('Error in category query:', error);
    }
  });

  console.log('CategoryPage render:', { categoryId, category, isLoading, error });

  // 권한 체크 함수
  const hasAuthority = (requiredAuthority) => {
    if (!user || !user.authorities) return false;
    return user.authorities.some(auth => auth.authority === requiredAuthority);
  };

  // 권한이 필요한 카테고리에 대한 접근 권한 체크
  const canAccessCategory = (category) => {
    if (!category.authority) return true; // 권한이 필요없는 카테고리
    return hasAuthority(category.authority);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h2>
            <p className="text-gray-500">{error.message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">카테고리를 찾을 수 없습니다</h2>
            <p className="text-gray-500">요청하신 카테고리가 존재하지 않습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!canAccessCategory(category)) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <div className="text-red-500 text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-500 mb-6">
              이 카테고리를 보기 위해서는 추가 권한이 필요합니다.<br />
              관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* 카테고리 헤더 */}
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        {/* 서브 카테고리 목록 */}
        {category.children && category.children.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.children.map((subCategory) => (
              <div 
                key={subCategory.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden
                  ${!canAccessCategory(subCategory) ? 'opacity-60' : 'hover:shadow-md'} 
                  transition-shadow duration-200`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {subCategory.name}
                    </h3>
                    {subCategory.authority && (
                      <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                        {subCategory.authority}
                      </span>
                    )}
                  </div>
                  {subCategory.description && (
                    <p className="text-gray-600 text-sm mb-4">{subCategory.description}</p>
                  )}
                  <div className="flex justify-end">
                    {canAccessCategory(subCategory) ? (
                      <Link 
                        to={`/category/${subCategory.id}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 
                          bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                      >
                        자세히 보기
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 
                        bg-gray-50 rounded-lg">
                        권한 필요
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 