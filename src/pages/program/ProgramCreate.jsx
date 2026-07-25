import { useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createProgram } from '../../services/programService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadImage } from '../../services/uploadService';
import { normalizeListMarkup } from '../../utils/editorContent';

export default function ProgramCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/admin?section=programs';
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    applyStartDate: '',
    applyEndDate: '',
    eventDate: '',
    applyUrl: '',
    programUrl: '',
    maxParticipants: '',
    category: 'participate',
    files: [],
  });
  const [fileNames, setFileNames] = useState([]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            try {
              const file = input.files[0];
              const imageUrl = await uploadImage(file);
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection();
              quill.insertEmbed(range.index, 'image', imageUrl);
            } catch (error) {
              console.error('Image upload failed:', error);
              alert('이미지 업로드에 실패했습니다.');
            }
          };
        },
      },
    },
  }), []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files],
    }));
    setFileNames(prev => [...prev, ...files.map(file => file.name)]);
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
    setFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files],
    }));
    setFileNames(prev => [...prev, ...files.map(file => file.name)]);
  };

  const { mutate: submitProgram, isPending } = useMutation({
    mutationFn: (data) => {
      const formDataToSend = new FormData();

      formDataToSend.append('title', data.title);
      formDataToSend.append('content', data.content);
      formDataToSend.append('applyStartDate', data.applyStartDate);
      formDataToSend.append('eventDate', data.eventDate);
      formDataToSend.append('maxParticipants', data.maxParticipants);
      formDataToSend.append('category', data.category);

      ['applyEndDate', 'applyUrl', 'programUrl'].forEach((key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formDataToSend.append(key, data[key]);
        }
      });

      data.files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      return createProgram(formDataToSend);
    },
    onSuccess: () => {
      alert('프로그램이 등록되었습니다.');
      navigate(returnTo);
    },
    onError: (error) => {
      alert('프로그램 등록에 실패했습니다: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 날짜/시간을 ISO 형식으로 변환 (시간대 정보 없이)
    const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return null;
      // datetime-local 형식 (YYYY-MM-DDTHH:mm)을 ISO 형식으로 변환
      // 시간대 정보 없이 로컬 시간 그대로 사용
      return dateTimeString + ':00'; // HH:mm -> HH:mm:00
    };
    
    // 날짜만 입력받는 경우 (eventDate for guide category) - 시간을 00:00:00으로 설정
    const formatDate = (dateString) => {
      if (!dateString) return null;
      // date 형식 (YYYY-MM-DD)을 ISO 형식으로 변환 (시간은 00:00:00)
      return dateString + 'T00:00:00';
    };
    
    // 카테고리에 따라 eventDate 포맷 결정
    const formatEventDate = (dateString, category) => {
      if (!dateString) return null;
      if (category === 'guide') {
        // guide는 날짜만
        return formatDate(dateString);
      } else {
        // 나머지는 날짜+시간
        return formatDateTime(dateString);
      }
    };
    
    submitProgram({
      ...formData,
      content: normalizeListMarkup(formData.content),
      applyStartDate: formatDateTime(formData.applyStartDate),
      applyEndDate: formatDateTime(formData.applyEndDate),
      eventDate: formatEventDate(formData.eventDate, formData.category),
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">프로그램 등록</h1>
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="min-h-12 rounded-lg px-3 text-base font-semibold text-gray-700 hover:bg-gray-100"
        >
          ← 돌아가기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            프로그램 제목
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            신청 시작일시
          </label>
          <input
            type="datetime-local"
            value={formData.applyStartDate}
            onChange={(e) => setFormData({ ...formData, applyStartDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            신청 마감일시
          </label>
          <input
            type="datetime-local"
            value={formData.applyEndDate}
            onChange={(e) => setFormData({ ...formData, applyEndDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            구글폼 신청 링크 (필수)
          </label>
          <input
            type="url"
            required
            value={formData.applyUrl}
            onChange={(e) => setFormData({ ...formData, applyUrl: e.target.value })}
            placeholder="https://forms.gle/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="mt-1 text-sm text-gray-600">
            신청은 구글폼으로만 받습니다. 링크가 없으면 상세 화면에 신청 수단이 표시되지 않습니다.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            프로그램 참고 링크 (선택)
          </label>
          <input
            type="url"
            value={formData.programUrl}
            onChange={(e) => setFormData({ ...formData, programUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.category === 'guide' ? '신청자 발표' : '행사 일시'}
          </label>
          <input
            type={formData.category === 'guide' ? 'date' : 'datetime-local'}
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            모집 인원
          </label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="participate">참여 프로그램</option>
            <option value="guide">숲 해설가 양성교육</option>
            <option value="volunteer">자원봉사활동</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <div className="border rounded-lg">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              modules={modules}
              className="h-[450px]"
            />
          </div>
          <div className="h-12" />
        </div>

        <div className="border-t pt-8 mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            첨부파일
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-gray-600">
              클릭하거나 파일을 이곳에 드래그하세요
            </div>
          </div>
          {fileNames.length > 0 && (
            <ul className="mt-4 space-y-2">
              {fileNames.map((name, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-600">{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
              transition-colors duration-200 disabled:bg-gray-400"
          >
            {isPending ? '등록 중...' : '프로그램 등록'}
          </button>
        </div>
      </form>
    </div>
  );
} 
