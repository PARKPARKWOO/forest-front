import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../services/categoryService';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo, sortProgramsByStatus } from '../../utils/programStatus';
import { fetchPostsByCategory } from '../../services/postService';
import { getNoticeList } from '../../services/noticeService';
import { formatKoreanDateRange } from '../../utils/dateFormat';
import { getHomeBanner } from '../../services/homeBannerService';
import HomeBannerHero from '../../components/HomeBannerHero';
import AsyncState from '../../components/AsyncState';

const DEFAULT_HOME_BANNER = {
  badgeText: '2026 숲과 함께하는 시민 활동',
  title: '전북생명의숲에 오신 것을 환영합니다',
  description: '숲을 통해 생명의 가치를 전하고 지속가능한 미래를 만들어갑니다. 함께 참여하고 소통하며 더 나은 환경을 만들어보세요.',
  backgroundImageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80',
  sideImageUrl: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
  titleColor: '#FFFFFF',
  descriptionColor: '#ECFDF5',
  badgeTextColor: '#ECFDF5',
  primaryButtonText: '소개 보기',
  primaryButtonLink: '/intro',
  secondaryButtonText: '프로그램 참여',
  secondaryButtonLink: '/programs',
  sideTitle: '이번 달 추천 프로그램',
  sideDescription: '숲해설가 양성교육 · 시민 자원봉사 모집 중',
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION_QUERY).matches || false;

export default function UserHome() {
  // 카테고리 조회
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
    isFetching: categoriesFetching,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const categoriesUnavailable = categoriesError || (
    !categoriesLoading && !Array.isArray(categoriesData)
  );

  // 정렬된 카테고리에서 상위 3개 선택
  const topCategories = useMemo(
    () => (
      Array.isArray(categoriesData)
        ? [...categoriesData].sort((a, b) => b.order - a.order).slice(0, 3)
        : []
    ),
    [categoriesData],
  );

  // 각 카테고리의 최신 게시글 조회
  const categoryPosts = useQuery({
    queryKey: ['categoryPosts', topCategories],
    queryFn: async () => {
      const posts = await Promise.all(
        topCategories.map(async (category) => {
          const posts = await fetchPostsByCategory(category.id);
          return { categoryId: category.id, posts };
        })
      );
      return Object.fromEntries(posts.map(({ categoryId, posts }) => [categoryId, posts]));
    },
    enabled: topCategories.length > 0,
  });

  // 프로그램 목록 조회
  const {
    data: programsData,
    isLoading: programsLoading,
    isError: programsError,
    isFetching: programsFetching,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetchPrograms(1, 10), // 홈페이지에서는 최근 10개만 표시
  });

  // 서버 응답 구조에서 programs 추출 (안전한 접근)
  const programContents = programsData?.data?.contents;
  const programs = sortProgramsByStatus(Array.isArray(programContents) ? programContents : []);
  const programsUnavailable = programsError || (
    !programsLoading && !Array.isArray(programContents)
  );
  const activePrograms = programs.filter((program) => program.status === 'IN_PROGRESS');

  // 공지사항 조회
  const {
    data: noticeData,
    isLoading: noticesLoading,
    isError: noticesError,
    isFetching: noticesFetching,
    refetch: refetchNotices,
  } = useQuery({
    queryKey: ['notices', 'home'],
    queryFn: () => getNoticeList(1),
  });

  const noticeContents = noticeData?.data?.contents;
  const notices = Array.isArray(noticeContents) ? noticeContents : [];
  const noticesUnavailable = noticesError || (
    !noticesLoading && !Array.isArray(noticeContents)
  );

  // 홈 배너 조회
  const { data: homeBannerData } = useQuery({
    queryKey: ['homeBanner'],
    queryFn: getHomeBanner,
  });

  // 소식(활동보기) 조회 - categoryId 0
  const {
    data: newsPosts,
    isLoading: newsLoading,
    isError: newsError,
    isFetching: newsFetching,
    refetch: refetchNews,
  } = useQuery({
    queryKey: ['newsPosts', 'home'],
    queryFn: () => fetchPostsByCategory('0'),
  });
  const newsUnavailable = newsError || (
    !newsLoading && !Array.isArray(newsPosts)
  );

  const extractThumbnail = (post) => {
    if (post?.thumbnail) {
      return post.thumbnail;
    }
    const match = post?.content?.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
    return match?.[1] || null;
  };

  // 중요 공지사항을 상단에 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    const aImportant = a.dynamicFields?.important || false;
    const bImportant = b.dynamicFields?.important || false;
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const homeBanners = useMemo(() => {
    const banners = homeBannerData?.banners;
    if (Array.isArray(banners) && banners.length > 0) {
      return banners;
    }
    if (homeBannerData?.content) {
      return [homeBannerData.content];
    }
    return [DEFAULT_HOME_BANNER];
  }, [homeBannerData]);

  const autoSlideSeconds = Math.min(
    30,
    Math.max(2, Number(homeBannerData?.autoSlideSeconds) || 5),
  );
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const moveToBanner = useCallback((nextIndex) => {
    if (nextIndex === currentBannerIndex) {
      return;
    }
    if (prefersReducedMotion()) {
      setCurrentBannerIndex(nextIndex);
      setIsBannerVisible(true);
      return;
    }
    setIsBannerVisible(false);
    window.setTimeout(() => {
      setCurrentBannerIndex(nextIndex);
      setIsBannerVisible(true);
    }, 180);
  }, [currentBannerIndex]);

  useEffect(() => {
    setCurrentBannerIndex(0);
  }, [homeBanners.length]);

  useEffect(() => {
    if (homeBanners.length <= 1 || prefersReducedMotion()) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % homeBanners.length;
      moveToBanner(nextIndex);
    }, autoSlideSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [homeBanners.length, autoSlideSeconds, currentBannerIndex, moveToBanner]);

  const currentBanner = homeBanners[currentBannerIndex] || DEFAULT_HOME_BANNER;

  return (
    <div className="w-full py-2 md:py-4">
      {/* 메인 배너 */}
      <div className="relative mb-14">
        <div className={`transition-opacity duration-500 ${isBannerVisible ? 'opacity-100' : 'opacity-0'}`}>
          <HomeBannerHero banner={currentBanner} />
        </div>
        {homeBanners.length > 1 && (
          <>
            <button
              onClick={() => moveToBanner((currentBannerIndex - 1 + homeBanners.length) % homeBanners.length)}
              className="accessible-touch-target absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/85 hover:bg-white text-3xl text-gray-700 rounded-full w-12 h-12 shadow flex items-center justify-center"
              aria-label="이전 배너"
            >
              ‹
            </button>
            <button
              onClick={() => moveToBanner((currentBannerIndex + 1) % homeBanners.length)}
              className="accessible-touch-target absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/85 hover:bg-white text-3xl text-gray-700 rounded-full w-12 h-12 shadow flex items-center justify-center"
              aria-label="다음 배너"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center bg-black/25 px-1 rounded-full">
              {homeBanners.map((_, index) => (
                <button
                  key={`banner-dot-${index}`}
                  onClick={() => moveToBanner(index)}
                  className="accessible-touch-target flex items-center justify-center rounded-full"
                  aria-label={`${index + 1}번 배너 보기`}
                  aria-current={currentBannerIndex === index ? 'true' : undefined}
                >
                  <span
                    className={`h-2.5 rounded-full transition-all ${
                      currentBannerIndex === index ? 'w-6 bg-white' : 'w-2.5 bg-white/60'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 공지사항 섹션 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <svg className="w-7 h-7 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 2a1 1 0 00-1 1v1a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1H9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6a1 1 0 011-1h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6z" />
            </svg>
            공지사항
          </h2>
          <Link 
            to="/news/notice"
            className="accessible-touch-target text-green-700 hover:text-green-800 text-lg font-semibold flex items-center px-2 py-2"
          >
            전체 공지사항 보기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="p-8">
            {noticesLoading ? (
              <AsyncState
                status="loading"
                title="공지사항을 불러오고 있습니다"
                className="border-0 shadow-none"
              />
            ) : noticesUnavailable ? (
              <AsyncState
                status="error"
                title="공지사항을 불러오지 못했습니다"
                onRetry={refetchNotices}
                isRetrying={noticesFetching}
                className="border-red-100 shadow-none"
              />
            ) : notices.length > 0 ? (
              <div className="space-y-3">
                {sortedNotices.slice(0, 5).map((notice) => (
                  <Link
                    key={notice.id}
                    to={`/news/notice/${notice.id}`}
                    className="block group"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 border-b border-gray-100 last:border-b-0 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full shrink-0">
                          공지
                        </span>
                        <h3 className="text-lg md:text-xl text-gray-900 group-hover:text-red-600 font-semibold truncate pr-4">
                          {notice.title}
                          {notice.dynamicFields?.important && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium bg-red-200 text-red-800">
                              [중요]
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-base text-gray-500">
                        <span>{notice.authorName}</span>
                        <span>{new Date(notice.updatedAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <AsyncState
                status="empty"
                title="등록된 공지사항이 없습니다"
                description="새로운 공지사항이 등록되면 이곳에서 확인하실 수 있습니다."
                className="border-0 shadow-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* 소식 섹션 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">소식</h2>
          <Link
            to="/news/activities"
            className="accessible-touch-target text-green-700 hover:text-green-800 text-lg font-semibold flex items-center px-2 py-2"
          >
            전체 소식 보기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {newsLoading ? (
          <AsyncState status="loading" title="소식을 불러오고 있습니다" />
        ) : newsUnavailable ? (
          <AsyncState
            status="error"
            title="소식을 불러오지 못했습니다"
            onRetry={refetchNews}
            isRetrying={newsFetching}
            className="border-red-100"
          />
        ) : newsPosts?.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-7">
            {newsPosts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                to={`/post/0/${post.id}`}
                state={{ categoryId: '0', postType: 'POST' }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-100"
              >
                <div className="h-52 bg-gray-100 overflow-hidden flex items-center justify-center">
                  {extractThumbnail(post) ? (
                    <img
                      src={extractThumbnail(post)}
                      alt={post.title}
                      className="w-full h-full object-contain bg-gray-50 p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-base">
                      썸네일 없음
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 leading-snug">{post.title}</h3>
                  <p className="text-base text-gray-500 mt-2">
                    {new Date(post.updatedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <AsyncState
            status="empty"
            title="등록된 소식이 없습니다"
            description="새로운 활동 소식이 등록되면 이곳에서 확인하실 수 있습니다."
          />
        )}
      </div>

      {/* 카테고리별 게시글 섹션 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {categoriesLoading ? (
          <AsyncState
            status="loading"
            title="게시판을 불러오고 있습니다"
            className="md:col-span-2 lg:col-span-3"
          />
        ) : categoriesUnavailable ? (
          <AsyncState
            status="error"
            title="게시판을 불러오지 못했습니다"
            onRetry={refetchCategories}
            isRetrying={categoriesFetching}
            className="border-red-100 md:col-span-2 lg:col-span-3"
          />
        ) : topCategories.length === 0 ? (
          <AsyncState
            status="empty"
            title="등록된 게시판이 없습니다"
            description="새로운 게시판이 준비되면 이곳에서 확인하실 수 있습니다."
            className="md:col-span-2 lg:col-span-3"
          />
        ) : categoryPosts.isLoading ? (
          <AsyncState
            status="loading"
            title="게시글을 불러오고 있습니다"
            className="md:col-span-2 lg:col-span-3"
          />
        ) : categoryPosts.isError || !categoryPosts.data ? (
          <AsyncState
            status="error"
            title="게시글을 불러오지 못했습니다"
            onRetry={categoryPosts.refetch}
            isRetrying={categoryPosts.isFetching}
            className="border-red-100 md:col-span-2 lg:col-span-3"
          />
        ) : topCategories.map(category => (
            <div key={category.id} className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-sm p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                <Link
                  to={`/category/${category.id}`}
                  className="accessible-touch-target text-base text-green-700 hover:text-green-800 font-semibold flex items-center px-2 py-2"
                >
                  더보기
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="space-y-3">
                {categoryPosts.data[category.id]?.slice(0, 5).map(post => (
                  <Link
                    key={post.id}
                    to={`/post/${category.id}/${post.id}`}
                    state={{ categoryId: category.id, postType: category.type }}
                    className="block group"
                  >
                    <div className="flex items-center gap-5 py-3 border-b border-green-100">
                      {extractThumbnail(post) && (
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={extractThumbnail(post)}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg text-gray-700 group-hover:text-green-700 truncate pr-4">
                          {post.title}
                        </h3>
                        <span className="text-base text-gray-600 whitespace-nowrap">
                          {new Date(post.updatedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {(!categoryPosts.data[category.id] || categoryPosts.data[category.id].length === 0) && (
                  <p className="text-lg text-gray-600 text-center py-6">등록된 게시글이 없습니다.</p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* 프로그램 섹션 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">진행중인 프로그램</h2>
          <Link 
            to="/programs"
            className="accessible-touch-target text-green-700 hover:text-green-800 text-lg font-semibold flex items-center px-2 py-2"
          >
            전체 프로그램 보기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-7">
          {programsLoading ? (
            <AsyncState
              status="loading"
              title="프로그램을 불러오고 있습니다"
              className="md:col-span-3"
            />
          ) : programsUnavailable ? (
            <AsyncState
              status="error"
              title="프로그램을 불러오지 못했습니다"
              onRetry={refetchPrograms}
              isRetrying={programsFetching}
              className="border-red-100 md:col-span-3"
            />
          ) : activePrograms.length > 0 ? (
            activePrograms.slice(0, 3).map((program, index) => (
              <Link
                key={program.id}
                to={`/programs/detail/${program.id}`}
                className={`
                  rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100
                  ${index % 3 === 0 ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 
                    index % 3 === 1 ? 'bg-gradient-to-br from-blue-50 to-sky-100' :
                    'bg-gradient-to-br from-amber-50 to-orange-100'}
                `}
              >
                {program.thumbnail && (
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={program.thumbnail} 
                      alt={program.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-4 py-1.5 text-base rounded-full font-semibold 
                        ${getProgramStatusInfo(program.status).className} shadow-sm`}>
                        {getProgramStatusInfo(program.status).text}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug">
                    {program.title}
                  </h3>
                  <div className="space-y-2 text-base text-gray-700">
                    <p className="flex items-center">
                      <span className="w-24 font-medium">신청기간</span>
                      <span>{formatKoreanDateRange(program.applyStartDate, program.applyEndDate)}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="w-24 font-medium">모집인원</span>
                      <span>{program.maxParticipants}명</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <AsyncState
              status="empty"
              title="현재 접수 중인 프로그램이 없습니다"
              description="접수 예정이거나 지난 프로그램은 전체 프로그램 보기에서 확인하실 수 있습니다."
              className="md:col-span-3"
            />
          )}
        </div>
      </div>
      
      {/* 후원 섹션 */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-50 rounded-2xl p-10 text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-4">함께 만들어가는 푸른 숲</h2>
        <p className="text-green-700 text-lg leading-relaxed mb-7 max-w-2xl mx-auto">
          여러분의 소중한 후원은 더 많은 숲을 만들고 보전하는 데 사용됩니다.
          작은 정성이 모여 큰 변화를 만듭니다.
        </p>
        <Link 
          to="/donation" 
          className="inline-block bg-green-600 text-white text-lg px-8 py-3.5 rounded-full font-semibold hover:bg-green-700 transition-colors duration-300"
        >
          후원하기
        </Link>
      </div>
    </div>
  );
}
