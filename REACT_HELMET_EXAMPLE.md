# React Helmet Async 사용 예제

페이지별 SEO 최적화를 위한 메타태그 설정 가이드입니다.

## 📦 설치

```bash
cd cms-react-project
npm install react-helmet-async
```

---

## 🔧 설정

### 1. App.jsx에 Provider 추가

```javascript
// src/App.jsx
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        {/* 기존 라우터 */}
      </BrowserRouter>
    </HelmetProvider>
  );
}
```

---

## 📄 페이지별 사용 예제

### 예제 1: 메인 페이지 (Home.jsx)

```javascript
import SEO from '../components/SEO';

export default function Home() {
  return (
    <>
      <SEO
        title="전북생명의숲 | 숲과 함께하는 녹색 미래"
        description="전북 지역의 숲을 보호하고 시민들과 함께하는 환경운동 단체입니다."
        url="/"
      />
      
      <div>
        {/* 페이지 컨텐츠 */}
      </div>
    </>
  );
}
```

---

### 예제 2: 프로그램 목록 (Programs.jsx)

```javascript
import SEO from '../components/SEO';
import { useParams } from 'react-router-dom';

export default function Programs() {
  const { subCategory } = useParams();
  
  const getSEO = () => {
    switch(subCategory) {
      case 'participate':
        return {
          title: '참여 프로그램',
          description: '전북생명의숲의 다양한 숲 체험 참여 프로그램을 확인하세요.',
          url: '/programs/participate'
        };
      case 'guide':
        return {
          title: '숲 해설가 양성교육',
          description: '숲 해설가 양성을 위한 전문 교육 프로그램입니다.',
          url: '/programs/guide'
        };
      case 'volunteer':
        return {
          title: '자원봉사활동 신청',
          description: '숲을 가꾸고 보전하는 자원봉사활동에 참여하세요.',
          url: '/programs/volunteer'
        };
      default:
        return {
          title: '프로그램 신청',
          description: '전북생명의숲의 다양한 프로그램을 확인하고 신청하세요.',
          url: '/programs'
        };
    }
  };
  
  const seo = getSEO();
  
  return (
    <>
      <SEO {...seo} />
      
      <div>
        {/* 프로그램 목록 */}
      </div>
    </>
  );
}
```

---

### 예제 3: 프로그램 상세 (ProgramDetail.jsx)

```javascript
import SEO from '../components/SEO';
import { useQuery } from '@tanstack/react-query';
import { fetchProgramById } from '../services/programService';

export default function ProgramDetail() {
  const { id } = useParams();
  
  const { data: program } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetchProgramById(id),
  });
  
  if (!program) return <div>로딩 중...</div>;
  
  return (
    <>
      <SEO
        title={program.title}
        description={program.content.substring(0, 150)}
        url={`/programs/detail/${program.id}`}
        type="article"
      >
        {/* 구조화된 데이터 추가 */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": program.title,
            "description": program.content,
            "startDate": program.eventDate,
            "location": {
              "@type": "Place",
              "name": "전북생명의숲"
            },
            "organizer": {
              "@type": "Organization",
              "name": "전북생명의숲",
              "url": "https://forest.platformholder.site"
            }
          })}
        </script>
      </SEO>
      
      <div>
        <h1>{program.title}</h1>
        {/* 프로그램 상세 */}
      </div>
    </>
  );
}
```

---

### 예제 4: 게시물 상세 (PostDetail.jsx)

```javascript
import SEO from '../components/SEO';

export default function PostDetail({ post }) {
  // 첫 번째 이미지 추출 (있으면)
  const firstImage = post.images && post.images.length > 0 
    ? post.images[0] 
    : 'https://forest.platformholder.site/og-image.jpg';
  
  return (
    <>
      <SEO
        title={post.title}
        description={post.content.substring(0, 150)}
        image={firstImage}
        url={`/community/post/${post.id}`}
        type="article"
        keywords={`${post.title}, 전북생명의숲, 커뮤니티, 소식`}
      >
        {/* 게시물 구조화된 데이터 */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.content.substring(0, 150),
            "image": firstImage,
            "datePublished": post.createdAt,
            "dateModified": post.updatedAt,
            "author": {
              "@type": "Person",
              "name": post.authorName
            },
            "publisher": {
              "@type": "Organization",
              "name": "전북생명의숲",
              "logo": {
                "@type": "ImageObject",
                "url": "https://forest.platformholder.site/logo.png"
              }
            }
          })}
        </script>
      </SEO>
      
      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

---

## 🎯 빠른 시작 가이드

### 1단계: 설치
```bash
npm install react-helmet-async
```

### 2단계: App.jsx 수정
```javascript
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  {/* 앱 컨텐츠 */}
</HelmetProvider>
```

### 3단계: 각 페이지에 SEO 추가
```javascript
import SEO from '../components/SEO';

<SEO title="페이지 제목" description="페이지 설명" url="/현재경로" />
```

### 4단계: 배포 및 확인
```bash
npm run build
# 배포 후
curl -I https://forest.platformholder.site
# 또는
https://www.opengraph.xyz/ 에서 확인
```

---

## 💡 Pro Tips

### 1. 이미지 최적화
```javascript
// 모든 이미지에 alt 추가
<img src={url} alt="전북생명의숲 숲 체험 프로그램" />
```

### 2. Heading 태그 계층
```javascript
<h1>페이지 제목 (1개만)</h1>
<h2>섹션 제목</h2>
<h3>하위 섹션</h3>
```

### 3. 시맨틱 HTML
```javascript
<article>  {/* 게시물 */}
<section>  {/* 섹션 */}
<nav>      {/* 네비게이션 */}
<header>   {/* 헤더 */}
<footer>   {/* 푸터 */}
```

### 4. 내부 링크
```javascript
// 관련 프로그램 링크
<Link to={`/programs/detail/${relatedProgram.id}`}>
  관련 프로그램 보기
</Link>
```

---

## 📊 성과 측정

### Google Search Console
- 노출수 (Impressions)
- 클릭수 (Clicks)
- CTR (Click-Through Rate)
- 평균 게재 순위

### 주요 검색어 추적
- "전북 숲 체험"
- "전라북도 자원봉사"
- "숲 해설가 교육"
- "전북 환경단체"

---

**예상 노출 시간**: 구글 1-3일, 네이버 3-7일, 다음 1-2주 🚀

