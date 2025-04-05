import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/categoryService';
import kakaoLogo from '../assets/kakao.png';
import naverLogo from '../assets/naver.png';
import naverbandLogo from '../assets/naverband.svg';
import instagramLogo from '../assets/instagram.png';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Layout({ children, showLoginModal, setShowLoginModal }) {
  const { isAuthenticated, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const kakaoLoginUrl = process.env.NODE_ENV === 'development' 
    ? 'https://woo-auth.duckdns.org/oauth2/authorization/5'
    : 'https://woo-auth.duckdns.org/oauth2/authorization/6';

  const naverLoginUrl = 'https://woo-auth.duckdns.org/oauth2/authorization/8';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* 소셜 미디어 사이드 네비게이션 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        <a 
          href="https://band.us/band/63904219" 
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
          href="https://www.instagram.com/forestulsan" 
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
      </div>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4">
            <Link to="/" className="text-xl font-bold text-green-800">
              전북생명의숲
            </Link>
            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  {userRole === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      관리자
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그인
                </button>
              )}
            </div>
          </div>
          <div className="px-4 pb-3">
            <div className="flex space-x-8">
              <Link
                to="/intro"
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium
                  ${selectedCategoryId === 'intro' ? 'text-green-600 border-b-2 border-green-600' : ''}`}
                onMouseEnter={() => setHoveredCategory('intro')}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => setSelectedCategoryId('intro')}
              >
                소개
              </Link>
              <Link
                to="/programs"
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium
                  ${selectedCategoryId === 'programs' ? 'text-green-600 border-b-2 border-green-600' : ''}`}
                onMouseEnter={() => setHoveredCategory('programs')}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => setSelectedCategoryId('programs')}
              >
                프로그램
              </Link>
              <Link
                to="/donation"
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium
                  ${selectedCategoryId === 'donation' ? 'text-green-600 border-b-2 border-green-600' : ''}`}
                onMouseEnter={() => setHoveredCategory('donation')}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => setSelectedCategoryId('donation')}
              >
                후원하기
              </Link>
              {!isLoading && categories?.map(category => (
                <div
                  key={category.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center">
                    <Link
                      to={`/category/${category.id}`}
                      className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium
                        ${selectedCategoryId === category.id ? 'text-green-600 border-b-2 border-green-600' : ''}`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      {category.name}
                    </Link>
                    {category.children?.length > 0 && (
                      <svg 
                        className="w-4 h-4 ml-1 text-gray-400 group-hover:text-green-600 transition-transform duration-200 transform group-hover:rotate-180" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>

                  {hoveredCategory === category.id && category.children?.length > 0 && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {category.children.map(subCategory => (
                        <Link
                          key={subCategory.id}
                          to={`/category/${subCategory.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                          onClick={() => setSelectedCategoryId(subCategory.id)}
                        >
                          {subCategory.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">전북생명의숲</h3>
              <p className="text-gray-300">
                숲을 통해 생명의 가치를 전하고 지속가능한 미래를 만들어갑니다.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">연락처</h3>
              <p className="text-gray-300">전화: 063-123-4567</p>
              <p className="text-gray-300">이메일: contact@jbforest.org</p>
              <p className="text-gray-300">주소: 전라북도 전주시 완산구 어딘가</p>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400">
            <p>&copy; 2024 전북생명의숲. All rights reserved.</p>
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
  