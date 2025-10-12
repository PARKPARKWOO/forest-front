import { useQuery } from '@tanstack/react-query';
import { fetchProgramForm } from '../../services/programService';

export default function ProgramApplyDetailModal({ apply, programId, onClose }) {
  // 해당 프로그램의 폼 정보 가져오기
  const { data: programForm } = useQuery({
    queryKey: ['programForm', programId],
    queryFn: () => fetchProgramForm(programId),
    enabled: !!programId && !!apply?.formResponses,
  });

  const renderFieldValue = (fieldId, value, field) => {
    if (!value) return <span className="text-gray-400">응답 없음</span>;

    // 배열인 경우 (MULTIPLE_CHOICE)
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, idx) => (
            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
              {item}
            </span>
          ))}
        </div>
      );
    }

    // 파일인 경우
    if (field?.type === 'FILE_UPLOAD' && typeof value === 'string') {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          파일 다운로드
        </a>
      );
    }

    // 날짜 포맷팅
    if (field?.type === 'DATE' && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString('ko-KR');
      } catch {
        return value;
      }
    }

    // 시간 포맷팅
    if (field?.type === 'TIME' && typeof value === 'string') {
      return value;
    }

    // 일반 텍스트
    return <span className="text-gray-900">{String(value)}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">프로그램 신청 상세</h3>
            <p className="text-sm text-gray-600 mt-1">신청자: {apply.proposer}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              기본 정보
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">신청자명</label>
                <p className="text-gray-900 font-medium">{apply.proposer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">사용자 ID</label>
                <p className="text-gray-900 font-mono text-sm">{apply.userId}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">신청일시</label>
                <p className="text-gray-900">
                  {new Date(apply.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* 동적 폼 응답 */}
          {apply.formResponses && Object.keys(apply.formResponses).length > 0 ? (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                신청 폼 응답
                {programForm && (
                  <span className="ml-2 text-xs text-gray-600 font-normal">
                    ({programForm.title})
                  </span>
                )}
              </h4>
              <div className="space-y-4">
                {Object.entries(apply.formResponses).map(([fieldId, value]) => {
                  const field = programForm?.fields?.find(f => f.id === fieldId);
                  const fieldLabel = field?.label || `필드 ${fieldId}`;
                  
                  return (
                    <div key={fieldId} className="bg-white p-3 rounded border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {fieldLabel}
                        {field?.required && <span className="text-red-600 ml-1">*</span>}
                      </label>
                      {field?.description && (
                        <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                      )}
                      <div className="text-sm">
                        {renderFieldValue(fieldId, value, field)}
                      </div>
                      {field && (
                        <div className="mt-1 text-xs text-gray-400">
                          타입: {field.type}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-sm text-yellow-800">
                  이 신청에는 폼 응답이 없습니다.
                  {!programForm && " (신청 당시 폼이 설정되지 않았습니다)"}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium transition-colors duration-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

