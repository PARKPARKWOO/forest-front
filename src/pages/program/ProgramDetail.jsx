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

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      console.log('Opening login modal...'); // 디버깅용 로그
      setShowLoginModal(true);
      return;
    }
    setShowApplyModal(true);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{program.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgramStatusInfo(program.status).className}`}>
            {getProgramStatusInfo(program.status).text}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">신청기간:</span>
              <span className="ml-2">
                {formatDate(program.applyStartDate)} ~ {formatDate(program.applyEndDate)}
              </span>
            </div>
            <div>
              <span className="font-semibold">행사일시:</span>
              <span className="ml-2">{formatDateTime(program.eventDate)}</span>
            </div>
            <div>
              <span className="font-semibold">모집인원:</span>
              <span className="ml-2">{program.maxParticipants}명</span>
            </div>
          </div>
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
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    파일 다운로드
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {program.status === 'IN_PROGRESS' && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleApplyClick}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 
                transition-colors duration-200 text-lg font-medium"
            >
              신청하기
            </button>
          </div>
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