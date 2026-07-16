import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProgramForm, updateProgramForm } from '../../services/programService';
import useFocusTrap from '../../hooks/useFocusTrap';

// 필드 타입 목록
const FIELD_TYPES = [
  { value: 'SHORT_TEXT', label: '짧은 텍스트' },
  { value: 'LONG_TEXT', label: '긴 텍스트' },
  { value: 'NUMBER', label: '숫자' },
  { value: 'EMAIL', label: '이메일' },
  { value: 'PHONE', label: '전화번호' },
  { value: 'DATE', label: '날짜' },
  { value: 'TIME', label: '시간' },
  { value: 'SINGLE_CHOICE', label: '단일 선택' },
  { value: 'MULTIPLE_CHOICE', label: '복수 선택' },
  { value: 'DROPDOWN', label: '드롭다운' },
  { value: 'FILE_UPLOAD', label: '파일 업로드' },
];

const parseOptionalNumber = (rawValue, parser) => {
  if (rawValue === '') return null;
  const parsedValue = parser(rawValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

// 필드 편집 컴포넌트
function FieldEditor({ field, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const needsOptions = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN'].includes(field.type);
  const [optionInput, setOptionInput] = useState('');

  // 상세 설정 버튼 클릭 시 UI만 토글
  const handleToggleExpanded = (e) => {
    e.preventDefault(); // form submit 방지
    e.stopPropagation(); // 이벤트 전파 방지
    setExpanded(!expanded);
  };

  const handleAddOption = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (optionInput.trim()) {
      onUpdate(field.id, {
        ...field,
        options: [...(field.options || []), optionInput.trim()]
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (e, optionIndex) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onUpdate(field.id, {
      ...field,
      options: field.options.filter((_, idx) => idx !== optionIndex)
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex gap-2 lg:flex-col lg:gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              className="min-h-11 min-w-11 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              title="위로 이동"
              aria-label={`${field.label} 위로 이동`}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isLast}
              className="min-h-11 min-w-11 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              title="아래로 이동"
              aria-label={`${field.label} 아래로 이동`}
            >
              ▼
            </button>
          </div>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, { ...field, label: e.target.value })}
            placeholder="질문 제목"
            aria-label="질문 제목"
            className="min-h-12 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <select
            value={field.type}
            onChange={(e) => onUpdate(field.id, { ...field, type: e.target.value })}
            aria-label={`${field.label} 질문 유형`}
            className="min-h-12 rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {FIELD_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleToggleExpanded}
            className="min-h-11 min-w-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            title="상세 설정"
            aria-label={`${field.label} 상세 설정 ${expanded ? '접기' : '펼치기'}`}
            aria-expanded={expanded}
          >
            {expanded ? '▼' : '▶'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(field.id);
            }}
            className="min-h-11 min-w-11 rounded-lg border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
            title="삭제"
            aria-label={`${field.label} 삭제`}
          >
            ✕
          </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-l-2 border-gray-200 pl-3 sm:pl-6 lg:pl-10">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 (선택)
            </label>
            <input
              type="text"
              value={field.description || ''}
              onChange={(e) => onUpdate(field.id, { ...field, description: e.target.value })}
              placeholder="필드에 대한 추가 설명"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder (선택)
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate(field.id, { ...field, placeholder: e.target.value })}
              placeholder="예: 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.required}
              onChange={(e) => onUpdate(field.id, { ...field, required: e.target.checked })}
              className="rounded text-green-600"
            />
            <label htmlFor={`required-${field.id}`} className="text-sm text-gray-700">
              필수 입력 항목
            </label>
          </div>

          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택 옵션
              </label>
              <div className="space-y-2">
                {field.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 flex-1 px-3 py-1 bg-gray-50 rounded">
                      {option}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveOption(e, idx);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      제거
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddOption(e);
                      }
                    }}
                    placeholder="옵션 추가"
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddOption(e);
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 유효성 검사 */}
          {field.type === 'SHORT_TEXT' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">최소 길이</label>
                <input
                  type="number"
                  value={field.validation?.minLength ?? ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: {
                      ...field.validation,
                      minLength: parseOptionalNumber(e.target.value, Number.parseInt),
                    }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">최대 길이</label>
                <input
                  type="number"
                  value={field.validation?.maxLength ?? ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: {
                      ...field.validation,
                      maxLength: parseOptionalNumber(e.target.value, Number.parseInt),
                    }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}

          {field.type === 'NUMBER' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">최소값</label>
                <input
                  type="number"
                  value={field.validation?.minValue ?? ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: {
                      ...field.validation,
                      minValue: parseOptionalNumber(e.target.value, Number.parseFloat),
                    }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">최대값</label>
                <input
                  type="number"
                  value={field.validation?.maxValue ?? ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: {
                      ...field.validation,
                      maxValue: parseOptionalNumber(e.target.value, Number.parseFloat),
                    }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}

          {field.type === 'FILE_UPLOAD' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  허용 확장자 (쉼표 구분)
                </label>
                <input
                  type="text"
                  value={(field.validation?.allowedExtensions || []).join(',')}
                  onChange={(e) => {
                    const allowedExtensions = e.target.value
                      .split(',')
                      .map((ext) => ext.trim().replace(/^\./, ''))
                      .filter((ext) => ext.length > 0);

                    onUpdate(field.id, {
                      ...field,
                      validation: {
                        ...field.validation,
                        allowedExtensions,
                      },
                    });
                  }}
                  placeholder="pdf,jpg,png"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">최대 크기(MB)</label>
                <input
                  type="number"
                  min="1"
                  value={
                    field.validation?.maxFileSize
                      ? Math.floor(field.validation.maxFileSize / (1024 * 1024))
                      : ''
                  }
                  onChange={(e) => {
                    const mb = Number(e.target.value);
                    onUpdate(field.id, {
                      ...field,
                      validation: {
                        ...field.validation,
                        maxFileSize: mb > 0 ? mb * 1024 * 1024 : null,
                      },
                    });
                  }}
                  placeholder="10"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProgramFormBuilder({ programId, existingForm, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [formTitle, setFormTitle] = useState(existingForm?.title || '신청 폼');
  const [formDescription, setFormDescription] = useState(existingForm?.description || '');
  const [fields, setFields] = useState(existingForm?.fields || []);

  // 폼 저장 mutation
  const { mutate: saveForm, isPending } = useMutation({
    mutationFn: async (formData) => {
      if (existingForm?.id) {
        return updateProgramForm(existingForm.id, formData);
      } else {
        return createProgramForm({
          ...formData,
          programInformationId: programId,
        });
      }
    },
    onSuccess: () => {
      alert(existingForm ? '폼이 수정되었습니다.' : '폼이 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['programForm', programId] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      alert('폼 저장에 실패했습니다: ' + error.message);
    },
  });

  const handleAddField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: '새 질문',
      type: 'SHORT_TEXT',
      required: false,
      order: fields.length,
      options: null,
      validation: {},
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (fieldId, updatedField) => {
    setFields(fields.map(f => f.id === fieldId ? updatedField : f));
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm('이 필드를 삭제하시겠습니까?')) {
      setFields(fields.filter(f => f.id !== fieldId));
    }
  };

  const handleMoveField = (fieldId, direction) => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    
    // order 재정렬
    newFields.forEach((field, idx) => {
      field.order = idx;
    });
    
    setFields(newFields);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formTitle.trim()) {
      alert('폼 제목을 입력해주세요.');
      return;
    }

    const formData = {
      title: formTitle,
      description: formDescription,
      fields: fields.map((field, index) => ({
        ...field,
        order: index,
      })),
    };

    saveForm(formData);
  };

  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
    isActive: true,
    onEscape: onClose,
    version: `${programId}-${existingForm?.id ?? 'new'}`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-form-builder-title"
        tabIndex={-1}
        className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b bg-gradient-to-r from-green-50 to-green-100 p-4 sm:p-6">
          <div>
            <h2 id="program-form-builder-title" className="text-xl font-bold text-gray-800 sm:text-2xl">
              {existingForm ? '신청 폼 수정' : '신청 폼 생성'}
            </h2>
            <p className="mt-1 text-base leading-relaxed text-gray-600">
              구글 폼처럼 동적으로 신청 폼을 생성하세요
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="신청 폼 창 닫기"
            className="min-h-12 min-w-12 rounded-lg text-2xl text-gray-600 hover:bg-white"
          >
            ✕
          </button>
        </div>

        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // Enter 키로 form submit 방지 (명시적 버튼 클릭만 허용)
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            {/* 폼 기본 정보 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-base font-semibold text-gray-700">
                    폼 제목 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="예: 2024년 봄 숲체험 신청서"
                    required
                    className="min-h-12 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-base font-semibold text-gray-700">
                    폼 설명 (선택)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="신청자에게 보여질 폼에 대한 설명을 입력하세요"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>

            {/* 필드 목록 */}
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-800">질문 항목</h3>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex min-h-12 items-center justify-center space-x-2 rounded-lg bg-green-700 px-4 py-3 text-base font-bold text-white hover:bg-green-800"
                >
                  <span>+</span>
                  <span>질문 추가</span>
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 mb-3">아직 질문이 없습니다</p>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="min-h-12 rounded-lg bg-green-700 px-4 py-3 text-base font-bold text-white hover:bg-green-800"
                  >
                    첫 질문 추가하기
                  </button>
                </div>
              ) : (
                fields.map((field, index) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    onUpdate={handleUpdateField}
                    onDelete={handleDeleteField}
                    onMoveUp={() => handleMoveField(field.id, 'up')}
                    onMoveDown={() => handleMoveField(field.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === fields.length - 1}
                  />
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t bg-gray-50 p-4 sm:flex sm:justify-end sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-lg bg-gray-300 px-5 py-3 text-base font-bold text-gray-800 hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-12 rounded-lg bg-green-700 px-6 py-3 text-base font-bold text-white hover:bg-green-800 disabled:bg-gray-400"
            >
              {isPending ? '저장 중...' : existingForm ? '수정하기' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
