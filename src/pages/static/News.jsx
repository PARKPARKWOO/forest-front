import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { deletePost, fetchPostsByCategory } from '../../services/postService';
import AsyncState from '../../components/AsyncState';
import { extractPostThumbnail, HOME_IMAGE_FALLBACK } from '../../utils/homeContent';

const ACTIVITIES_PAGE_SIZE = 9;

export default function News() {
  const { subCategory } = useParams();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activitiesPage, setActivitiesPage] = useState(1);

  const subCategories = [
    { id: 'notice', name: '공지사항', path: '/news/notice' },
    { id: 'activities', name: '전북생명의숲 활동보기', path: '/news/activities' },
  ];

  // 활동보기 게시글 목록 조회 (categoryId = 0)
  const {
    data: activitiesPosts,
    isLoading: activitiesLoading,
    isError: activitiesError,
    isFetching: activitiesFetching,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ['posts', '0'],
    queryFn: () => fetchPostsByCategory('0'),
    enabled: subCategory === 'activities',
  });
  const activitiesUnavailable = activitiesError || (
    !activitiesLoading && !Array.isArray(activitiesPosts)
  );

  const activitiesTotalPages = Math.max(
    1,
    Math.ceil((Array.isArray(activitiesPosts) ? activitiesPosts.length : 0) / ACTIVITIES_PAGE_SIZE),
  );
  // 글이 지워져 마지막 페이지가 사라지면 남아 있는 마지막 페이지로 내린다.
  useEffect(() => {
    setActivitiesPage((current) => Math.min(current, activitiesTotalPages));
  }, [activitiesTotalPages]);
  const pagedActivities = useMemo(() => (
    Array.isArray(activitiesPosts)
      ? activitiesPosts.slice(
        (activitiesPage - 1) * ACTIVITIES_PAGE_SIZE,
        activitiesPage * ACTIVITIES_PAGE_SIZE,
      )
      : []
  ), [activitiesPosts, activitiesPage]);

  const { mutate: removePost, isPending: isDeletingPost } = useMutation({
    mutationFn: (postId) => deletePost('0', postId),
    onSuccess: () => {
      alert('게시글이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['posts', '0'] });
      queryClient.invalidateQueries({ queryKey: ['newsPosts', 'home'] });
    },
    onError: (error) => {
      alert('게시글 삭제에 실패했습니다: ' + error.message);
    },
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
                    <AsyncState
                      status="loading"
                      title="활동 게시글을 불러오고 있습니다"
                      className="border-0 shadow-none"
                    />
                  ) : activitiesUnavailable ? (
                    <AsyncState
                      status="error"
                      title="활동 게시글을 불러오지 못했습니다"
                      description="인터넷 연결을 확인한 뒤 다시 시도해 주세요."
                      onRetry={refetchActivities}
                      isRetrying={activitiesFetching}
                      className="border-red-100 shadow-none"
                    />
                  ) : activitiesPosts.length > 0 ? (
                    <>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {pagedActivities.map((post) => (
                          <article
                            key={post.id}
                            aria-label={post.title}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:outline focus-within:outline-forest focus-within:outline-offset-2 focus-within:outline-forest-focus"
                          >
                            <Link to={`/post/0/${post.id}`} className="group block">
                              <img
                                className="aspect-[4/3] w-full object-cover"
                                src={extractPostThumbnail(post) || HOME_IMAGE_FALLBACK}
                                alt=""
                              />
                              <div className="p-4">
                                <h4 className="line-clamp-2 text-lg font-semibold leading-snug text-gray-800 group-hover:text-green-700">
                                  {post.title}
                                </h4>
                                <div className="mt-2 text-sm text-gray-500">
                                  <span>{post.authorName}</span>
                                  <span className="mx-2">•</span>
                                  <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </Link>
                            {isAdmin && (
                              <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2">
                                <Link
                                  to={`/category/0/edit/${post.id}`}
                                  className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors duration-200"
                                >
                                  수정
                                </Link>
                                <button
                                  onClick={() => {
                                    if (window.confirm('이 게시글을 삭제하시겠습니까?')) {
                                      removePost(post.id);
                                    }
                                  }}
                                  disabled={isDeletingPost}
                                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200 disabled:opacity-50"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>

                      {activitiesTotalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => setActivitiesPage((prev) => Math.max(1, prev - 1))}
                              disabled={activitiesPage === 1}
                              className="accessible-touch-target px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              이전
                            </button>
                            <span
                              data-testid="activities-page-status"
                              className="accessible-touch-target inline-flex items-center px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md"
                              aria-live="polite"
                            >
                              {activitiesPage} / {activitiesTotalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActivitiesPage((prev) => Math.min(activitiesTotalPages, prev + 1))}
                              disabled={activitiesPage === activitiesTotalPages}
                              className="accessible-touch-target px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              다음
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <AsyncState
                      status="empty"
                      title="등록된 활동 게시글이 없습니다"
                      description={isAdmin
                        ? '첫 번째 활동 게시글을 작성해 주세요.'
                        : '새로운 활동 소식이 등록되면 이곳에서 확인하실 수 있습니다.'}
                      className="border-0 shadow-none"
                    />
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
