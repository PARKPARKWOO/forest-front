import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import { fetchCategoryById } from '../../services/categoryService';
import { fetchPostsByCategory, deletePost } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => fetchCategoryById(categoryId),
    onError: (error) => {
      console.error('Error in category query:', error);
    }
  });

  // 게시글 목록 조회 (카테고리에 게시글이 있는 경우)
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', categoryId],
    queryFn: () => fetchPostsByCategory(categoryId),
    enabled: !!categoryId && !category?.children?.length, // 서브카테고리가 없는 경우만
  });

  // 게시글 삭제
  const { mutate: removePost } = useMutation({
    mutationFn: ({ categoryId, postId }) => deletePost(categoryId, postId),
    onSuccess: () => {
      alert('게시글이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['posts', categoryId] });
    },
    onError: (error) => {
      alert('게시글 삭제에 실패했습니다: ' + error.message);
    },
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

        {/* 게시글 목록 (서브카테고리가 없는 경우) */}
        {(!category.children || category.children.length === 0) && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">게시글 목록</h2>
                {isAdmin && (
                  <Link
                    to={`/category/${categoryId}/write`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    글쓰기
                  </Link>
                )}
              </div>
              
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            to={`/post/${categoryId}/${post.id}`}
                            className="text-lg font-medium text-gray-800 hover:text-green-600 transition-colors duration-200"
                          >
                            {post.title}
                          </Link>
                          <div className="mt-2 text-sm text-gray-500">
                            <span>{post.authorName}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="ml-4 flex items-center gap-2">
                            <Link
                              to={`/category/${categoryId}/edit/${post.id}`}
                              className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-200"
                            >
                              수정
                            </Link>
                            <button
                              onClick={() => {
                                if (window.confirm('이 게시글을 삭제하시겠습니까?')) {
                                  removePost({ categoryId, postId: post.id });
                                }
                              }}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  게시글이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 
