import { Helmet } from 'react-helmet-async';

/**
 * SEO 컴포넌트
 * 페이지별로 메타태그를 동적으로 설정
 */
export default function SEO({ 
  title = '전북생명의숲',
  description = '전북생명의숲은 전북 지역의 숲을 보호하고 시민들과 함께하는 숲 체험 프로그램, 숲 해설가 양성교육, 자원봉사활동을 운영합니다.',
  keywords = '전북생명의숲, 숲체험, 숲해설가, 자원봉사, 환경보호, 전북, 숲교육, 생태보전',
  image = 'https://forest-front-psi.vercel.app/og-image.jpg',
  url,
  type = 'website',
  children
}) {
  const fullTitle = title === '전북생명의숲' ? title : `${title} | 전북생명의숲`;
  const fullUrl = url ? `https://forest-front-psi.vercel.app${url}` : 'https://forest-front-psi.vercel.app';

  return (
    <Helmet>
      {/* 기본 메타태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph (Facebook, 카카오톡) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="전북생명의숲" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* 캐노니컬 URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* 추가 스크립트나 메타태그 */}
      {children}
    </Helmet>
  );
}

