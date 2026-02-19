import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { applyProgram, fetchProgramForm } from '../../services/programService';

// 동적 폼 필드 렌더링 컴포넌트
function DynamicFormField({ field, value, onChange }) {
  const renderField = () => {
    switch (field.type) {
      case 'SHORT_TEXT':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.id, Number(e.target.value))}
            placeholder={field.placeholder || ''}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
          />
        );

      case 'EMAIL':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || '이메일을 입력하세요'}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        );

      case 'PHONE':
        return (
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || '010-0000-0000'}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            pattern={field.validation?.pattern || '[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}'}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        );

      case 'TIME':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        );

      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  required={field.required}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValue, option]
                      : currentValue.filter(v => v !== option);
                    onChange(field.id, newValue);
                  }}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'DROPDOWN':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">선택하세요</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'FILE_UPLOAD': {
        const allowedExtensions = (field.validation?.allowedExtensions || [])
          .map((ext) => ext.trim().replace(/^\./, '').toLowerCase())
          .filter((ext) => ext.length > 0);
        const accept = allowedExtensions.length > 0
          ? allowedExtensions.map((ext) => `.${ext}`).join(',')
          : undefined;

        return (
          <div>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  onChange(field.id, undefined);
                  return;
                }

                if (allowedExtensions.length > 0) {
                  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                  if (!allowedExtensions.includes(fileExtension)) {
                    alert(`허용된 파일 형식: ${allowedExtensions.join(', ')}`);
                    e.target.value = '';
                    return;
                  }
                }

                const maxFileSize = field.validation?.maxFileSize;
                if (maxFileSize && file.size > maxFileSize) {
                  const maxMb = Math.floor(maxFileSize / (1024 * 1024));
                  alert(`파일 크기는 ${maxMb}MB 이하여야 합니다.`);
                  e.target.value = '';
                  return;
                }

                onChange(field.id, file);
              }}
              required={field.required}
              accept={accept}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {(allowedExtensions.length > 0 || field.validation?.maxFileSize) && (
              <p className="mt-1 text-xs text-gray-500">
                {allowedExtensions.length > 0 && `확장자: ${allowedExtensions.join(', ')}`}
                {allowedExtensions.length > 0 && field.validation?.maxFileSize && ' / '}
                {field.validation?.maxFileSize && `최대 ${Math.floor(field.validation.maxFileSize / (1024 * 1024))}MB`}
              </p>
            )}
          </div>
        );
      }

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-500 mb-2">{field.description}</p>
      )}
      {renderField()}
    </div>
  );
}

export default function ApplyProgramModal({ programId, onClose }) {
  const [agreements, setAgreements] = useState({
    imageAgreement: false,
    privacyAgreement: false,
  });
  const [formResponses, setFormResponses] = useState({});

  // 프로그램 폼 조회
  const { data: programForm, isLoading: formLoading } = useQuery({
    queryKey: ['programForm', programId],
    queryFn: () => fetchProgramForm(programId),
    enabled: !!programId,
  });

  const { mutate: submitApplication, isPending } = useMutation({
    mutationFn: () => applyProgram({ 
      programId,
      imageAgreement: agreements.imageAgreement,
      privacyAgreement: agreements.privacyAgreement,
      formResponses, // 동적 폼 응답만 전송
    }),
    onSuccess: () => {
      alert('프로그램 신청이 완료되었습니다.');
      onClose();
    },
    onError: (error) => {
      alert('신청 중 오류가 발생했습니다: ' + error.message);
    },
  });

  const handleFormResponseChange = (fieldId, value) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!agreements.imageAgreement || !agreements.privacyAgreement) {
      alert('모든 동의 항목에 체크해주세요.');
      return;
    }

    // 필수 필드 검증
    if (programForm?.fields) {
      const requiredFields = programForm.fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !formResponses[field.id]);
      
      if (missingFields.length > 0) {
        alert(`다음 필드를 입력해주세요: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }
    }

    submitApplication();
  };

  const isFormValid = agreements.imageAgreement && agreements.privacyAgreement;

  if (formLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">폼을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">프로그램 신청</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 동적 폼 필드 */}
          {programForm && programForm.fields && programForm.fields.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {programForm.title || '추가 정보'}
              </h3>
              {programForm.description && (
                <p className="text-sm text-gray-600 mb-4">{programForm.description}</p>
              )}
              <div className="space-y-4">
                {programForm.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <DynamicFormField
                      key={field.id}
                      field={field}
                      value={formResponses[field.id]}
                      onChange={handleFormResponseChange}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* 동의 항목 */}
          <div className="space-y-6 border-t pt-6">
            {/* 초상권 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">촬영 및 초상권 활용 동의서</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>전북생명의숲에서 주최하는 프로그램 및 행사에 참여하는 본인 또는 영유아의 법정대리인에게 초상권 사용 동의를 받고자 합니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>수집 목적 : 결과보고 및 홍보에 활용.</li>
                  <li>수집 항목 : 프로그램 및 행사 활동 사진 및 동영상</li>
                  <li>활용 범위 : 전북생명의숲 SNS와 유튜브 게시, 사업 결과보고서 사용, 홈페이지 게시</li>
                </ul>
                <p className="text-red-600">※ 동의 거부시에는 프로그램 및 행사에 참여하실 수 없습니다.</p>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={agreements.imageAgreement}
                  onChange={(e) => setAgreements(prev => ({ ...prev, imageAgreement: e.target.checked }))}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium">촬영 및 초상권 활용에 동의합니다.</span>
              </label>
            </div>

            {/* 개인정보 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">개인정보의 수집 및 이용 목적</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>전북생명의숲은 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>개인정보 수집.이용 목적 - 프로그램 참가신청, 신청자 및 일정 관리</li>
                  <li>개인정보 수집 항목 - 대상, 신청자명, 연락처, 입금자명</li>
                  <li>개인정보 제3자제공 리스트 : 전북특별자치도도청, 전주시청, 전북특별자치도교육청, 생명의숲본부, 국가기관의 법적 권한과 효력에 의해 제공이 요구될 때</li>
                  <li>보유.이용기간 - 프로그램 종료 및 수료증 발급과 관련 없을시까지 보유.</li>
                </ul>
                <p className="text-red-600">※ 개인정보 수집.이용 미동의시 교육 참가 대상에서 제외 될 수 있습니다.</p>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={agreements.privacyAgreement}
                  onChange={(e) => setAgreements(prev => ({ ...prev, privacyAgreement: e.target.checked }))}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium">개인정보 수집 및 제3자정보 제공에 동의합니다.</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending || !isFormValid}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                transition-colors duration-200 disabled:bg-gray-400"
            >
              {isPending ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
