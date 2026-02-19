import { useQuery } from '@tanstack/react-query';
import { useParams, useOutletContext } from 'react-router-dom';
import { fetchProgramById } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ApplyProgramModal from '../../components/program/ApplyProgramModal';

export default function ProgramDetail() {
  const { id } = useParams();
  const { setShowLoginModal } = useOutletContext();
  const { isAuthenticated } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  const { data: program, isLoading, error } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetchProgramById(id),
    enabled: !!id, // id가 있을 때만 쿼리 실행
  });

  // 로딩 중이거나 에러 발생 시 처리
  if (isLoading) return <div className="text-center py-8">로딩 중...</div>;
  if (error) return <div className="text-center py-8 text-red-600">에러가 발생했습니다: {error.message}</div>;
  if (!program) return <div className="text-center py-8">프로그램을 찾을 수 없습니다.</div>;

  const handleHomepageApplyClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setShowApplyModal(true);
  };

  const handleGoogleFormApplyClick = () => {
    if (!program.applyUrl) {
      return;
    }
    window.open(program.applyUrl, '_blank', 'noopener,noreferrer');
  };

  // 날짜/시간 포맷팅 함수
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  // 날짜만 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{program.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgramStatusInfo(program.status).className}`}>
            {getProgramStatusInfo(program.status).text}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">신청 기간</h3>
            <p className="text-gray-900">
              {formatDateTime(program.applyStartDate)}
              {program.applyEndDate && ` ~ ${formatDateTime(program.applyEndDate)}`}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              {program.category === 'GUIDE' || program.category?.toLowerCase() === 'guide' ? '신청자 발표' : '행사 일시'}
            </h3>
            <p className="text-gray-900">
              {(program.category === 'GUIDE' || program.category?.toLowerCase() === 'guide') 
                ? formatDate(program.eventDate) 
                : formatDateTime(program.eventDate)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">모집 인원</h3>
            <p className="text-gray-900">{program.maxParticipants}명</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">카테고리</h3>
            <p className="text-gray-900">{program.categoryName || '일반'}</p>
          </div>
          {program.programUrl && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">프로그램 링크</h3>
              <a
                href={program.programUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:text-green-800 underline break-all"
              >
                {program.programUrl}
              </a>
            </div>
          )}
        </div>

        <div className="prose prose-green max-w-none mb-6">
          <div dangerouslySetInnerHTML={{ __html: program.content }} />
        </div>

        {program.files?.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">첨부파일</h3>
            <ul className="space-y-2">
              {program.files.map((file, index) => (
                <li key={index}>
                  <a
                    href={file.downloadUrl || file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    {file.fileName || file.bucketId || '파일 다운로드'}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {program.status === 'IN_PROGRESS' && (
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleFormApplyClick}
                disabled={!program.applyUrl}
                className={`px-6 py-3 rounded-md transition-colors duration-200 text-lg font-medium ${
                  program.applyUrl
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                구글폼 신청하기
              </button>
              <button
                type="button"
                onClick={handleHomepageApplyClick}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 
                  transition-colors duration-200 text-lg font-medium"
              >
                홈페이지에서 신청하기
              </button>
            </div>
          </div>
        )}

        {program.status === 'IN_PROGRESS' && !program.applyUrl && (
          <p className="mt-3 text-center text-sm text-gray-500">
            현재 구글폼 링크가 등록되지 않아 홈페이지 신청만 가능합니다.
          </p>
        )}
      </div>

      {showApplyModal && (
        <ApplyProgramModal
          programId={program.id}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </div>
  );
} 
