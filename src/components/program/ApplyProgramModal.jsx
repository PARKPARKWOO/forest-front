import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { applyProgram, fetchProgramForm } from '../../services/programService';
import {
  clearPendingNavigation,
  getCurrentInternalPath,
  savePendingNavigation,
} from '../../utils/pendingNavigation';
import {
  clearProgramApplicationDraft,
  isFileValue,
  readProgramApplicationDraft,
  writeProgramApplicationDraft,
} from '../../utils/programApplicationDraft';
import { useAuth } from '../../contexts/AuthContext';
import useFocusTrap from '../../hooks/useFocusTrap';

const EMPTY_FILE_FIELD_IDS = [];

const isMissingValue = (value) => (
  value == null
  || value === ''
  || (typeof value === 'string' && value.trim() === '')
  || (Array.isArray(value) && value.length === 0)
);

const getFieldValidationError = (field, value) => {
  if (isMissingValue(value)) {
    return field.required ? `${field.label} 항목을 입력해 주세요.` : null;
  }

  if (field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return '이메일 주소 형식을 확인해 주세요.';
  }

  if (field.type === 'NUMBER') {
    if (!Number.isFinite(Number(value))) return '숫자로 입력해 주세요.';
    if (field.validation?.minValue != null && Number(value) < field.validation.minValue) {
      return `${field.validation.minValue} 이상의 숫자를 입력해 주세요.`;
    }
    if (field.validation?.maxValue != null && Number(value) > field.validation.maxValue) {
      return `${field.validation.maxValue} 이하의 숫자를 입력해 주세요.`;
    }
  }

  if (typeof value === 'string') {
    if (field.validation?.minLength != null && value.length < field.validation.minLength) {
      return `${field.validation.minLength}자 이상 입력해 주세요.`;
    }
    if (field.validation?.maxLength != null && value.length > field.validation.maxLength) {
      return `${field.validation.maxLength}자 이하로 입력해 주세요.`;
    }
    const validationPattern = field.validation?.pattern
      || (field.type === 'PHONE' ? '[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}' : null);
    if (validationPattern) {
      try {
        if (!new RegExp(`^(?:${validationPattern})$`).test(value)) {
          return field.type === 'PHONE'
            ? '전화번호 형식을 확인해 주세요.'
            : '입력 형식을 다시 확인해 주세요.';
        }
      } catch {
        // 잘못된 서버 정규식은 사용자 입력을 막지 않는다.
      }
    }
  }

  return null;
};

// 동적 폼 필드 렌더링 컴포넌트
function DynamicFormField({ field, value, onChange, onValidationError, error }) {
  const inputId = `program-field-${field.id}`;
  const labelId = `${inputId}-label`;
  const descriptionId = field.description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;
  const commonInputClassName = `w-full min-h-12 px-4 py-3 border rounded-md text-base focus:outline-none focus:ring-2 focus:ring-green-700 ${
    error ? 'border-red-600' : 'border-gray-300'
  }`;
  const commonControlProps = {
    id: inputId,
    'aria-labelledby': labelId,
    'aria-describedby': describedBy,
    'aria-invalid': Boolean(error),
  };
  const renderField = () => {
    switch (field.type) {
      case 'SHORT_TEXT':
        return (
          <input
            {...commonControlProps}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            className={commonInputClassName}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'LONG_TEXT':
        return (
          <textarea
            {...commonControlProps}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            required={field.required}
            rows={4}
            className={commonInputClassName}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      case 'NUMBER':
        return (
          <input
            {...commonControlProps}
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(
              field.id,
              e.target.value === '' ? '' : Number(e.target.value),
            )}
            placeholder={field.placeholder || ''}
            required={field.required}
            className={commonInputClassName}
            min={field.validation?.minValue}
            max={field.validation?.maxValue}
          />
        );

      case 'EMAIL':
        return (
          <input
            {...commonControlProps}
            type="email"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || '이메일을 입력하세요'}
            required={field.required}
            className={commonInputClassName}
          />
        );

      case 'PHONE':
        return (
          <input
            {...commonControlProps}
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || '010-0000-0000'}
            required={field.required}
            className={commonInputClassName}
            pattern={field.validation?.pattern || '[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}'}
          />
        );

      case 'DATE':
        return (
          <input
            {...commonControlProps}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className={commonInputClassName}
          />
        );

      case 'TIME':
        return (
          <input
            {...commonControlProps}
            type="time"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className={commonInputClassName}
          />
        );

      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-2" role="radiogroup" aria-labelledby={labelId} aria-describedby={describedBy}>
            {field.options?.map((option, index) => {
              const optionId = `${inputId}-${index}`;
              return (
              <label key={option} htmlFor={optionId} className="flex min-h-12 items-center gap-3 rounded-md px-2 hover:bg-gray-50">
                <input
                  id={optionId}
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  required={field.required}
                  aria-invalid={Boolean(error)}
                  className="h-6 w-6 text-green-700 focus:ring-green-700"
                />
                <span className="text-base text-gray-800">{option}</span>
              </label>
              );
            })}
          </div>
        );

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-2" role="group" aria-labelledby={labelId} aria-describedby={describedBy}>
            {field.options?.map((option, index) => {
              const optionId = `${inputId}-${index}`;
              return (
              <label key={option} htmlFor={optionId} className="flex min-h-12 items-center gap-3 rounded-md px-2 hover:bg-gray-50">
                <input
                  id={optionId}
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
                  aria-invalid={Boolean(error)}
                  className="h-6 w-6 rounded text-green-700 focus:ring-green-700"
                />
                <span className="text-base text-gray-800">{option}</span>
              </label>
              );
            })}
          </div>
        );

      case 'DROPDOWN':
        return (
          <select
            {...commonControlProps}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className={commonInputClassName}
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
              {...commonControlProps}
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
                    onChange(field.id, undefined);
                    onValidationError(field.id, `허용된 파일 형식은 ${allowedExtensions.join(', ')}입니다.`);
                    e.target.value = '';
                    return;
                  }
                }

                const maxFileSize = field.validation?.maxFileSize;
                if (maxFileSize && file.size > maxFileSize) {
                  const maxMb = Math.floor(maxFileSize / (1024 * 1024));
                  onChange(field.id, undefined);
                  onValidationError(field.id, `파일 크기는 ${maxMb}MB 이하여야 합니다.`);
                  e.target.value = '';
                  return;
                }

                onChange(field.id, file);
              }}
              required={field.required}
              accept={accept}
              className={`${commonInputClassName} file:mr-4 file:min-h-10 file:px-4 file:rounded-md file:border-0 file:text-base file:font-semibold file:bg-green-50 file:text-green-800 hover:file:bg-green-100`}
            />
            {(allowedExtensions.length > 0 || field.validation?.maxFileSize) && (
              <p className="mt-2 text-base text-gray-600">
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
            {...commonControlProps}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            className={commonInputClassName}
          />
        );
    }
  };

  return (
    <div>
      <label
        id={labelId}
        htmlFor={['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(field.type) ? undefined : inputId}
        className="mb-2 block text-base font-semibold text-gray-800"
      >
        {field.label}
        {field.required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {field.description && (
        <p id={descriptionId} className="mb-2 text-base leading-relaxed text-gray-600">{field.description}</p>
      )}
      {renderField()}
      {error && (
        <p id={errorId} className="mt-2 text-base font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ApplyProgramModal({ programId, onClose }) {
  const { user } = useAuth();
  const draftUserId = user?.userId ?? user?.id;
  const initialDraftRef = useRef(readProgramApplicationDraft(programId, draftUserId));
  const initialDraft = initialDraftRef.current;
  const [agreements, setAgreements] = useState(initialDraft?.agreements || {
    imageAgreement: false,
    privacyAgreement: false,
  });
  const [formResponses, setFormResponses] = useState(initialDraft?.formResponses || {});
  const [fieldErrors, setFieldErrors] = useState({});
  const [agreementError, setAgreementError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const closeButtonRef = useRef(null);
  const modalRef = useRef(null);
  const draftFileFieldIds = initialDraft?.fileFieldIds || EMPTY_FILE_FIELD_IDS;
  const restoredDraft = Boolean(initialDraft && (
    Object.keys(initialDraft.formResponses || {}).length > 0
    || initialDraft.agreements?.imageAgreement
    || initialDraft.agreements?.privacyAgreement
    || initialDraft.fileFieldIds?.length > 0
  ));
  const fileFieldsToReselect = draftFileFieldIds.filter(
    (fieldId) => !isFileValue(formResponses[fieldId]),
  );

  // 프로그램 폼 조회
  const {
    data: programForm,
    isLoading: formLoading,
    isError: formError,
    isFetching: formFetching,
    refetch: refetchForm,
  } = useQuery({
    queryKey: ['programForm', programId],
    queryFn: () => fetchProgramForm(programId),
    enabled: !!programId,
  });

  useEffect(() => {
    if (submissionSuccess) return;

    const hasDraftContent = Object.values(formResponses).some((value) => !isMissingValue(value))
      || agreements.imageAgreement
      || agreements.privacyAgreement
      || draftFileFieldIds.length > 0;

    if (hasDraftContent) {
      writeProgramApplicationDraft(
        programId,
        draftUserId,
        formResponses,
        agreements,
        draftFileFieldIds,
      );
    } else {
      clearProgramApplicationDraft(programId, draftUserId);
    }
  }, [agreements, draftFileFieldIds, draftUserId, formResponses, programId, submissionSuccess]);

  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
    isActive: true,
    onEscape: onClose,
    version: `${formLoading}-${formError}-${submissionSuccess}`,
  });

  useEffect(() => {
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, [formError, formLoading, submissionSuccess]);

  const { mutate: submitApplication, isPending } = useMutation({
    mutationFn: () => applyProgram({
      programId,
      imageAgreement: agreements.imageAgreement,
      privacyAgreement: agreements.privacyAgreement,
      formResponses, // 동적 폼 응답만 전송
    }),
    onSuccess: () => {
      clearProgramApplicationDraft(programId, draftUserId);
      clearPendingNavigation();
      setSubmissionError('');
      setSubmissionSuccess(true);
    },
    onError: (error) => {
      // 서버 비즈니스 에러(이미 신청함/정원 마감/신청 기간 아님 등)는 사람용 메시지를 그대로 노출
      const serverMessage = error.response?.data?.message;
      setSubmissionError(serverMessage || '신청을 완료하지 못했습니다. 입력 내용은 이 브라우저에 임시 저장했습니다. 잠시 후 다시 시도해 주세요.');

      if ([401, 403].includes(error.response?.status)) {
        savePendingNavigation({
          returnTo: getCurrentInternalPath(),
          action: 'apply-program',
          programId,
        });
        window.location.assign('/login');
      } else {
        clearPendingNavigation();
      }
    },
  });

  const handleFormResponseChange = (fieldId, value) => {
    setFormResponses((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    setFieldErrors((prev) => ({ ...prev, [fieldId]: undefined }));
    setSubmissionError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextFieldErrors = {};
    const fields = programForm?.fields || [];
    fields.forEach((field) => {
      const validationError = getFieldValidationError(field, formResponses[field.id]);
      if (validationError) nextFieldErrors[field.id] = validationError;
    });
    setFieldErrors(nextFieldErrors);

    if (!agreements.imageAgreement || !agreements.privacyAgreement) {
      setAgreementError('신청하려면 두 동의 항목을 모두 확인해 주세요.');
    } else {
      setAgreementError('');
    }

    const firstInvalidField = fields.find((field) => nextFieldErrors[field.id]);
    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        const baseId = `program-field-${firstInvalidField.id}`;
        (document.getElementById(baseId) || document.getElementById(`${baseId}-0`))?.focus();
      });
    }

    if (Object.keys(nextFieldErrors).length > 0 || !agreements.imageAgreement || !agreements.privacyAgreement) {
      return;
    }

    setSubmissionError('');
    savePendingNavigation({
      returnTo: getCurrentInternalPath(),
      action: 'apply-program',
      programId,
    });
    submitApplication();
  };

  if (formLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="w-full max-w-lg rounded-xl bg-white p-6 text-center shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-loading-title"
          aria-busy="true"
        >
          <div className="flex justify-end">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="프로그램 신청 창 닫기"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-2xl text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-green-700"
            >
              ✕
            </button>
          </div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" aria-hidden="true" />
          <h2 id="application-loading-title" className="mt-4 text-xl font-bold text-gray-900">
            신청서를 불러오고 있습니다
          </h2>
          <p className="mt-2 text-lg text-gray-600" role="status" aria-live="polite">잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="w-full max-w-lg rounded-xl bg-white p-6 text-center shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-error-title"
        >
          <div className="flex justify-end">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="프로그램 신청 창 닫기"
              className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-2xl text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-green-700"
            >
              ✕
            </button>
          </div>
          <div className="text-5xl font-bold text-red-700" aria-hidden="true">!</div>
          <h2 id="application-error-title" className="mt-4 text-xl font-bold text-red-800">
            신청서를 불러오지 못했습니다
          </h2>
          <p className="mt-2 text-lg leading-relaxed text-gray-700" role="alert">
            인터넷 연결을 확인한 뒤 다시 시도해 주세요. 입력해 둔 내용은 이 브라우저에 임시 저장됩니다.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => refetchForm()}
              disabled={formFetching}
              className="min-h-12 rounded-lg bg-green-700 px-6 py-3 text-lg font-semibold text-white hover:bg-green-800 disabled:bg-gray-500"
            >
              {formFetching ? '다시 불러오는 중…' : '다시 시도'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-lg border border-gray-400 px-6 py-3 text-lg font-semibold text-gray-800 hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-success-title"
        >
          <div className="text-5xl text-green-700" aria-hidden="true">✓</div>
          <h2 id="application-success-title" className="mt-4 text-2xl font-bold text-gray-900">
            프로그램 신청이 완료되었습니다
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-gray-700" role="status" aria-live="polite">
            신청 내용이 정상적으로 접수되었습니다.
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="mt-7 min-h-12 w-full rounded-lg bg-green-700 px-6 py-3 text-lg font-semibold text-white hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-title"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="application-title" className="text-2xl font-bold text-gray-900">프로그램 신청</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="프로그램 신청 창 닫기"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-2xl text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-green-700"
          >
            ✕
          </button>
        </div>

        {restoredDraft && (
          <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base leading-relaxed text-green-900" role="status">
            이전에 작성하던 내용을 복원했습니다. 임시 내용은 현재 브라우저 탭에 최대 2시간 보관됩니다.
          </p>
        )}
        {fileFieldsToReselect.length > 0 && (
          <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-base leading-relaxed text-amber-900" role="alert">
            보안을 위해 첨부파일은 임시 저장되지 않습니다. 파일 첨부 항목을 다시 선택해 주세요.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {/* 동적 폼 필드 */}
          {programForm && programForm.fields && programForm.fields.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                {programForm.title || '추가 정보'}
              </h3>
              {programForm.description && (
                <p className="mb-4 text-base leading-relaxed text-gray-700">{programForm.description}</p>
              )}
              <div className="space-y-6">
                {[...programForm.fields]
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <DynamicFormField
                      key={field.id}
                      field={field}
                      value={formResponses[field.id]}
                      onChange={handleFormResponseChange}
                      onValidationError={(fieldId, message) => {
                        setFieldErrors((prev) => ({ ...prev, [fieldId]: message }));
                      }}
                      error={fieldErrors[field.id]}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* 동의 항목 */}
          <div className="space-y-6 border-t pt-6">
            {/* 초상권 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="mb-3 text-xl font-bold text-gray-900">촬영 및 초상권 활용 동의서</h3>
              <div className="mb-4 space-y-2 text-base leading-relaxed text-gray-700">
                <p>전북생명의숲에서 주최하는 프로그램 및 행사에 참여하는 본인 또는 영유아의 법정대리인에게 초상권 사용 동의를 받고자 합니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>수집 목적 : 결과보고 및 홍보에 활용.</li>
                  <li>수집 항목 : 프로그램 및 행사 활동 사진 및 동영상</li>
                  <li>활용 범위 : 전북생명의숲 SNS와 유튜브 게시, 사업 결과보고서 사용, 홈페이지 게시</li>
                </ul>
                <p className="text-red-600">※ 동의 거부시에는 프로그램 및 행사에 참여하실 수 없습니다.</p>
              </div>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={agreements.imageAgreement}
                  onChange={(e) => {
                    setAgreements((prev) => ({ ...prev, imageAgreement: e.target.checked }));
                    setAgreementError('');
                  }}
                  className="h-6 w-6 rounded text-green-700 focus:ring-green-700"
                />
                <span className="text-base font-semibold text-gray-900">촬영 및 초상권 활용에 동의합니다.</span>
              </label>
            </div>

            {/* 개인정보 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="mb-3 text-xl font-bold text-gray-900">개인정보의 수집 및 이용 목적</h3>
              <div className="mb-4 space-y-2 text-base leading-relaxed text-gray-700">
                <p>전북생명의숲은 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>개인정보 수집.이용 목적 - 프로그램 참가신청, 신청자 및 일정 관리</li>
                  <li>개인정보 수집 항목 - 대상, 신청자명, 연락처, 입금자명</li>
                  <li>개인정보 제3자제공 리스트 : 전북특별자치도도청, 전주시청, 전북특별자치도교육청, 생명의숲본부, 국가기관의 법적 권한과 효력에 의해 제공이 요구될 때</li>
                  <li>보유.이용기간 - 프로그램 종료 및 수료증 발급과 관련 없을시까지 보유.</li>
                </ul>
                <p className="text-red-600">※ 개인정보 수집.이용 미동의시 교육 참가 대상에서 제외 될 수 있습니다.</p>
              </div>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={agreements.privacyAgreement}
                  onChange={(e) => {
                    setAgreements((prev) => ({ ...prev, privacyAgreement: e.target.checked }));
                    setAgreementError('');
                  }}
                  className="h-6 w-6 rounded text-green-700 focus:ring-green-700"
                />
                <span className="text-base font-semibold text-gray-900">개인정보 수집 및 제3자정보 제공에 동의합니다.</span>
              </label>
            </div>

            {agreementError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-800" role="alert">
                {agreementError}
              </p>
            )}
          </div>

          {submissionError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-4" role="alert" aria-live="assertive">
              <p className="text-base font-semibold text-red-900">{submissionError}</p>
              <p className="mt-1 text-base text-red-800">아래 ‘다시 신청하기’를 누르면 같은 내용으로 다시 시도합니다.</p>
            </div>
          )}

          <p className="text-base leading-relaxed text-gray-600">
            작성 내용은 제출 전까지 현재 브라우저 탭에 임시 저장됩니다. 첨부파일은 저장되지 않습니다.
          </p>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 w-full rounded-lg bg-green-700 px-6 py-3 text-lg font-bold text-white hover:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-gray-500 sm:w-auto"
            >
              {isPending ? '신청 중…' : submissionError ? '다시 신청하기' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
