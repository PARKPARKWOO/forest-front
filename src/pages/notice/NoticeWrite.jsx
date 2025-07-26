import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createNotice } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';

export default function NoticeWrite() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dynamicFields, setDynamicFields] = useState({});

  // 관리자가 아닌 경우 접근 차단
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-500">공지사항 작성은 관리자만 가능합니다.</p>
        </div>
      </div>
    );
  }

  const createNoticeMutation = useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      alert('공지사항이 성공적으로 작성되었습니다.');
      navigate('/notice');
    },
    onError: (error) => {
      alert('공지사항 작성 실패: ' + error.message);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('content', formData.content);
    
    // 이미지 파일 추가
    selectedFiles.forEach((file) => {
      submitData.append('images', file);
    });
    
    // 동적 필드 추가
    if (Object.keys(dynamicFields).length > 0) {
      submitData.append('dynamic_fields', JSON.stringify(dynamicFields));
    }

    createNoticeMutation.mutate(submitData);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addDynamicField = () => {
    const key = prompt('필드 이름을 입력하세요:');
    if (key && !dynamicFields[key]) {
      const value = prompt('필드 값을 입력하세요:');
      if (value !== null) {
        setDynamicFields(prev => ({ ...prev, [key]: value }));
      }
    }
  };

  const removeDynamicField = (key) => {
    setDynamicFields(prev => {
      const newFields = { ...prev };
      delete newFields[key];
      return newFields;
    });
  };

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항 작성</h1>
          <p className="text-gray-600">새로운 공지사항을 작성하세요.</p>
        </div>

        {/* 작성 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="공지사항 제목을 입력하세요"
                required
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="공지사항 내용을 입력하세요"
                required
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 첨부
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                이미지 선택
              </button>
              
              {/* 선택된 파일 목록 */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 동적 필드 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  추가 정보
                </label>
                <button
                  type="button"
                  onClick={addDynamicField}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  + 필드 추가
                </button>
              </div>
              
              {Object.keys(dynamicFields).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(dynamicFields).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-700">{key}:</span>
                      <span className="text-sm text-gray-600">{value}</span>
                      <button
                        type="button"
                        onClick={() => removeDynamicField(key)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/notice')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={createNoticeMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400"
              >
                {createNoticeMutation.isPending ? '작성 중...' : '공지사항 작성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 