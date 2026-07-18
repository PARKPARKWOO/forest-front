import { Link } from 'react-router-dom';
import AsyncState from '../AsyncState';
import ActionLink from '../ui/ActionLink';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDate } from '../../utils/dateFormat';

export default function HomeCommunitySection({ categories, postsByCategory, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-community-title" className="py-12">
      <SectionHeading id="home-community-title" title="커뮤니티 게시판" description="전북의 숲 이야기를 게시판별로 확인하세요." />
      {status !== 'success' ? <AsyncState status={status} onRetry={onRetry} isRetrying={isRetrying} /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-2xl font-bold text-gray-950">{category.name}</h3>
              <ul className="mt-4 divide-y divide-gray-200">
                {(postsByCategory[category.id] || []).slice(0, 3).map((post) => (
                  <li key={post.id}><Link className="flex min-h-14 items-center justify-between gap-3 py-3 text-lg leading-[1.7]" to={`/post/${category.id}/${post.id}`}><span className="line-clamp-2 font-semibold">{post.title}</span><time className="shrink-0 text-lg leading-[1.7] text-gray-600">{formatKoreanDate(post.updatedAt)}</time></Link></li>
                ))}
              </ul>
              <ActionLink to={`/category/${category.id}`} variant="quiet" className="mt-4">{category.name} 전체 보기</ActionLink>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
