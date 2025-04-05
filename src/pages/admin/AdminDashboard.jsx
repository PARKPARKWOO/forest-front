import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../../services/categoryService';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('categories');

  // ENUM 옵션 (백엔드와 맞춰야 함)
  const postTypes = [
    { value: 'INFORMATION', label: '정보' },
    { value: 'POST', label: '게시글' },
    { value: 'PROGRAM', label: '프로그램' },
  ];

  const postAuthorities = [
    { value: 'EVERYONE', label: '모두' },
    { value: 'PRIVATE', label: '비공개' },
  ];

  const [form, setForm] = useState({
    parentCategoryId: null,
    name: '',
    type: 'POST',
    readAuthority: 'EVERYONE',
    writeAuthority: 'EVERYONE',
    order: 1,
  });

  const { mutate: addCategory, isPending } = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      alert('카테고리가 생성되었습니다');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      alert('카테고리 생성에 실패했습니다');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500">관리자님 환영합니다</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      전체 카테고리
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      24개
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      전체 사용자
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      128명
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      이번 달 후원금
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₩1,234,567
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white shadow rounded-lg">
          <nav className="flex divide-x divide-gray-200">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'categories'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('categories')}
            >
              카테고리 관리
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'users'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('users')}
            >
              사용자 관리
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'donations'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('donations')}
            >
              후원금 관리
            </button>
          </nav>

          {/* 탭 컨텐츠 */}
          <div className="p-6">
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">카테고리 목록</h3>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    새 카테고리 추가
                  </button>
                </div>
                {/* 카테고리 테이블 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          타입
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          게시글 수
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* 샘플 데이터 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          공지사항
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          INFORMATION
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          15
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-green-600 hover:text-green-900 mr-3">수정</button>
                          <button className="text-red-600 hover:text-red-900">삭제</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">사용자 목록</h3>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    새 사용자 추가
                  </button>
                </div>
                {/* 사용자 테이블 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이메일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          역할
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* 샘플 데이터 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          홍길동
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          hong@example.com
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          관리자
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-green-600 hover:text-green-900 mr-3">수정</button>
                          <button className="text-red-600 hover:text-red-900">삭제</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'donations' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">후원금 내역</h3>
                  <div className="flex gap-2">
                    <select className="border rounded-md px-3 py-2">
                      <option>전체 기간</option>
                      <option>이번 달</option>
                      <option>지난 달</option>
                    </select>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                      내보내기
                    </button>
                  </div>
                </div>
                {/* 후원금 테이블 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          후원자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          금액
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* 샘플 데이터 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          2024-03-15
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          김철수
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₩50,000
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
