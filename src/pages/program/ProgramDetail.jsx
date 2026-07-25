import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteProgram, fetchProgramById } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';
import { useAuth } from '../../contexts/AuthContext';
import AsyncState from '../../components/AsyncState';
import { sanitizeRichText } from '../../utils/editorContent';
import SEO from '../../components/SEO';
import { toMetaDescription } from '../../utils/metaContent';

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuth();

  const {
    data: program,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetchProgramById(id),
    enabled: !!id, // id가 있을 때만 쿼리 실행
  });

  const { mutate: removeProgram, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      alert('프로그램이 삭제되었습니다.');
      navigate('/programs');
    },
    onError: (err) => {
      alert('프로그램 삭제에 실패했습니다: ' + (err?.response?.data?.message || err.message));
    },
  });

  const canManage = Boolean(program && isAuthenticated && isAdmin);

  const handleDelete = () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }
    removeProgram();
  };

  if (isLoading) {
    return <AsyncState status="loading" title="프로그램 정보를 불러오고 있습니다" />;
  }
  if (isError && error?.response?.status === 404) {
    return (
      <AsyncState
        status="empty"
        title="프로그램을 찾을 수 없습니다"
        description="삭제되었거나 주소가 잘못된 프로그램입니다. 프로그램 목록에서 다시 확인해 주세요."
      />
    );
  }
  if (isError) {
    return (
      <AsyncState
        status="error"
        title="프로그램 정보를 불러오지 못했습니다"
        onRetry={refetch}
        isRetrying={isFetching}
      />
    );
  }
  if (!program) {
    return <AsyncState status="empty" title="프로그램을 찾을 수 없습니다" />;
  }

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
    } catch {
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
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <SEO
        title={program.title}
        description={toMetaDescription(program.content)}
        path={`/programs/detail/${id}`}
        type="article"
      />
      <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-start mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">{program.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`rounded-full px-3 py-2 text-base font-medium ${getProgramStatusInfo(program.status).className}`}>
              {getProgramStatusInfo(program.status).text}
            </span>
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/programs/edit/${id}`)}
                  className="min-h-12 rounded-md bg-green-700 px-4 py-3 text-base font-semibold text-white hover:bg-green-800"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="min-h-12 rounded-md bg-red-600 px-4 py-3 text-base font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg">
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-600">신청 기간</h3>
            <p className="text-gray-900">
              {formatDateTime(program.applyStartDate)}
              {program.applyEndDate && ` ~ ${formatDateTime(program.applyEndDate)}`}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-600">
              {program.category === 'GUIDE' || program.category?.toLowerCase() === 'guide' ? '신청자 발표' : '행사 일시'}
            </h3>
            <p className="text-gray-900">
              {(program.category === 'GUIDE' || program.category?.toLowerCase() === 'guide') 
                ? formatDate(program.eventDate) 
                : formatDateTime(program.eventDate)}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-600">모집 인원</h3>
            <p className="text-gray-900">{program.maxParticipants}명</p>
          </div>
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-600">카테고리</h3>
            <p className="text-gray-900">{program.categoryName || '일반'}</p>
          </div>
          {program.programUrl && (
            <div className="md:col-span-2">
              <h3 className="mb-1 text-base font-semibold text-gray-600">프로그램 링크</h3>
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

        <div className="rich-content max-w-none mb-6">
          <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(program.content || '') }} />
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
          <div className="mt-8">
            {program.applyUrl ? (
              <a
                href={program.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="accessible-touch-target mx-auto flex w-full max-w-2xl items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
              >
                구글폼으로 신청하기
              </a>
            ) : (
              <p className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-base text-gray-700" role="status">
                신청 링크가 아직 등록되지 않았습니다. 준비되는 대로 이곳에 안내드리겠습니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
