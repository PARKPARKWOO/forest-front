# ✅ SEO 체크리스트

## 📁 파일 준비 완료

- [x] `public/robots.txt` - 크롤러 접근 규칙
- [x] `public/sitemap.xml` - 사이트 구조 정보
- [x] `index.html` - 기본 메타태그 추가
- [x] `src/components/SEO.jsx` - 동적 메타태그 컴포넌트
- [x] 가이드 문서 작성

---

## 🚀 즉시 실행할 것

### 1. 검색엔진 등록 (필수)

#### Google Search Console
1. [ ] https://search.google.com/search-console 접속
2. [ ] 속성 추가: `https://forest.platformholder.site`
3. [ ] 소유권 확인 (HTML 파일 또는 메타태그)
4. [ ] 사이트맵 제출: `/sitemap.xml`
5. [ ] 주요 페이지 URL 검사 및 인덱싱 요청

#### 네이버 서치어드바이저
1. [ ] https://searchadvisor.naver.com 접속
2. [ ] 사이트 등록: `https://forest.platformholder.site`
3. [ ] 소유권 확인 (HTML 파일 또는 메타태그)
4. [ ] 사이트맵 제출: `/sitemap.xml`
5. [ ] 웹페이지 수집 요청 (주요 페이지)

#### Daum 검색등록
1. [ ] https://register.search.daum.net/index.daum 접속
2. [ ] 사이트 정보 입력 및 등록 신청

---

### 2. 소유권 확인 코드 입력

#### index.html 수정
```bash
# Google 코드 입력 (32줄)
<meta name="google-site-verification" content="여기에_구글_코드" />

# 네이버 코드 입력 (29줄)
<meta name="naver-site-verification" content="여기에_네이버_코드" />
```

---

## 🎨 추가 최적화 (1주일 내)

### 3. react-helmet-async 설치
```bash
npm install react-helmet-async
```

### 4. App.jsx 수정
```javascript
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  {/* 기존 코드 */}
</HelmetProvider>
```

### 5. 주요 페이지에 SEO 컴포넌트 추가

```javascript
// Programs.jsx
import SEO from '../components/SEO';

<SEO 
  title="참여 프로그램" 
  description="숲 체험 및 환경 보호 프로그램" 
  url="/programs/participate"
/>
```

---

## 📊 Pre-rendering 설정 (선택, 고급)

### 6. react-snap 설치
```bash
npm install --save-dev react-snap
```

### 7. package.json 수정
```json
{
  "scripts": {
    "postbuild": "react-snap"
  },
  "reactSnap": {
    "include": [
      "/",
      "/intro",
      "/programs",
      "/programs/participate",
      "/programs/guide",
      "/programs/volunteer",
      "/news",
      "/community",
      "/support"
    ]
  }
}
```

---

## 🔍 검증

### 8. 배포 후 확인

#### robots.txt
```
https://forest.platformholder.site/robots.txt
```

#### sitemap.xml
```
https://forest.platformholder.site/sitemap.xml
```

#### 메타태그
```
1. 페이지 소스 보기 (우클릭)
2. <head> 태그 확인
3. og:title, og:description 확인
```

#### Open Graph 테스트
```
https://www.opengraph.xyz/
→ URL 입력 후 미리보기 확인
```

#### 구조화된 데이터 테스트
```
https://search.google.com/test/rich-results
→ URL 또는 코드 입력
```

---

## ⏱️ 예상 소요 시간

| 작업 | 소요 시간 |
|-----|----------|
| 검색엔진 등록 | 30분 |
| react-helmet 설치 및 적용 | 2시간 |
| Pre-rendering 설정 | 1시간 |
| 인덱싱 대기 | 1-7일 |

---

## 🎯 우선순위

### High Priority (즉시)
1. ✅ Google Search Console 등록
2. ✅ 네이버 서치어드바이저 등록
3. ✅ 사이트맵 제출
4. ✅ 주요 페이지 인덱싱 요청

### Medium Priority (1주일 내)
5. ⚠️ react-helmet-async 적용
6. ⚠️ 구조화된 데이터 추가
7. ⚠️ 이미지 alt 속성 추가

### Low Priority (1개월 내)
8. ⏳ react-snap 설정
9. ⏳ Google Analytics 연동
10. ⏳ 백링크 구축

---

## 📞 도움말

- **SEO 가이드**: `SEO_GUIDE.md` 참고
- **React Helmet 예제**: `REACT_HELMET_EXAMPLE.md` 참고
- **문의**: forestjb@hanmail.net

