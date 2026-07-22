import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HOME_HERO_DEFAULT,
  HOME_HERO_IMAGE_FALLBACK,
  createHeroImageCandidates,
  createHomeBannerUpdatePayload,
  normalizeHomeBanners,
  resetHomeHeroVisibleFields,
  selectHomeHeroActions,
  validateHomeHeroBanners,
} from '../../src/features/home/homeHeroModel.js';

test('program participation is the primary public action', () => {
  const banner = {
    ...HOME_HERO_DEFAULT,
    primaryButtonText: '단체 소개',
    primaryButtonLink: '/intro',
    secondaryButtonText: '프로그램 참여',
    secondaryButtonLink: '/programs/participate',
  };
  const actions = selectHomeHeroActions(banner);
  assert.equal(actions.primary.link, '/programs/participate');
  assert.equal(actions.secondary.link, '/intro');
});

test('empty API values normalize to one complete banner', () => {
  const [banner] = normalizeHomeBanners({ banners: [] });
  assert.equal(banner.title, HOME_HERO_DEFAULT.title);
  assert.equal(typeof banner.sideImageUrl, 'string');
  assert.equal(typeof banner.titleColor, 'string');
});

test('nullable legacy API values normalize to non-null strings', () => {
  const [banner] = normalizeHomeBanners([{ title: '새 제목', sideImageUrl: null, titleColor: null }]);
  assert.equal(banner.title, '새 제목');
  assert.equal(banner.sideImageUrl, HOME_HERO_DEFAULT.sideImageUrl);
  assert.equal(banner.titleColor, HOME_HERO_DEFAULT.titleColor);
});

test('API whitespace is trimmed and blank strings use the explicit public fallback', () => {
  const [banner] = normalizeHomeBanners([{
    title: '  공백을 정리한 제목  ',
    description: '   ',
    primaryButtonLink: '',
  }]);
  assert.equal(banner.title, '공백을 정리한 제목');
  assert.equal(banner.description, HOME_HERO_DEFAULT.description);
  assert.equal(banner.primaryButtonLink, HOME_HERO_DEFAULT.primaryButtonLink);
});

test('blank editor fields are reported before the backend can replace them with defaults', () => {
  const errors = validateHomeHeroBanners([{
    ...HOME_HERO_DEFAULT,
    title: '   ',
    primaryButtonLink: '',
  }]);
  assert.deepEqual(errors, [{
    title: '제목을 입력해 주세요.',
    primaryButtonLink: '버튼 A 링크를 입력해 주세요.',
  }]);
});

test('root-relative Hero images try the page origin, API origin, then the local fallback', () => {
  assert.deepEqual(createHeroImageCandidates('/uploads/hero.png', {
    pageOrigin: 'https://www.forest.example',
    apiOrigin: 'https://api.forest.example',
  }), [
    'https://www.forest.example/uploads/hero.png',
    'https://api.forest.example/uploads/hero.png',
    HOME_HERO_IMAGE_FALLBACK,
  ]);
});

test('save payload preserves legacy non-null fields and omits auto-slide settings', () => {
  const legacyValues = {
    sideImageUrl: '/legacy/custom-side.png',
    titleColor: '#123456',
    descriptionColor: '#234567',
    badgeTextColor: '#345678',
    sideTitle: '기존 우측 제목',
    sideDescription: '기존 우측 설명',
  };
  const payload = createHomeBannerUpdatePayload([{ title: '새 제목', ...legacyValues }]);
  assert.equal(payload.banners[0].title, '새 제목');
  for (const [field, value] of Object.entries(legacyValues)) {
    assert.equal(payload.banners[0][field], value);
  }
  assert.equal(Object.hasOwn(payload, 'autoSlideSeconds'), false);
});

test('visible-field reset preserves hidden legacy customization', () => {
  const legacyValues = {
    sideImageUrl: '/legacy/reset-side.png',
    titleColor: '#456789',
    descriptionColor: '#56789A',
    badgeTextColor: '#6789AB',
    sideTitle: '초기화 전 기존 제목',
    sideDescription: '초기화 전 기존 설명',
  };
  const reset = resetHomeHeroVisibleFields({
    ...HOME_HERO_DEFAULT,
    ...legacyValues,
    title: '배너 구분용 제목',
    description: '초기화할 공개 설명',
  });
  assert.equal(reset.title, '배너 구분용 제목');
  assert.equal(reset.description, HOME_HERO_DEFAULT.description);
  for (const [field, value] of Object.entries(legacyValues)) assert.equal(reset[field], value);
});
