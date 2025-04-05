import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/categoryService';
import kakaoLogo from '../assets/kakao.png';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Layout({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const kakaoLoginUrl = process.env.NODE_ENV === 'development' 
    ? 'https://woo-auth.duckdns.org/oauth2/authorization/5'
    : 'https://woo-auth.duckdns.org/oauth2/authorization/6';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* 로그인 모달 */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 relative">
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 모달 내용 */}
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
            </div>
          </div>
        </div>
      )}

      <header className="fixed w-full top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="bg-gradient-to-r from-green-700 to-green-600 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link 
                to="/" 
                className="text-2xl font-bold text-white tracking-tight hover:text-green-100 
                  transform hover:scale-105 transition-all duration-300 ease-out"
              >
                전북생명의숲 🌳
              </Link>

              <div>
                {isAuthenticated ? (
                  <button 
                    onClick={logout}
                    className="px-4 py-2 text-white rounded-full border border-white/30 
                      hover:bg-white hover:text-green-700 transition-all duration-300 ease-out
                      transform hover:scale-105 active:scale-95"
                  >
                    로그아웃
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2 text-white rounded-full border border-white/30 
                      hover:bg-white hover:text-green-700 transition-all duration-300"
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
              {isLoading ? (
                <li className="py-4 text-gray-600 animate-pulse">카테고리 로딩중...</li>
              ) : (
                categories?.map((category) => (
                  <li 
                    key={category.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
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
                    
                    {/* 서브 카테고리 드롭다운 */}
                    {hoveredCategory === category.id && category.children?.length > 0 && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 
                        bg-white rounded-xl shadow-lg shadow-green-100/50 min-w-[220px] 
                        transform opacity-0 -translate-y-2 group-hover:translate-y-0 
                        group-hover:opacity-100 transition-all duration-300 ease-out 
                        border border-gray-100/80 overflow-hidden">
                        <ul className="py-2">
                          {category.children.map((subCategory) => (
                            <li key={subCategory.id}>
                              <Link
                                to={`/category/${subCategory.id}`}
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

      <footer className="bg-gradient-to-b from-green-800 to-green-900 w-screen -mx-[calc((100vw-100%)/2)]">
        <div className="container mx-auto">
          <div className="px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 로고 및 설명 */}
              <div className="space-y-4">
                <h3 className="text-white text-xl font-bold">전북생명의숲 🌳</h3>
                <p className="text-green-100/80 text-sm leading-relaxed">
                  숲과 사람을 잇는 생명의 이야기,<br />
                  함께 만들어가는 우리의 미래
                </p>
              </div>

              {/* 연락처 정보 */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Contact Us</h4>
                <div className="text-green-100/80 text-sm space-y-2">
                  <p>📞 063-123-4567</p>
                  <p>📧 info@jbforest.org</p>
                  <p>📍 전라북도 전주시 완산구 전주로 123</p>
                </div>
              </div>

              {/* SNS 링크 */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-green-100/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-green-100/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-green-100/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t border-green-700/30">
              <div className="text-center">
                <p className="text-green-100/60 text-sm">
                  © {new Date().getFullYear()} 전북생명의숲. All rights reserved.
                </p>
                <div className="mt-4 flex justify-center space-x-6 text-xs text-green-100/60">
                  <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
                  <a href="#" className="hover:text-white transition-colors">이용약관</a>
                  <a href="#" className="hover:text-white transition-colors">이메일무단수집거부</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
  