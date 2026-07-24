import { useEffect, useId, useMemo, useState } from 'react';
import ActionLink from '../../design-system/primitives/ActionLink';
import Button from '../../design-system/primitives/Button';
import { getActionControlClassName } from '../../design-system/primitives/actionControlStyles';
import {
  createHeroImageCandidates,
  normalizeHomeBanners,
  selectHomeHeroActions,
} from './homeHeroModel';

const isExternalLink = (link = '') => /^https?:\/\//i.test(link);

const getApiOrigin = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (/^https?:\/\//i.test(configuredBaseUrl || '')) return new URL(configuredBaseUrl).origin;
  return import.meta.env.DEV ? 'http://localhost:8080' : 'https://forest.platformholder.site';
};

function HeroBackgroundImage({ src }) {
  const candidates = useMemo(() => createHeroImageCandidates(src, {
    pageOrigin: window.location.origin,
    apiOrigin: getApiOrigin(),
  }), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => setCandidateIndex(0), [candidates]);
  const currentSrc = candidates[Math.min(candidateIndex, candidates.length - 1)];

  return (
    <img
      data-hero-part="background"
      className="absolute inset-0 h-full w-full object-cover"
      alt=""
      src={currentSrc}
      onError={() => setCandidateIndex((current) => Math.min(current + 1, candidates.length - 1))}
    />
  );
}

export default function HomeHero({ banners = [], isPreview = false, headingLevel = 1 }) {
  const items = normalizeHomeBanners(banners);
  const [requestedIndex, setRequestedIndex] = useState(0);
  const index = Math.min(requestedIndex, items.length - 1);
  const banner = items[index];
  const titleId = `${useId()}-title`;
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  const { primary, secondary } = selectHomeHeroActions(banner);
  const selectRelative = (offset) => setRequestedIndex((current) => (
    (Math.min(current, items.length - 1) + offset + items.length) % items.length
  ));
  const actionProps = (link) => ({
    ...(isExternalLink(link)
      ? { href: link, target: '_blank', rel: 'noopener noreferrer' }
      : { to: link }),
  });
  const renderAction = (action, variant = 'primary') => (
    isPreview ? (
      <span data-hero-action className={getActionControlClassName({ variant, size: 'lg' })}>{action.text}</span>
    ) : (
      <ActionLink data-hero-action {...actionProps(action.link)} variant={variant}>{action.text}</ActionLink>
    )
  );

  return (
    <div data-component="home-hero">
      <section data-hero-part="surface" aria-labelledby={titleId} className="overflow-hidden rounded-3xl bg-forest-strong text-forest-text-inverse shadow-xl">
        <div className="relative min-h-[31rem]">
          <HeroBackgroundImage src={banner.backgroundImageUrl} />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/75 to-green-800/45" />
          <div className="relative max-w-3xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
            {banner.badgeText && <p data-hero-part="badge" className="text-forest-body font-bold text-forest-text-inverse">{banner.badgeText}</p>}
            <Heading id={titleId} data-hero-part="title" className="mt-4 text-forest-heading-1 font-bold">{banner.title}</Heading>
            {banner.description && <p data-hero-part="description" className="mt-5 text-forest-body text-forest-text-inverse">{banner.description}</p>}
            <div data-hero-part="actions" className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {renderAction(primary)}
              {secondary && renderAction(secondary, 'inverseQuiet')}
            </div>
          </div>
        </div>
      </section>
      {items.length > 1 && (
        <div role="group" className="mt-4 flex flex-wrap items-center justify-center gap-3" aria-label="대표 배너 선택">
          <Button variant="secondary" onClick={() => selectRelative(-1)} aria-label="이전 배너">이전</Button>
          {items.map((item, itemIndex) => (
            <Button key={`${item.title}-${itemIndex}`} variant={itemIndex === index ? 'primary' : 'secondary'}
              aria-label={`${itemIndex + 1}번 배너 보기`} aria-pressed={itemIndex === index}
              onClick={() => setRequestedIndex(itemIndex)}>{itemIndex + 1}</Button>
          ))}
          <Button variant="secondary" onClick={() => selectRelative(1)} aria-label="다음 배너">다음</Button>
        </div>
      )}
    </div>
  );
}
