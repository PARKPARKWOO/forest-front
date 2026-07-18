import ActionLink from '../ui/ActionLink';
import SectionHeading from '../ui/SectionHeading';

const ACTIONS = [
  { title: '숲을 위한 후원', description: '꾸준한 숲 보전 활동을 함께 만들어 주세요.', label: '후원 신청', to: '/donation/individual' },
  { title: '시민 자원봉사', description: '전북의 숲을 돌보는 현장 활동에 참여해 주세요.', label: '자원봉사 보기', to: '/programs/volunteer' },
];

export default function HomeParticipationSection() {
  return (
    <section aria-labelledby="home-participation-title" className="py-12">
      <SectionHeading id="home-participation-title" title="함께 참여하기" description="원하는 방식 하나를 선택해 천천히 확인해 보세요." />
      <div className="grid gap-6 md:grid-cols-2">
        {ACTIONS.map((action) => (
          <article key={action.to} className="rounded-2xl bg-forest-surface p-7">
            <h3 className="text-2xl font-bold text-gray-950">{action.title}</h3>
            <p className="mt-3 text-lg leading-[1.7] text-gray-700">{action.description}</p>
            <ActionLink to={action.to} className="mt-6">{action.label}</ActionLink>
          </article>
        ))}
      </div>
    </section>
  );
}
