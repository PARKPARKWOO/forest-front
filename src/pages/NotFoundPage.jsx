import ActionLink from '../components/ui/ActionLink';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  return (
    <>
      {/*
        SPA 라 없는 주소도 서버는 200 + index.html 을 돌려준다. 검색엔진은 이걸 soft-404 로
        보고 색인 품질을 깎으므로, 최소한 색인은 막는다. `path` 를 넘기지 않아 캐노니컬이
        홈으로 잡히는 것도 의도한 동작이다 — 없는 주소가 자기 자신을 대표 URL 로 주장하면 안 된다.
        근본 해결(실제 404 상태코드)은 서버·Vercel 단에서 처리해야 한다.
      */}
      <SEO title="페이지를 찾을 수 없습니다" noIndex />
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12" aria-labelledby="not-found-title">
        <p className="font-bold text-forest-primary">404</p>
        <h1 id="not-found-title" className="mt-2 text-3xl font-bold text-gray-950">페이지를 찾을 수 없습니다</h1>
        <p className="mt-4 text-lg leading-[1.7] text-gray-700">주소가 바뀌었거나 삭제된 페이지입니다. 안전한 메뉴에서 다시 시작해 주세요.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ActionLink to="/">홈으로 이동</ActionLink>
          <ActionLink to="/programs/participate" variant="secondary">프로그램 보기</ActionLink>
        </div>
      </section>
    </>
  );
}
