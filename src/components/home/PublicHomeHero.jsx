import { useState } from 'react';
import ActionLink from '../ui/ActionLink';

const configuredActions = (banner) => [
  { text: banner.primaryButtonText, link: banner.primaryButtonLink },
  { text: banner.secondaryButtonText, link: banner.secondaryButtonLink },
].filter((action) => action.text && action.link);

const selectActions = (banner) => {
  const actions = configuredActions(banner);
  const primary = actions.find(({ link }) => link.startsWith('/programs'))
    || { text: '프로그램 참여', link: '/programs/participate' };
  return { primary, secondary: actions.find(({ link }) => link !== primary.link) };
};

export default function PublicHomeHero({ banners = [] }) {
  const items = Array.isArray(banners) && banners.length ? banners : [{
    badgeText: '전북의 숲, 시민과 함께',
    title: '숲을 지키는 가장 가까운 방법',
    description: '전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.',
    backgroundImageUrl: '/draft/forest-hero-placeholder.svg',
  }];
  const [requestedIndex, setRequestedIndex] = useState(0);
  const index = Math.min(requestedIndex, items.length - 1);
  const banner = items[index];
  const { primary, secondary } = selectActions(banner);
  const selectRelative = (offset) => setRequestedIndex((current) => (
    (Math.min(current, items.length - 1) + offset + items.length) % items.length
  ));

  return (
    <div>
      <section aria-labelledby="home-hero-title" className="overflow-hidden rounded-3xl bg-forest-strong text-white shadow-xl">
        <div className="relative min-h-[31rem]">
          <img className="absolute inset-0 h-full w-full object-cover" alt="" src={banner.backgroundImageUrl || '/draft/forest-hero-placeholder.svg'} />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/75 to-green-800/45" />
          <div className="relative max-w-3xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
            {banner.badgeText && <p className="text-lg font-bold text-green-100">{banner.badgeText}</p>}
            <h1 id="home-hero-title" className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{banner.title}</h1>
            {banner.description && <p className="mt-5 text-xl leading-[1.7] text-green-50">{banner.description}</p>}
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <ActionLink to={primary.link}>{primary.text}</ActionLink>
              {secondary && <ActionLink to={secondary.link} variant="quiet" className="text-white hover:text-green-100">{secondary.text}</ActionLink>}
            </div>
          </div>
        </div>
      </section>
      {items.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3" aria-label="대표 배너 선택">
          <button type="button" className="accessible-touch-target rounded-lg border-2 border-forest-primary px-4 text-lg font-bold text-forest-strong" onClick={() => selectRelative(-1)} aria-label="이전 배너">이전</button>
          {items.map((item, itemIndex) => (
            <button
              type="button"
              key={`${item.title}-${itemIndex}`}
              className="accessible-touch-target min-w-12 rounded-full border-2 border-forest-primary px-3 text-lg font-bold text-forest-strong"
              aria-label={`${itemIndex + 1}번 배너 보기`}
              aria-pressed={itemIndex === index}
              onClick={() => setRequestedIndex(itemIndex)}
            >
              {itemIndex + 1}
            </button>
          ))}
          <button type="button" className="accessible-touch-target rounded-lg border-2 border-forest-primary px-4 text-lg font-bold text-forest-strong" onClick={() => selectRelative(1)} aria-label="다음 배너">다음</button>
        </div>
      )}
    </div>
  );
}
