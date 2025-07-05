import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, deleteCategory } from '../../services/categoryService';
import { fetchPrograms, deleteProgram, fetchProgramApplies } from '../../services/programService';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProgramStatusInfo } from '../../utils/programStatus';
import UserManagement from './UserManagement';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('categories');
  const [selectedProgramId, setSelectedProgramId] = useState(null);

  // 카테고리 목록 조회
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 프로그램 목록 조회
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
  });

  // 선택된 프로그램의 신청 목록 조회
  const { data: programApplies, isLoading: appliesLoading } = useQuery({
    queryKey: ['programApplies', selectedProgramId],
    queryFn: () => fetchProgramApplies(selectedProgramId),
    enabled: !!selectedProgramId,
  });

  // 카테고리 삭제
  const { mutate: removeCategory } = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      alert('카테고리가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      alert('카테고리 삭제에 실패했습니다: ' + error.message);
    },
  });

  // 프로그램 삭제
  const { mutate: removeProgram } = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      alert('프로그램이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
    onError: (error) => {
      alert('프로그램 삭제에 실패했습니다: ' + error.message);
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 좌측 사이드바 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">관리자 메뉴</h2>
        </div>
        <nav className="mt-4">
          <button
            className={`w-full text-left px-4 py-2 ${
              activeMenu === 'categories' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveMenu('categories')}
          >
            카테고리 관리
          </button>
          <button
            className={`w-full text-left px-4 py-2 ${
              activeMenu === 'programs' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveMenu('programs')}
          >
            프로그램 관리
          </button>
          <button
            className={`w-full text-left px-4 py-2 ${
              activeMenu === 'users' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveMenu('users')}
          >
            사용자 관리
          </button>
          <button
            className={`w-full text-left px-4 py-2 ${
              activeMenu === 'donations' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveMenu('donations')}
          >
            후원금 관리
          </button>
          <button
            className={`w-full text-left px-4 py-2 ${
              activeMenu === 'mail' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => setActiveMenu('mail')}
          >
            메일 발송
          </button>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeMenu === 'categories' && '카테고리 관리'}
            {activeMenu === 'programs' && '프로그램 관리'}
            {activeMenu === 'users' && '사용자 관리'}
            {activeMenu === 'donations' && '후원금 관리'}
            {activeMenu === 'mail' && '메일 발송'}
          </h1>
        </div>

        {/* 카테고리 관리 */}
        {activeMenu === 'categories' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">카테고리 목록</h3>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => navigate('/admin/category/create')}
              >
                새 카테고리
              </button>
            </div>

            {categoriesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">읽기 권한</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">쓰기 권한</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories?.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.readAuthority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.writeAuthority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          className="text-green-600 hover:text-green-900 mr-3"
                          onClick={() => {/* 수정 모달 열기 */}}
                        >
                          수정
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                              removeCategory(category.id);
                            }
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 프로그램 관리 */}
        {activeMenu === 'programs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">프로그램 목록</h3>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => navigate('/programs/create')}
              >
                새 프로그램
              </button>
            </div>

            {programsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : selectedProgramId ? (
              // 프로그램 신청자 목록
              <div>
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => setSelectedProgramId(null)}
                    className="flex items-center text-green-600 hover:text-green-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    프로그램 목록으로 돌아가기
                  </button>
                </div>
                
                <h4 className="text-lg font-medium mb-4">
                  {programs?.find(p => p.id === selectedProgramId)?.title} - 신청자 목록
                </h4>
                
                {appliesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                  </div>
                ) : programApplies?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">입금자명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">첨부파일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {programApplies.map((apply) => (
                        <tr key={apply.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {apply.proposer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apply.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apply.depositor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(apply.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apply.fileUrl ? (
                              <a 
                                href={apply.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700"
                              >
                                파일 보기
                              </a>
                            ) : (
                              <span>없음</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    신청자가 없습니다.
                  </div>
                )}
              </div>
            ) : (
              // 프로그램 목록
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청기간</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">모집인원</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청자 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programs?.map((program) => (
                    <tr key={program.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgramStatusInfo(program.status).className}`}>
                          {getProgramStatusInfo(program.status).text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {program.applyStartDate} ~ {program.applyEndDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {program.maxParticipants}명
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-medium text-green-600">
                          {program.applyCount || 0}명
                        </span>
                        <span className="text-gray-400 ml-1">
                          ({Math.round((program.applyCount || 0) / program.maxParticipants * 100)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => setSelectedProgramId(program.id)}
                        >
                          신청자 보기
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900 mr-3"
                          onClick={() => navigate(`/programs/edit/${program.id}`)}
                        >
                          수정
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                              removeProgram(program.id);
                            }
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 메일 발송 폼 */}
        {activeMenu === 'mail' && (
          <div className="bg-white rounded-lg shadow p-6">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수신자 선택
                </label>
                <select className="w-full border-gray-300 rounded-md shadow-sm">
                  <option value="all">전체 사용자</option>
                  <option value="active">활성 사용자</option>
                  <option value="inactive">휴면 사용자</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="메일 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  className="w-full h-64 border-gray-300 rounded-md shadow-sm"
                  placeholder="메일 내용을 입력하세요"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  메일 발송
                </button>
              </div>
            </form>
          </div>
        )}

        {activeMenu === 'users' && (
          <UserManagement />
        )}
      </div>
    </div>
  );
}
