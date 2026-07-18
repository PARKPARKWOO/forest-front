const BASE = [
  { id: 'intro', name: '단체소개', path: '/intro', children: [
    { id: 'intro-greeting', name: '인사말', path: '/intro/greeting' },
    { id: 'intro-declaration', name: '창립선언문', path: '/intro/declaration' },
    { id: 'intro-people', name: '함께하는이들', path: '/intro/people' },
    { id: 'intro-activities', name: '주요활동', path: '/intro/activities' },
    { id: 'intro-location', name: '오시는 길', path: '/intro/location' },
  ] },
  { id: 'programs', name: '참여 프로그램', path: '/programs', children: [
    { id: 'programs-participate', name: '참여 프로그램', path: '/programs/participate' },
    { id: 'programs-guide', name: '숲 해설가 양성교육', path: '/programs/guide' },
    { id: 'programs-volunteer', name: '자원봉사활동 신청', path: '/programs/volunteer' },
  ] },
  { id: 'news', name: '소식', path: '/news', children: [
    { id: 'news-notice', name: '공지사항', path: '/news/notice' },
    { id: 'news-activities', name: '전북생명의숲 활동보기', path: '/news/activities' },
  ] },
  { id: 'resources', name: '자료실', path: '/resources', children: [
    { id: 'resources-documents', name: '문서자료실', path: '/resources/documents' },
    { id: 'resources-jbforest', name: '전북생명의숲자료실', path: '/resources/jbforest' },
  ] },
  { id: 'donation', name: '후원하기', path: '/donation', children: [
    { id: 'donation-individual', name: '후원 신청', path: '/donation/individual' },
    { id: 'esg-activities', name: '기업 사회공헌활동', path: '/esg/activities' },
    { id: 'esg-report', name: '기업 ESH 보고서', path: '/esg/report' },
  ] },
];

export const isNavigationItemActive = (item, pathname) => (
  pathname === item.path
  || pathname.startsWith(`${item.path}/`)
  || item.children?.some((child) => isNavigationItemActive(child, pathname))
);

const mapDynamicCategory = (category) => ({
  id: `board-${category.id}`,
  name: category.name,
  path: `/category/${category.id}`,
  children: Array.isArray(category.children) ? category.children.map(mapDynamicCategory) : [],
});

export function buildPublicNavigation(dynamicCategories = []) {
  return BASE.map((item) => item.id === 'news' ? {
    ...item,
    children: [
      ...item.children,
      ...dynamicCategories.map(mapDynamicCategory),
    ],
  } : item);
}
