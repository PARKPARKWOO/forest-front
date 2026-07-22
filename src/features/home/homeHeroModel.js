export const HOME_HERO_DEFAULT = Object.freeze({
  badgeText: '전북의 숲, 시민과 함께',
  title: '숲을 지키는 가장 가까운 방법',
  description: '전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.',
  backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
  primaryButtonText: '단체 소개',
  primaryButtonLink: '/intro',
  secondaryButtonText: '프로그램 참여',
  secondaryButtonLink: '/programs/participate',

  // Backend HomeBannerContent compatibility fields. The public renderer ignores them.
  sideImageUrl: '/draft/forest-hero-placeholder.svg',
  titleColor: '#FFFFFF',
  descriptionColor: '#ECFDF5',
  badgeTextColor: '#ECFDF5',
  sideTitle: '',
  sideDescription: '',
});

export const HOME_HERO_IMAGE_FALLBACK = '/draft/forest-hero-placeholder.svg';

export const HOME_HERO_VISIBLE_FIELDS = Object.freeze({
  badgeText: '배지 문구를 입력해 주세요.',
  title: '제목을 입력해 주세요.',
  description: '설명 문구를 입력해 주세요.',
  backgroundImageUrl: '배경 이미지 주소를 입력하거나 이미지를 업로드해 주세요.',
  primaryButtonText: '버튼 A 문구를 입력해 주세요.',
  primaryButtonLink: '버튼 A 링크를 입력해 주세요.',
  secondaryButtonText: '버튼 B 문구를 입력해 주세요.',
  secondaryButtonLink: '버튼 B 링크를 입력해 주세요.',
});

export const createHeroImageCandidates = (rawValue, { pageOrigin, apiOrigin }) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  const candidates = [];
  if (/^(https?:\/\/|data:|blob:)/i.test(value)) candidates.push(value);
  else if (/^\/\//.test(value)) candidates.push(`https:${value}`);
  else if (value.startsWith('/')) {
    candidates.push(`${pageOrigin.replace(/\/$/, '')}${value}`);
    candidates.push(`${apiOrigin.replace(/\/$/, '')}${value}`);
  } else if (value) candidates.push(value);
  candidates.push(HOME_HERO_IMAGE_FALLBACK);
  return [...new Set(candidates.filter(Boolean))];
};

const configuredActions = (banner) => [
  { text: banner.primaryButtonText, link: banner.primaryButtonLink },
  { text: banner.secondaryButtonText, link: banner.secondaryButtonLink },
].filter(({ text, link }) => typeof text === 'string' && text.trim() && typeof link === 'string' && link.trim());

export const selectHomeHeroActions = (banner) => {
  const actions = configuredActions(banner);
  const primary = actions.find(({ link }) => link.startsWith('/programs'))
    ?? { text: '프로그램 참여', link: '/programs/participate' };
  return { primary, secondary: actions.find(({ link }) => link !== primary.link) };
};

const normalizeBanner = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.entries(HOME_HERO_DEFAULT).map(([field, fallback]) => [
    field,
    typeof source[field] === 'string' && source[field].trim()
      ? source[field].trim()
      : fallback,
  ]));
};

export const normalizeHomeBanners = (value) => {
  const candidates = Array.isArray(value)
    ? value
    : Array.isArray(value?.banners) && value.banners.length > 0
      ? value.banners
      : value?.content
        ? [value.content]
        : [];
  const source = candidates.length > 0 ? candidates : [HOME_HERO_DEFAULT];
  return source.map(normalizeBanner);
};

export const validateHomeHeroBanners = (banners) => {
  const source = Array.isArray(banners) && banners.length > 0 ? banners : [{}];
  return source.map((banner) => Object.fromEntries(
    Object.entries(HOME_HERO_VISIBLE_FIELDS).filter(([field]) => (
      typeof banner?.[field] !== 'string' || !banner[field].trim()
    )),
  ));
};

export const resetHomeHeroVisibleFields = (banner) => {
  const current = normalizeBanner(banner);
  return {
    ...current,
    badgeText: HOME_HERO_DEFAULT.badgeText,
    title: current.title || HOME_HERO_DEFAULT.title,
    description: HOME_HERO_DEFAULT.description,
    backgroundImageUrl: HOME_HERO_DEFAULT.backgroundImageUrl,
    primaryButtonText: HOME_HERO_DEFAULT.primaryButtonText,
    primaryButtonLink: HOME_HERO_DEFAULT.primaryButtonLink,
    secondaryButtonText: HOME_HERO_DEFAULT.secondaryButtonText,
    secondaryButtonLink: HOME_HERO_DEFAULT.secondaryButtonLink,
  };
};

export const createHomeBannerUpdatePayload = (banners) => ({
  banners: normalizeHomeBanners(banners),
});
