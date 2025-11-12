import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProgramForm, updateProgramForm } from '../../services/programService';

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

  const handleAddOption = () => {
    if (optionInput.trim()) {
      onUpdate(field.id, {
        ...field,
        options: [...(field.options || []), optionInput.trim()]
      });
      setOptionInput('');
    }
  };

  const handleRemoveOption = (optionIndex) => {
    onUpdate(field.id, {
      ...field,
      options: field.options.filter((_, idx) => idx !== optionIndex)
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={isFirst}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="위로 이동"
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
              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="아래로 이동"
            >
              ▼
            </button>
          </div>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, { ...field, label: e.target.value })}
            placeholder="질문 제목"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={field.type}
            onChange={(e) => onUpdate(field.id, { ...field, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
            className="text-gray-600 hover:text-gray-800"
            title="상세 설정"
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
            className="text-red-600 hover:text-red-700 px-2 py-1"
            title="삭제"
          >
            ✕
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 pl-10 border-l-2 border-gray-200">
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
                      onClick={() => handleRemoveOption(idx)}
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                    placeholder="옵션 추가"
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={handleAddOption}
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
                  value={field.validation?.minLength || ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: { ...field.validation, minLength: parseInt(e.target.value) || null }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">최대 길이</label>
                <input
                  type="number"
                  value={field.validation?.maxLength || ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: { ...field.validation, maxLength: parseInt(e.target.value) || null }
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
                  value={field.validation?.minValue || ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: { ...field.validation, minValue: parseFloat(e.target.value) || null }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">최대값</label>
                <input
                  type="number"
                  value={field.validation?.maxValue || ''}
                  onChange={(e) => onUpdate(field.id, {
                    ...field,
                    validation: { ...field.validation, maxValue: parseFloat(e.target.value) || null }
                  })}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-50 to-green-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {existingForm ? '신청 폼 수정' : '신청 폼 생성'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              구글 폼처럼 동적으로 신청 폼을 생성하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 폼 기본 정보 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    폼 제목 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="예: 2024년 봄 숲체험 신청서"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    폼 설명 (선택)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="신청자에게 보여질 폼에 대한 설명을 입력하세요"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* 필드 목록 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">질문 항목</h3>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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

          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                transition-colors duration-200 disabled:bg-gray-400"
            >
              {isPending ? '저장 중...' : existingForm ? '수정하기' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

