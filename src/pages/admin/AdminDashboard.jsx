import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, deleteCategory } from '../../services/categoryService';
import { fetchPrograms, deleteProgram, fetchProgramApplies, fetchProgramForm } from '../../services/programService';
import { fetchSupporters, markSupportComplete } from '../../services/supportService';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProgramStatusInfo } from '../../utils/programStatus';
import UserManagement from './UserManagement';
import ProgramFormBuilder from '../../components/program/ProgramFormBuilder';
import ProgramApplyDetailModal from '../../components/program/ProgramApplyDetailModal';

// 카테고리 뱃지 헬퍼 함수
const getCategoryBadge = (category) => {
  const categoryInfo = {
    PARTICIPATE: { label: '참여 프로그램', className: 'bg-green-100 text-green-800' },
    participate: { label: '참여 프로그램', className: 'bg-green-100 text-green-800' },
    GUIDE: { label: '양성교육', className: 'bg-blue-100 text-blue-800' },
    guide: { label: '양성교육', className: 'bg-blue-100 text-blue-800' },
    VOLUNTEER: { label: '자원봉사', className: 'bg-orange-100 text-orange-800' },
    volunteer: { label: '자원봉사', className: 'bg-orange-100 text-orange-800' },
  };

  const info = categoryInfo[category] || { label: '참여', className: 'bg-gray-100 text-gray-800' };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  );
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('categories');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [supportersPage, setSupportersPage] = useState(0);
  const [supportersSize] = useState(10);
  const [selectedSupporter, setSelectedSupporter] = useState(null);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedProgramForForm, setSelectedProgramForForm] = useState(null);
  const [existingForm, setExistingForm] = useState(null);
  const [showApplyDetailModal, setShowApplyDetailModal] = useState(false);
  const [selectedApply, setSelectedApply] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // 카테고리 목록 조회
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 프로그램 목록 조회
  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: ['programs', categoryFilter],
    queryFn: () => fetchPrograms(1, 100, categoryFilter === 'all' ? null : categoryFilter),
  });

  // 서버 응답 구조에서 programs 추출 (안전한 접근)
  const programs = programsData?.data?.contents || [];

  // 선택된 프로그램의 신청 목록 조회
  const { data: programApplies, isLoading: appliesLoading } = useQuery({
    queryKey: ['programApplies', selectedProgramId],
    queryFn: () => fetchProgramApplies(selectedProgramId),
    enabled: !!selectedProgramId,
  });

  // 각 프로그램의 신청자 수 조회
  const { data: programApplyCounts } = useQuery({
    queryKey: ['programApplyCounts', programs],
    queryFn: async () => {
      if (!programs || programs.length === 0) return {};
      
      const counts = {};
      for (const program of programs) {
        try {
          const applies = await fetchProgramApplies(program.id);
          counts[program.id] = applies?.length || 0;
        } catch (error) {
          console.error(`Error fetching applies for program ${program.id}:`, error);
          counts[program.id] = 0;
        }
      }
      return counts;
    },
    enabled: !!programs && programs.length > 0,
  });

  // 후원신청 목록 조회
  const { data: supportersData, isLoading: supportersLoading } = useQuery({
    queryKey: ['supporters', supportersPage, supportersSize],
    queryFn: () => fetchSupporters(supportersPage, supportersSize),
    enabled: activeMenu === 'donations',
  });

  const supporters = supportersData?.data?.contents || [];
  const totalPages = supportersData?.data?.totalPages || 0;
  const totalElements = supportersData?.data?.totalCount || 0;

  // 후원신청 완료 처리
  const { mutate: completeSupport } = useMutation({
    mutationFn: markSupportComplete,
    onSuccess: () => {
      alert('후원신청이 완료 처리되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['supporters'] });
    },
    onError: (error) => {
      alert('후원신청 완료 처리에 실패했습니다: ' + error.message);
    },
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

  // 신청 폼 생성/수정 열기
  const handleOpenFormBuilder = async (program) => {
    setSelectedProgramForForm(program);
    try {
      const form = await fetchProgramForm(program.id);
      setExistingForm(form);
    } catch (error) {
      setExistingForm(null);
    }
    setShowFormBuilder(true);
  };

  // 폼 빌더 닫기
  const handleCloseFormBuilder = () => {
    setShowFormBuilder(false);
    setSelectedProgramForForm(null);
    setExistingForm(null);
  };

  // 신청 상세 모달 열기
  const handleOpenApplyDetail = (apply) => {
    setSelectedApply(apply);
    setShowApplyDetailModal(true);
  };

  // 신청 상세 모달 닫기
  const handleCloseApplyDetail = () => {
    setShowApplyDetailModal(false);
    setSelectedApply(null);
  };

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
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium">프로그램 목록</h3>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">전체 카테고리</option>
                  <option value="participate">참여 프로그램</option>
                  <option value="guide">숲 해설가 양성교육</option>
                  <option value="volunteer">자원봉사활동</option>
                </select>
              </div>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자 ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">폼 응답</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {programApplies.map((apply) => (
                        <tr key={apply.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {apply.proposer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                            {apply.userId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(apply.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {apply.formResponses && Object.keys(apply.formResponses).length > 0 ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                📋 {Object.keys(apply.formResponses).length}개 응답
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                                응답 없음
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleOpenApplyDetail(apply)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors duration-200"
                            >
                              상세보기
                            </button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청기간</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">모집인원</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청자 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청 폼</th>
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
                        {getCategoryBadge(program.category)}
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
                          {programApplyCounts ? (programApplyCounts[program.id] ?? 0) : '...'}명
                        </span>
                        <span className="text-gray-400 ml-1">
                          ({program.maxParticipants > 0 && programApplyCounts ? 
                            Math.round((programApplyCounts[program.id] ?? 0) / program.maxParticipants * 100) : 
                            programApplyCounts ? 0 : '...'}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleOpenFormBuilder(program)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors duration-200"
                        >
                          📝 폼 관리
                        </button>
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
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">준비중입니다</h2>
              <p className="text-gray-600 mb-6">
                메일 발송 기능은 현재 개발 중입니다.<br />
                빠른 시일 내에 서비스할 예정입니다.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                개발 진행중
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'users' && (
          <UserManagement />
        )}

        {/* 후원신청 관리 */}
        {activeMenu === 'donations' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">후원신청 목록</h3>
              <div className="text-sm text-gray-500">
                총 {totalElements}건의 후원신청
              </div>
            </div>

            {supportersLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : supporters.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">성함</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supporters.map((supporter) => (
                      <tr 
                        key={supporter.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedSupporter(supporter);
                          setShowSupporterModal(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supporter.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supporter.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            supporter.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {supporter.isCompleted ? '완료' : '대기'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(supporter.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('이 후원신청을 완료 처리하시겠습니까?')) {
                                completeSupport(supporter.id);
                              }
                            }}
                            disabled={supporter.isCompleted}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                              supporter.isCompleted 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            완료
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      페이지 {supportersPage + 1} / {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSupportersPage(Math.max(0, supportersPage - 1))}
                        disabled={supportersPage === 0}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          supportersPage === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        이전
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(0, Math.min(totalPages - 4, supportersPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setSupportersPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              pageNum === supportersPage
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setSupportersPage(Math.min(totalPages - 1, supportersPage + 1))}
                        disabled={supportersPage === totalPages - 1}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          supportersPage === totalPages - 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                후원신청이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 후원신청 상세 모달 */}
        {showSupporterModal && selectedSupporter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium">후원신청 상세정보</h3>
                <button
                  onClick={() => {
                    setShowSupporterModal(false);
                    setSelectedSupporter(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성함</label>
                    <p className="text-gray-900">{selectedSupporter.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <p className="text-gray-900">{selectedSupporter.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">후원 유형</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSupporter.supportType === '일반회원' ? 'bg-blue-100 text-blue-800' :
                      selectedSupporter.supportType === '가족회원' ? 'bg-green-100 text-green-800' :
                      selectedSupporter.supportType === '기업회원' ? 'bg-purple-100 text-purple-800' :
                      selectedSupporter.supportType === '평생회원' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSupporter.supportType}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">출금일</label>
                    <p className="text-gray-900">{selectedSupporter.withdrawalDate}일</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">계좌 정보</label>
                    <p className="text-gray-900">{selectedSupporter.account}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주민등록번호</label>
                    <p className="text-gray-900">{selectedSupporter.nationalIdIdentificationNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기부금영수증</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSupporter.isDonation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSupporter.isDonation ? '발급' : '미발급'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">신청일</label>
                    <p className="text-gray-900">{new Date(selectedSupporter.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">처리상태</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSupporter.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedSupporter.isCompleted ? '완료' : '대기'}
                    </span>
                  </div>
                  {selectedSupporter.address && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <p className="text-gray-900">{selectedSupporter.address}</p>
                    </div>
                  )}
                  {selectedSupporter.email && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <p className="text-gray-900">{selectedSupporter.email}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                {!selectedSupporter.isCompleted && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 후원신청을 완료 처리하시겠습니까?')) {
                        completeSupport(selectedSupporter.id);
                        setShowSupporterModal(false);
                        setSelectedSupporter(null);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    완료 처리
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSupporterModal(false);
                    setSelectedSupporter(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 신청 폼 빌더 모달 */}
        {showFormBuilder && selectedProgramForForm && (
          <ProgramFormBuilder
            programId={selectedProgramForForm.id}
            existingForm={existingForm}
            onClose={handleCloseFormBuilder}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['programForm', selectedProgramForForm.id] });
            }}
          />
        )}

        {/* 신청 상세 모달 */}
        {showApplyDetailModal && selectedApply && (
          <ProgramApplyDetailModal
            apply={selectedApply}
            programId={selectedProgramId}
            onClose={handleCloseApplyDetail}
          />
        )}
      </div>
    </div>
  );
}
