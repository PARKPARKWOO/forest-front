import { Link } from 'react-router-dom';
import AsyncState from '../AsyncState';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDate } from '../../utils/dateFormat';

export default function HomeNoticeSection({ notices, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-notices-title" className="py-12">
      <SectionHeading id="home-notices-title" title="공지사항" actionLabel="공지 전체 보기" actionTo="/news/notice" />
      {status !== 'success' ? (
        <AsyncState
          status={status}
          title={status === 'error' ? '공지를 불러오지 못했습니다' : status === 'empty' ? '등록된 공지가 없습니다' : undefined}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-5">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link to={`/news/notice/${notice.id}`} className="group flex min-h-16 items-center justify-between gap-4 py-4">
                <span className="line-clamp-2 text-lg font-semibold leading-snug text-gray-950 group-hover:text-forest-strong">
                  {notice.dynamicFields?.important && (
                    <span className="mr-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-base font-medium text-red-800">[중요]</span>
                  )}
                  {notice.title}
                </span>
                <time className="shrink-0 text-lg leading-[1.7] text-gray-600" dateTime={notice.updatedAt}>{formatKoreanDate(notice.updatedAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
