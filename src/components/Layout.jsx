import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/categoryService';
import kakaoLogo from '../assets/kakao.png';
import naverLogo from '../assets/naver.png';
import naverbandLogo from '../assets/naverband.svg';
import instagramLogo from '../assets/instagram.png';
import daumLogo from '../assets/daum.png';
import facebookLogo from '../assets/facebook.png';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const STATIC_CATEGORIES = [
  {
    id: 'intro',
    name: '소개',
    path: '/intro',
    children: [
      { id: 'intro-about', name: '전북생명의숲은!', path: '/intro/about' },
      { id: 'intro-people', name: '함께하는이들', path: '/intro/people' },
      { id: 'intro-activities', name: '주요활동', path: '/intro/activities' },
      { id: 'intro-location', name: '오시는 길', path: '/intro/location' },
    ],
  },
  {
    id: 'programs',
    name: '프로그램 신청',
    path: '/programs',
    children: [
      { id: 'programs-participate', name: '참여 프로그램', path: '/programs/participate' },
      { id: 'programs-guide', name: '숲 해설가 양성교육', path: '/programs/guide' },
      { id: 'programs-volunteer', name: '자원봉사활동 신청', path: '/programs/volunteer' },
    ],
  },
  {
    id: 'news',
    name: '소식',
    path: '/news',
    children: [
      { id: 'news-notice', name: '공지사항', path: '/news/notice' },
      { id: 'news-activities', name: '전북생명의숲 활동보기', path: '/news/activities' },
    ],
  },
  {
    id: 'resources',
    name: '자료실',
    path: '/resources',
    children: [
      { id: 'resources-documents', name: '문서자료실', path: '/resources/documents' },
      { id: 'resources-jbforest', name: '전북생명의숲자료실', path: '/resources/jbforest' },
    ],
  },
  {
    id: 'donation',
    name: '후원하기',
    path: '/donation',
    children: [
      { id: 'donation-individual', name: '후원 신청', path: '/donation/individual' },
    ],
  },
  {
    id: 'esg',
    name: '기업 사회 공헌활동',
    path: '/esg',
    children: [
      { id: 'esg-activities', name: '기업 ESG 사회 공헌활동', path: '/esg/activities' },
      { id: 'esg-report', name: '기업 ESH 보고서', path: '/esg/report' },
    ],
  },
];

export default function Layout({ children, showLoginModal, setShowLoginModal }) {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const kakaoLoginUrl = process.env.NODE_ENV === 'development' 
    ? 'https://auth.platformholder.site/oauth2/authorization/5'
    : 'https://auth.platformholder.site/oauth2/authorization/6';

  const naverLoginUrl = process.env.NODE_ENV === 'development' 
    ? 'https://auth.platformholder.site/oauth2/authorization/8'
    : 'https://auth.platformholder.site/oauth2/authorization/9';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMouseEnter = (categoryId) => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setHoveredCategory(categoryId);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredCategory(null);
    }, 150); // 150ms 지연
    setHideTimeout(timeout);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* 소셜 미디어 사이드 네비게이션 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        <a 
          href="https://cafe.daum.net/isoup" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
        >
          <img 
            src={daumLogo} 
            alt="다음카페" 
            className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
          />
        </a>
        <a 
          href="https://band.us/n/a1a3A0z3e4uaj" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
        >
          <img 
            src={naverbandLogo} 
            alt="네이버밴드" 
            className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
          />
        </a>
        <a 
          href="https://www.instagram.com/jb_forest/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
        >
          <img 
            src={instagramLogo} 
            alt="인스타그램" 
            className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
          />
        </a>
        <a 
          href="https://www.facebook.com/jbforest" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
        >
          <img 
            src={facebookLogo} 
            alt="페이스북" 
            className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
          />
        </a>
      </div>

      <header className="fixed w-full top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="bg-white shadow-md">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-3">
                <img src={logo} alt="전북생명의숲 로고" className="h-10 w-auto" />
                <span className="text-green-700 text-xl font-bold">전북생명의숲</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700 font-medium">
                        {user.name}님
                      </span>
                      <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        로그아웃
                      </button>
                    </div>
                    
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        관리자
                      </Link>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-green-700 hover:text-green-500 transition-colors duration-200"
                  >
                    로그인
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="border-b border-gray-200/80 bg-white/70">
          <div className="container mx-auto px-6">
            <ul className="flex justify-center space-x-2">
              {/* 정적 카테고리 */}
              {STATIC_CATEGORIES.map((category) => (
                <li 
                  key={category.id}
                  className="relative group"
                  onMouseEnter={() => handleMouseEnter(category.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to={category.path}
                    className={`block px-4 py-4 text-gray-600 hover:text-green-700 
                      hover:bg-green-50 transition-colors duration-200
                      ${category.children?.length > 0 ? 'pr-8' : ''}
                    `}
                  >
                    <span className="relative">
                      {category.name}
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-600 
                        transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </span>
                    {category.children?.length > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 transform 
                        group-hover:translate-y-0 group-hover:rotate-180 transition-all duration-300">
                        <svg 
                          className="w-4 h-4 fill-current text-gray-400 group-hover:text-green-600" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                        </svg>
                      </span>
                    )}
                  </Link>
                  
                  {/* 하위 카테고리 드롭다운 */}
                  {hoveredCategory === category.id && category.children?.length > 0 && (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-0 
                        bg-white rounded-xl shadow-lg shadow-green-100/50 min-w-[220px] 
                        transform opacity-0 -translate-y-2 group-hover:translate-y-0 
                        group-hover:opacity-100 transition-all duration-300 ease-out 
                        border border-gray-100/80 overflow-hidden z-50"
                      onMouseEnter={() => handleMouseEnter(category.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <ul className="py-2">
                        {category.children.map((subCategory) => (
                          <li key={subCategory.id}>
                            <Link
                              to={subCategory.path}
                              className="block w-full text-left px-6 py-3 text-gray-600
                                hover:text-green-700 hover:bg-green-50/50 text-sm
                                transition-all duration-200 ease-out"
                              onClick={() => setSelectedCategoryId(subCategory.id)}
                            >
                              {subCategory.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}

              {/* 구분선 */}
              <li className="border-l border-gray-200 mx-2"></li>

              {/* 동적 카테고리 */}
              {isLoading ? (
                <li className="py-4 text-gray-600 animate-pulse">카테고리 로딩중...</li>
              ) : (
                categories?.map((category) => (
                  <li 
                    key={category.id}
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={`/category/${category.id}`}
                      className={`block px-6 py-4 text-base font-medium rounded-md
                        transition-all duration-300 ease-out group-hover:bg-gray-50
                        ${selectedCategoryId === category.id 
                          ? 'text-green-700 font-semibold' 
                          : 'text-gray-700 hover:text-green-700'
                        }
                        ${category.children?.length > 0 ? 'pr-8' : ''}
                      `}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <span className="relative">
                        {category.name}
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-600 
                          transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                      </span>
                      {category.children?.length > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 transform 
                          group-hover:translate-y-0 group-hover:rotate-180 transition-all duration-300">
                          <svg 
                            className="w-4 h-4 fill-current text-gray-400 group-hover:text-green-600" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                          </svg>
                        </span>
                      )}
                    </Link>
                    
                    {/* 하위 카테고리 드롭다운 */}
                    {hoveredCategory === category.id && category.children?.length > 0 && (
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-0 
                          bg-white rounded-xl shadow-lg shadow-green-100/50 min-w-[220px] 
                          transform opacity-0 -translate-y-2 group-hover:translate-y-0 
                          group-hover:opacity-100 transition-all duration-300 ease-out 
                          border border-gray-100/80 overflow-hidden z-50"
                        onMouseEnter={() => handleMouseEnter(category.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <ul className="py-2">
                          {category.children.map((subCategory) => (
                            <li key={subCategory.id}>
                              <Link
                                to={subCategory.path}
                                className="block w-full text-left px-6 py-3 text-gray-600
                                  hover:text-green-700 hover:bg-green-50/50 text-sm
                                  transition-all duration-200 ease-out"
                                onClick={() => setSelectedCategoryId(subCategory.id)}
                              >
                                {subCategory.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-10 mt-32">
        {children}
      </main>

      <footer className="bg-gradient-to-r from-green-900 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-100">전북생명의숲</h3>
              <p className="text-green-200 mb-6">
                숲을 통해 생명의 가치를 전하고 지속가능한 미래를 만들어갑니다.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://cafe.daum.net/isoup" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-700 hover:bg-green-600 p-2 rounded-full transition-colors duration-300"
                >
                  <img src={daumLogo} alt="다음카페" className="w-6 h-6" />
                </a>
                <a 
                  href="https://band.us/n/a1a3A0z3e4uaj" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-700 hover:bg-green-600 p-2 rounded-full transition-colors duration-300"
                >
                  <img src={naverbandLogo} alt="네이버밴드" className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.instagram.com/jb_forest/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-700 hover:bg-green-600 p-2 rounded-full transition-colors duration-300"
                >
                  <img src={instagramLogo} alt="인스타그램" className="w-6 h-6" />
                </a>
                <a 
                  href="https://www.facebook.com/jbforest" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-700 hover:bg-green-600 p-2 rounded-full transition-colors duration-300"
                >
                  <img src={facebookLogo} alt="페이스북" className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-100">연락처</h3>
              <ul className="space-y-3 text-green-200">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  063-231-4455
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  forestjb@hanmail.net
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  전북특별자치도 전주시 덕진구 중상보로30, 3층
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-100">바로가기</h3>
              <ul className="space-y-2 text-green-200">
                <li>
                  <Link to="/intro" className="hover:text-white transition-colors duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    소개
                  </Link>
                </li>
                <li>
                  <Link to="/programs" className="hover:text-white transition-colors duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    프로그램
                  </Link>
                </li>
                <li>
                  <Link to="/donation" className="hover:text-white transition-colors duration-200 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    후원하기
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-green-700 flex flex-col md:flex-row justify-between items-center">
            <p className="text-green-300 text-sm mb-4 md:mb-0">
              &copy; 2024 전북생명의숲. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-green-300 hover:text-white text-sm transition-colors duration-200">개인정보처리방침</a>
              <a href="#" className="text-green-300 hover:text-white text-sm transition-colors duration-200">이용약관</a>
              <a href="#" className="text-green-300 hover:text-white text-sm transition-colors duration-200">사이트맵</a>
            </div>
          </div>
        </div>
      </footer>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
            <div className="space-y-4">
              <a 
                href={kakaoLoginUrl}
                className="flex items-center justify-center w-full bg-yellow-300 hover:bg-yellow-400 
                  text-black py-3 rounded-lg transition-colors duration-200"
              >
                <img src={kakaoLogo} alt="카카오 로그인" className="h-5 w-auto mr-2" />
                카카오로 시작하기
              </a>
              
              <a 
                href={naverLoginUrl}
                className="flex items-center justify-center w-full bg-[#03C75A] hover:bg-[#02b351] 
                  text-white py-3 rounded-lg transition-colors duration-200"
              >
                <img src={naverLogo} alt="네이버 로그인" className="h-5 w-auto mr-2" />
                네이버로 시작하기
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  