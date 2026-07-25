import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchCategories } from '../../services/categoryService';
import { fetchPrograms } from '../../services/programService';
import { fetchPostsByCategory } from '../../services/postService';
import { getNoticeList } from '../../services/noticeService';
import { getHomeBanner } from '../../services/homeBannerService';
import HomeHero from '../../features/home/HomeHero';
import { normalizeHomeBanners } from '../../features/home/homeHeroModel';
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
import SEO from '../../components/SEO';

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

  const homeBanners = useMemo(() => normalizeHomeBanners(homeBannerData), [homeBannerData]);

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
      <SEO path="/" />
      <div className="mb-12">
        <HomeHero banners={homeBanners} />
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
