import AsyncState from '../AsyncState';
import ActionLink from '../ui/ActionLink';
import SectionHeading from '../ui/SectionHeading';
import { formatKoreanDateRange, formatKoreanDateTime } from '../../utils/dateFormat';
import { formatCapacity } from '../../utils/homeContent';
import { getProgramStatusInfo } from '../../utils/programStatus';

export default function HomeProgramSection({ programs, status, onRetry, isRetrying }) {
  return (
    <section aria-labelledby="home-programs-title" className="py-12">
      <SectionHeading id="home-programs-title" title="진행 중인 프로그램" description="지금 참여할 수 있는 숲 활동을 먼저 확인해 보세요." actionLabel="프로그램 전체 보기" actionTo="/programs/participate" />
      {status !== 'success' ? (
        <AsyncState
          status={status}
          title={status === 'error' ? '프로그램을 불러오지 못했습니다' : status === 'empty' ? '등록된 프로그램이 없습니다' : undefined}
          onRetry={onRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {programs.map((program) => {
            const statusInfo = getProgramStatusInfo(program.status);
            return (
              <article key={program.id} aria-label={program.title} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className={`w-fit rounded-full px-3 py-1 text-lg font-bold leading-[1.7] ${statusInfo.className}`}>{statusInfo.text}</span>
                <h3 className="mt-4 text-2xl font-bold leading-snug text-gray-950">{program.title}</h3>
                <dl className="mt-5 space-y-3 text-lg leading-[1.7] text-gray-700">
                  <div><dt className="font-bold text-gray-950">신청 기간</dt><dd>{formatKoreanDateRange(program.applyStartDate, program.applyEndDate)}</dd></div>
                  <div><dt className="font-bold text-gray-950">행사 일시</dt><dd>{formatKoreanDateTime(program.eventDate) || '상세에서 확인'}</dd></div>
                  <div><dt className="font-bold text-gray-950">정원</dt><dd>{formatCapacity(program.maxParticipants)}</dd></div>
                </dl>
                <ActionLink to={`/programs/detail/${program.id}`} className="mt-6 w-full">자세히 보기</ActionLink>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
