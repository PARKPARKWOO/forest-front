import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchCategories } from '../../services/categoryService';
import { fetchPrograms } from '../../services/programService';
import { fetchPostsByCategory } from '../../services/postService';
import { getNoticeList } from '../../services/noticeService';
import { getHomeBanner } from '../../services/homeBannerService';
import PublicHomeHero from '../../components/home/PublicHomeHero';
import HomeProgramSection from '../../components/home/HomeProgramSection';
import HomeNoticeSection from '../../components/home/HomeNoticeSection';
import HomeActivitySection from '../../components/home/HomeActivitySection';
import HomeParticipationSection from '../../components/home/HomeParticipationSection';
import HomeCommunitySection from '../../components/home/HomeCommunitySection';
import {
  getCollectionStatus,
  selectActivePrograms,
  sortHomeNotices,
} from '../../utils/homeContent';

const DEFAULT_HOME_BANNER = {
  badgeText: '2026 숲과 함께하는 시민 활동',
  title: '전북생명의숲에 오신 것을 환영합니다',
  description: '숲을 통해 생명의 가치를 전하고 지속가능한 미래를 만들어갑니다. 함께 참여하고 소통하며 더 나은 환경을 만들어보세요.',
  backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
  sideImageUrl: '/draft/forest-hero-placeholder.svg',
  titleColor: '#FFFFFF',
  descriptionColor: '#ECFDF5',
  badgeTextColor: '#ECFDF5',
  primaryButtonText: '소개 보기',
  primaryButtonLink: '/intro',
  secondaryButtonText: '프로그램 참여',
  secondaryButtonLink: '/programs/participate',
  sideTitle: '이번 달 추천 프로그램',
  sideDescription: '숲해설가 양성교육 · 시민 자원봉사 모집 중',
};

export default function UserHome() {
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

  const topCategories = useMemo(
    () => (
      Array.isArray(categoriesData)
        ? [...categoriesData].sort((a, b) => b.order - a.order).slice(0, 3)
        : []
    ),
    [categoriesData],
  );

  const categoryPosts = useQuery({
    queryKey: ['categoryPosts', topCategories],
    queryFn: async () => {
      const posts = await Promise.all(
        topCategories.map(async (category) => {
          const categoryPostList = await fetchPostsByCategory(category.id);
          return { categoryId: category.id, posts: categoryPostList };
        }),
      );
      return Object.fromEntries(posts.map(({ categoryId, posts }) => [categoryId, posts]));
    },
    enabled: topCategories.length > 0,
  });

  const {
    data: programsData,
    isLoading: programsLoading,
    isError: programsError,
    isFetching: programsFetching,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetchPrograms(1, 10),
    retry: false,
  });
  const programContents = programsData?.data?.contents;
  const programsUnavailable = programsError || (
    !programsLoading && !Array.isArray(programContents)
  );

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
  const noticesUnavailable = noticesError || (
    !noticesLoading && !Array.isArray(noticeContents)
  );

  const { data: homeBannerData } = useQuery({
    queryKey: ['homeBanner'],
    queryFn: getHomeBanner,
  });

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

  const activePrograms = selectActivePrograms(programContents);
  const sortedNotices = sortHomeNotices(noticeContents);
  const programStatus = getCollectionStatus({
    isLoading: programsLoading,
    isError: programsUnavailable,
    value: activePrograms,
  });
  const noticeStatus = getCollectionStatus({
    isLoading: noticesLoading,
    isError: noticesUnavailable,
    value: sortedNotices,
  });
  const newsStatus = getCollectionStatus({
    isLoading: newsLoading,
    isError: newsUnavailable,
    value: newsPosts,
  });
  const communityStatus = getCollectionStatus({
    isLoading: categoriesLoading || categoryPosts.isLoading,
    isError: categoriesUnavailable || categoryPosts.isError,
    value: topCategories,
  });
  const retryCommunity = categoriesUnavailable ? refetchCategories : categoryPosts.refetch;

  return (
    <div className="w-full py-2 md:py-4">
      <div className="mb-12">
        <PublicHomeHero banners={homeBanners} />
      </div>
      <HomeProgramSection
        programs={activePrograms}
        status={programStatus}
        onRetry={refetchPrograms}
        isRetrying={programsFetching}
      />
      <HomeNoticeSection
        notices={sortedNotices}
        status={noticeStatus}
        onRetry={refetchNotices}
        isRetrying={noticesFetching}
      />
      <HomeActivitySection
        posts={newsPosts || []}
        status={newsStatus}
        onRetry={refetchNews}
        isRetrying={newsFetching}
      />
      <HomeParticipationSection />
      <HomeCommunitySection
        categories={topCategories}
        postsByCategory={categoryPosts.data || {}}
        status={communityStatus}
        onRetry={retryCommunity}
        isRetrying={categoriesFetching || categoryPosts.isFetching}
      />
    </div>
  );
}
