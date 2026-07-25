import { Link } from 'react-router-dom';
import AsyncState from '../AsyncState';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDate } from '../../utils/dateFormat';
import { extractPostThumbnail, HOME_IMAGE_FALLBACK } from '../../utils/homeContent';

export default function HomeActivitySection({ posts, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-activities-title" className="py-12">
      <SectionHeading id="home-activities-title" title="최근 활동과 소식" actionLabel="활동 전체 보기" actionTo="/news/activities" />
      {status !== 'success' ? <AsyncState status={status} onRetry={onRetry} isRetrying={isRetrying} /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* `overflow-hidden` clips the card link's own focus ring, so each card hoists the ring to its article. */}
          {posts.slice(0, 3).map((post) => (
            <article key={post.id} aria-label={post.title} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:outline focus-within:outline-forest focus-within:outline-offset-2 focus-within:outline-forest-focus">
              <Link to={`/post/0/${post.id}`} className="group block">
                <img className="aspect-[4/3] w-full object-cover" src={extractPostThumbnail(post) || HOME_IMAGE_FALLBACK} alt="" />
                <div className="p-6">
                  <p className="text-lg font-bold leading-[1.7] text-forest-primary">활동 소식</p>
                  <h3 className="mt-2 line-clamp-2 text-2xl font-bold leading-snug text-gray-950 group-hover:text-forest-strong">{post.title}</h3>
                  <time className="mt-3 block text-lg leading-[1.7] text-gray-600" dateTime={post.updatedAt}>{formatKoreanDate(post.updatedAt)}</time>
                  <span className="accessible-touch-target mt-5 inline-flex items-center text-lg font-bold text-forest-strong underline underline-offset-4">활동 자세히 보기</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
