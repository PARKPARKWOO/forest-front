import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_BACKGROUND_IMAGE_URL =
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1600&q=80';
const DEFAULT_SIDE_IMAGE_URL =
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80';

const isExternalLink = (url = '') => /^https?:\/\//i.test(url);
const isAbsoluteUrl = (url = '') => /^(https?:\/\/|data:|blob:)/i.test(url);
const isProtocolRelativeUrl = (url = '') => /^\/\//.test(url);

const getApiOrigin = () => (process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080'
  : 'https://forest.platformholder.site');

const toImageCandidates = (rawValue, fallback) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  const candidates = [];

  if (value) {
    if (isAbsoluteUrl(value)) {
      candidates.push(value);
    } else if (isProtocolRelativeUrl(value)) {
      candidates.push(`https:${value}`);
    } else if (value.startsWith('/')) {
      candidates.push(`${window.location.origin}${value}`);
      candidates.push(`${getApiOrigin()}${value}`);
    } else {
      candidates.push(value);
    }
  }

  candidates.push(fallback);
  return [...new Set(candidates.filter(Boolean))];
};

const BannerImage = ({ src, fallbackSrc, alt, className }) => {
  const candidates = useMemo(() => toImageCandidates(src, fallbackSrc), [src, fallbackSrc]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const currentSrc = candidates[Math.min(candidateIndex, candidates.length - 1)];

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        setCandidateIndex((prev) => Math.min(prev + 1, candidates.length - 1));
      }}
    />
  );
};

const BannerButton = ({ text, link, className, isPreview }) => {
  if (isPreview) {
    return (
      <span className={className}>
        {text}
      </span>
    );
  }

  if (isExternalLink(link)) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {text}
      </a>
    );
  }

  return (
    <Link to={link || '/'} className={className}>
      {text}
    </Link>
  );
};

export default function HomeBannerHero({ banner, isPreview = false, className = '' }) {
  return (
    <div className={`relative rounded-3xl shadow-xl overflow-hidden ${className}`.trim()}>
      <BannerImage
        src={banner.backgroundImageUrl}
        fallbackSrc={DEFAULT_BACKGROUND_IMAGE_URL}
        alt="초록 숲길 풍경"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-green-800/68 to-green-600/58" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.32),transparent_42%)]" />

      <div className="relative grid md:grid-cols-2 items-center">
        <div className="p-8 md:p-12 lg:p-14">
          <span
            className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-4 py-1.5 text-sm md:text-base font-semibold tracking-wide mb-5"
            style={{ color: banner.badgeTextColor }}
          >
            {banner.badgeText}
          </span>
          <h1
            className="text-3xl md:text-4xl lg:text-[2.7rem] leading-tight font-bold mb-4"
            style={{ color: banner.titleColor }}
          >
            {banner.title}
          </h1>
          <p
            className="text-base md:text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: banner.descriptionColor }}
          >
            {banner.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <BannerButton
              text={banner.primaryButtonText}
              link={banner.primaryButtonLink}
              isPreview={isPreview}
              className="bg-white text-green-700 text-base md:text-lg px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors duration-300"
            />
            <BannerButton
              text={banner.secondaryButtonText}
              link={banner.secondaryButtonLink}
              isPreview={isPreview}
              className="bg-emerald-700/90 text-white text-base md:text-lg px-8 py-3 rounded-full font-semibold hover:bg-emerald-800 transition-colors duration-300 border border-emerald-300/70"
            />
          </div>
        </div>

        <div className="hidden md:block p-8 lg:p-10">
          <div className="rounded-2xl overflow-hidden border border-white/30 shadow-2xl bg-white/10 backdrop-blur-sm">
            <BannerImage
              src={banner.sideImageUrl}
              fallbackSrc={DEFAULT_SIDE_IMAGE_URL}
              alt="숲속 자연 배너"
              className="w-full h-72 object-cover"
            />
            <div className="px-5 py-4 text-green-50">
              <p className="text-base font-semibold">{banner.sideTitle}</p>
              <p className="mt-1 text-sm text-green-100/95">
                {banner.sideDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
