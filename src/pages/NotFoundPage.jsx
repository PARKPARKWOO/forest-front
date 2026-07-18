import ActionLink from '../components/ui/ActionLink';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12" aria-labelledby="not-found-title">
      <p className="font-bold text-forest-primary">404</p>
      <h1 id="not-found-title" className="mt-2 text-3xl font-bold text-gray-950">페이지를 찾을 수 없습니다</h1>
      <p className="mt-4 text-lg leading-[1.7] text-gray-700">주소가 바뀌었거나 삭제된 페이지입니다. 안전한 메뉴에서 다시 시작해 주세요.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ActionLink to="/">홈으로 이동</ActionLink>
        <ActionLink to="/programs/participate" variant="secondary">프로그램 보기</ActionLink>
      </div>
    </section>
  );
}
