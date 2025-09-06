import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPostsByCategory } from '../../services/postService';

export default function News() {
  const { subCategory } = useParams();
  const { isAdmin } = useAuth();

  const subCategories = [
    { id: 'notice', name: '공지사항', path: '/news/notice' },
    { id: 'activities', name: '전북생명의숲 활동보기', path: '/news/activities' },
  ];

  // 활동보기 게시글 목록 조회 (categoryId = 0)
  const { data: activitiesPosts, isLoading: activitiesLoading } = useQuery({
    queryKey: ['posts', '0'],
    queryFn: () => fetchPostsByCategory('0'),
    enabled: subCategory === 'activities',
  });

  const getContent = () => {
    switch (subCategory) {
      case 'notice':
        return {
          title: '공지사항',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 주요 공지사항을 확인하실 수 있습니다.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">공지사항</h3>
                <p className="text-blue-700">
                  중요한 소식과 안내사항을 빠르게 전달합니다.
                </p>
              </div>
            </div>
          )
        };
      case 'activities':
        return {
          title: '전북생명의숲 활동보기',
          content: (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-lg text-gray-700 leading-relaxed">
                  전북생명의숲의 다양한 활동들을 확인하실 수 있습니다.
                </p>
                {isAdmin && (
                  <Link
                    to="/category/0/write"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    글쓰기
                  </Link>
                )}
              </div>
              
              {/* 게시글 목록 */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">활동 게시글</h3>
                  
                  {activitiesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                      <p className="mt-2 text-gray-600">게시글을 불러오는 중...</p>
                    </div>
                  ) : activitiesPosts && activitiesPosts.length > 0 ? (
                    <div className="space-y-4">
                      {activitiesPosts.map((post) => (
                        <div key={post.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Link
                                to={`/post/0/${post.id}`}
                                className="text-lg font-medium text-gray-800 hover:text-green-600 transition-colors duration-200"
                              >
                                {post.title}
                              </Link>
                              <div className="mt-2 text-sm text-gray-500">
                                <span>{post.authorName}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                              </div>
                              {post.content && (
                                <div className="mt-2 text-gray-600 text-sm line-clamp-2">
                                  {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>아직 등록된 활동 게시글이 없습니다.</p>
                      {isAdmin && (
                        <p className="mt-2 text-sm">첫 번째 활동을 작성해보세요!</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        };
      default:
        return {
          title: '소식',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 최신 소식과 활동을 확인하실 수 있습니다.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {subCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="bg-blue-50 p-6 rounded-lg text-center hover:bg-blue-100 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">{category.name}</h3>
                    <p className="text-blue-700 text-sm">자세히 보기</p>
                  </Link>
                ))}
              </div>
            </div>
          )
        };
    }
  };

  const { title, content } = getContent();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 하위 카테고리 네비게이션 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {subCategories.map((category) => (
            <Link
              key={category.id}
              to={category.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                subCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="prose prose-blue max-w-none">
        {content}
      </div>
    </div>
  );
} 