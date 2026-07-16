import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/categoryService';
import naverbandLogo from '../assets/naverband.svg';
import instagramLogo from '../assets/instagram.png';
import daumLogo from '../assets/daum.png';
import facebookLogo from '../assets/facebook.png';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { clearPendingNavigation } from '../utils/pendingNavigation';
import {
  clearAllProgramApplicationDrafts,
  clearExpiredProgramApplicationDrafts,
} from '../utils/programApplicationDraft';
import useFocusTrap from '../hooks/useFocusTrap';
import LoginOptions from './LoginOptions';

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

const getCategoryPath = (category, categoryType) => (
  categoryType === 'dynamic' ? `/category/${category.id}` : category.path
);

function MobileCategoryItem({
  category,
  categoryType,
  pathname,
  expandedCategories,
  onToggle,
  onNavigate,
}) {
  const categoryPath = getCategoryPath(category, categoryType);
  const categoryKey = `${categoryType}-${category.id}`;
  const panelId = `mobile-category-${categoryKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const hasChildren = category.children?.length > 0;
  const isExpanded = Boolean(expandedCategories[categoryKey]);
  const isCurrentPage = pathname === categoryPath;
  const isActivePath = isCurrentPage || pathname.startsWith(`${categoryPath}/`);

  return (
    <li>
      <div className={`flex items-stretch rounded-lg ${isActivePath ? 'bg-green-50' : ''}`}>
        <Link
          to={categoryPath}
          aria-current={isCurrentPage ? 'page' : undefined}
          className={`flex min-h-12 flex-1 items-center px-4 py-3 text-lg font-medium
            transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-inset focus-visible:ring-green-700
            ${isActivePath ? 'text-green-800' : 'text-gray-800 hover:bg-gray-50 hover:text-green-800'}`}
          onClick={() => onNavigate(category.id)}
        >
          {category.name}
        </Link>

        {hasChildren && (
          <button
            type="button"
            aria-label={`${category.name} 하위 메뉴 ${isExpanded ? '접기' : '펼치기'}`}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-gray-600
              hover:bg-green-100 hover:text-green-800 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-inset focus-visible:ring-green-700"
            onClick={() => onToggle(categoryKey)}
          >
            <svg
              aria-hidden="true"
              className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && (
        <ul
          id={panelId}
          className={`ml-4 border-l-2 border-green-100 pl-2 ${isExpanded ? 'block' : 'hidden'}`}
        >
          {category.children.map((subCategory) => (
            <MobileCategoryItem
              key={`${categoryType}-${subCategory.id}`}
              category={subCategory}
              categoryType={categoryType}
              pathname={pathname}
              expandedCategories={expandedCategories}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Layout({ children, showLoginModal, setShowLoginModal }) {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState({});
  const mobileMenuButtonRef = useRef(null);
  const mobileNavigationRef = useRef(null);
  const mobileMenuCloseButtonRef = useRef(null);
  const loginCloseButtonRef = useRef(null);
  const loginDialogRef = useRef(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleLogout = async () => {
    try {
      await logout();
      clearAllProgramApplicationDrafts();
      clearPendingNavigation();
      navigate('/');
    } catch {
      window.alert('로그아웃하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setExpandedMobileCategories({});
  };

  const closeLoginModal = () => {
    clearPendingNavigation();
    setShowLoginModal(false);
  };

  useFocusTrap({
    containerRef: mobileNavigationRef,
    initialFocusRef: mobileMenuCloseButtonRef,
    isActive: isMobileMenuOpen,
    onEscape: closeMobileMenu,
  });
  useFocusTrap({
    containerRef: loginDialogRef,
    initialFocusRef: loginCloseButtonRef,
    isActive: Boolean(showLoginModal),
    onEscape: closeLoginModal,
  });

  const handleMobileLogout = async () => {
    closeMobileMenu();
    await handleLogout();
  };

  const handleMobileNavigate = (categoryId) => {
    setSelectedCategoryId(categoryId);
    closeMobileMenu();
  };

  const toggleMobileCategory = (categoryKey) => {
    setExpandedMobileCategories((current) => ({
      ...current,
      [categoryKey]: !current[categoryKey],
    }));
  };

  useEffect(() => {
    clearExpiredProgramApplicationDrafts();
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');

    const closeForDesktop = (event) => {
      if (event.matches) {
        setIsMobileMenuOpen(false);
        setExpandedMobileCategories({});
      }
    };

    document.body.style.overflow = 'hidden';
    desktopMediaQuery.addEventListener('change', closeForDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopMediaQuery.removeEventListener('change', closeForDesktop);
    };
  }, [isMobileMenuOpen]);

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

  const isHomeRoute = location.pathname === '/';
  const mainClassName = isHomeRoute
    ? 'w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-10 mt-20 lg:mt-32'
    : 'container mx-auto px-6 py-10 mt-20 lg:mt-32';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* 소셜 미디어 사이드 네비게이션 */}
      <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
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
          <div className="container mx-auto h-[72px] px-4 sm:px-6">
            <div className="flex h-full justify-between items-center">
              <Link
                to="/"
                aria-current={isHomeRoute ? 'page' : undefined}
                className="flex min-h-12 items-center space-x-3 rounded-md focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-green-700"
                onClick={closeMobileMenu}
              >
                <img src={logo} alt="전북생명의숲 로고" className="h-10 w-auto" />
                <span className="text-green-700 text-xl font-bold">전북생명의숲</span>
              </Link>
              
              <div className="hidden items-center space-x-4 lg:flex">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700 font-medium">
                        {user.name}님
                      </span>
                      <button
                        onClick={handleLogout}
                        className="min-h-12 rounded-md bg-red-600 px-4 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-red-700"
                      >
                        로그아웃
                      </button>
                    </div>
                    
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex min-h-12 items-center rounded-md bg-green-700 px-4 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-green-800"
                      >
                        관리자
                      </Link>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="min-h-12 rounded-lg px-4 py-3 text-base font-semibold text-green-800 transition-colors duration-200 hover:bg-green-50 hover:text-green-900"
                  >
                    로그인
                  </button>
                )}
              </div>

              <button
                ref={mobileMenuButtonRef}
                type="button"
                aria-label={isMobileMenuOpen ? '전체 메뉴 닫기' : '전체 메뉴 열기'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-green-800
                  hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-green-700 lg:hidden"
                onClick={() => {
                  if (isMobileMenuOpen) {
                    closeMobileMenu();
                  } else {
                    setIsMobileMenuOpen(true);
                  }
                }}
              >
                <svg
                  aria-hidden="true"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <nav aria-label="주요 메뉴" className="hidden border-b border-gray-200/80 bg-white/70 lg:block">
          <div className="container mx-auto px-6">
            <ul className="flex justify-center space-x-2">
              {/* 정적 카테고리 */}
              {STATIC_CATEGORIES.map((category) => (
                <li 
                  key={category.id}
                  className="relative group"
                  onMouseEnter={() => handleMouseEnter(category.id)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => handleMouseEnter(category.id)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setHoveredCategory(null);
                    }
                  }}
                >
                  <Link
                    to={category.path}
                    aria-current={location.pathname === category.path ? 'page' : undefined}
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
                        group-hover:opacity-100 group-focus-within:translate-y-0
                        group-focus-within:opacity-100 transition-all duration-300 ease-out
                        border border-gray-100/80 overflow-hidden z-50"
                      onMouseEnter={() => handleMouseEnter(category.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <ul className="py-2">
                        {category.children.map((subCategory) => (
                          <li key={subCategory.id}>
                            <Link
                              to={subCategory.path}
                              aria-current={location.pathname === subCategory.path ? 'page' : undefined}
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
                    onFocus={() => handleMouseEnter(category.id)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setHoveredCategory(null);
                      }
                    }}
                  >
                    <Link
                      to={`/category/${category.id}`}
                      aria-current={location.pathname === `/category/${category.id}` ? 'page' : undefined}
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
                          group-hover:opacity-100 group-focus-within:translate-y-0
                          group-focus-within:opacity-100 transition-all duration-300 ease-out
                          border border-gray-100/80 overflow-hidden z-50"
                        onMouseEnter={() => handleMouseEnter(category.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <ul className="py-2">
                          {category.children.map((subCategory) => (
                            <li key={subCategory.id}>
                              <Link
                                to={`/category/${subCategory.id}`}
                                aria-current={location.pathname === `/category/${subCategory.id}` ? 'page' : undefined}
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

      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-0 z-0 h-full w-full cursor-default bg-black/40"
              onClick={closeMobileMenu}
            />

            <nav
              id="mobile-navigation"
              ref={mobileNavigationRef}
              tabIndex={-1}
              aria-label="모바일 주요 메뉴"
              className="absolute inset-y-0 right-0 z-10 w-full max-w-md overflow-y-auto
                overscroll-contain bg-white shadow-2xl focus:outline-none"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                <p className="text-lg font-bold text-green-900">전체 메뉴</p>
                <button
                  ref={mobileMenuCloseButtonRef}
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="모바일 메뉴 닫기"
                  className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-2xl text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-green-700"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
              <div className="border-b border-gray-200 bg-green-50 p-4">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-gray-900">{user.name}님</p>
                    <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <button
                        type="button"
                        className="min-h-12 rounded-lg bg-red-600 px-4 py-3 text-lg font-semibold
                          text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-red-700 focus-visible:ring-offset-2"
                        onClick={handleMobileLogout}
                      >
                        로그아웃
                      </button>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined}
                          className="flex min-h-12 items-center justify-center rounded-lg bg-green-700
                            px-4 py-3 text-lg font-semibold text-white hover:bg-green-800
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700
                            focus-visible:ring-offset-2"
                          onClick={closeMobileMenu}
                        >
                          관리자
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="min-h-12 w-full rounded-lg bg-green-700 px-4 py-3 text-lg
                      font-semibold text-white hover:bg-green-800 focus-visible:outline-none
                      focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                    onClick={() => {
                      closeMobileMenu();
                      setShowLoginModal?.(true);
                    }}
                  >
                    로그인
                  </button>
                )}
              </div>

              <h2 className="sr-only">전체 메뉴</h2>
              <ul className="space-y-1 p-3">
                {STATIC_CATEGORIES.map((category) => (
                  <MobileCategoryItem
                    key={`static-${category.id}`}
                    category={category}
                    categoryType="static"
                    pathname={location.pathname}
                    expandedCategories={expandedMobileCategories}
                    onToggle={toggleMobileCategory}
                    onNavigate={handleMobileNavigate}
                  />
                ))}

                <li aria-hidden="true" className="my-3 border-t border-gray-200" />

                {isLoading ? (
                  <li className="flex min-h-12 items-center px-4 text-lg text-gray-600" aria-live="polite">
                    카테고리를 불러오는 중입니다.
                  </li>
                ) : (
                  categories?.map((category) => (
                    <MobileCategoryItem
                      key={`dynamic-${category.id}`}
                      category={category}
                      categoryType="dynamic"
                      pathname={location.pathname}
                      expandedCategories={expandedMobileCategories}
                      onToggle={toggleMobileCategory}
                      onNavigate={handleMobileNavigate}
                    />
                  ))
                )}
              </ul>
            </nav>
          </div>
        )}

      <main className={mainClassName}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={loginDialogRef}
            tabIndex={-1}
            className="relative w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
          >
            <button
              ref={loginCloseButtonRef}
              type="button"
              onClick={closeLoginModal}
              aria-label="로그인 창 닫기"
              className="absolute right-3 top-3 flex min-h-12 min-w-12 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-green-700"
            >
              <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 id="login-modal-title" className="mb-2 text-center text-2xl font-bold text-gray-900">로그인</h2>
            <p className="mb-6 text-center text-base leading-relaxed text-gray-600">
              사용하실 로그인 방법을 선택해 주세요.
            </p>
            <LoginOptions />
          </div>
        </div>
      )}
    </div>
  );
}
  
