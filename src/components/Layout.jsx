import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/categoryService';
import naverbandLogo from '../assets/naverband.svg';
import instagramLogo from '../assets/instagram.png';
import daumLogo from '../assets/daum.png';
import facebookLogo from '../assets/facebook.png';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clearPendingNavigation } from '../utils/pendingNavigation';
import {
  clearAllProgramApplicationDrafts,
  clearExpiredProgramApplicationDrafts,
} from '../utils/programApplicationDraft';
import useFocusTrap from '../hooks/useFocusTrap';
import LoginOptions from './LoginOptions';
import DraftModeBadge from './DraftModeBadge';
import DesktopNav from './layout/DesktopNav';
import MobileNav from './layout/MobileNav';
import { buildPublicNavigation } from '../navigation/publicNavigation';

export default function Layout({ children, showLoginModal, setShowLoginModal }) {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const loginCloseButtonRef = useRef(null);
  const loginDialogRef = useRef(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const navigationItems = useMemo(
    () => buildPublicNavigation(Array.isArray(categories) ? categories : []),
    [categories],
  );

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
  };

  const closeLoginModal = () => {
    clearPendingNavigation();
    setShowLoginModal(false);
  };

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

  useEffect(() => {
    clearExpiredProgramApplicationDrafts();
  }, []);

  const isHomeRoute = location.pathname === '/';
  const mainClassName = isHomeRoute
    ? 'w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-10 mt-20 lg:mt-32'
    : 'container mx-auto px-6 py-10 mt-20 lg:mt-32';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div
        aria-hidden={isMobileMenuOpen}
        inert={isMobileMenuOpen ? '' : undefined}
        className={isMobileMenuOpen ? 'relative z-0' : undefined}
      >
      <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
      <DraftModeBadge />
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

        <DesktopNav items={navigationItems} pathname={location.pathname} />

      </header>

      <main id="main-content" tabIndex="-1" className={mainClassName}>
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

      <MobileNav
        isOpen={isMobileMenuOpen}
        items={navigationItems}
        pathname={location.pathname}
        isLoading={isLoading}
        auth={{ isAuthenticated, isAdmin, user }}
        onClose={closeMobileMenu}
        onLogin={() => {
          closeMobileMenu();
          setShowLoginModal?.(true);
        }}
        onLogout={handleMobileLogout}
        triggerRef={mobileMenuButtonRef}
      />
    </div>
  );
}
  
