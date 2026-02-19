import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProgramById, updateProgram } from '../../services/programService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadImage } from '../../services/uploadService';
import { normalizeListMarkup } from '../../utils/editorContent';

export default function ProgramEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    status: 'UPCOMING',
    category: 'participate',
    files: [],
  });
  const [fileNames, setFileNames] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deleteFiles, setDeleteFiles] = useState([]);

  // 프로그램 정보 조회
  const { data: program, isLoading, error } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetchProgramById(id),
    enabled: !!id,
  });

  // 프로그램 데이터가 로드되면 폼에 세팅
  useEffect(() => {
    if (program) {
      console.log('ProgramEdit - 프로그램 데이터 로드됨:', program);
      
      // 날짜/시간을 datetime-local 형식으로 변환
      const formatDateTimeForInput = (dateTimeString) => {
        if (!dateTimeString) return '';
        // ISO 형식 (YYYY-MM-DDTHH:mm:ss.sssZ)을 datetime-local 형식 (YYYY-MM-DDTHH:mm)으로 변환
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      // 날짜만 표시하는 경우 (eventDate for guide category)
      const formatDateForInput = (dateTimeString) => {
        if (!dateTimeString) return '';
        // ISO 형식 (YYYY-MM-DDTHH:mm:ss.sssZ)을 date 형식 (YYYY-MM-DD)으로 변환
        const date = new Date(dateTimeString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // 카테고리에 따라 eventDate 포맷 결정
      const formatEventDateForInput = (dateTimeString, category) => {
        if (!dateTimeString) return '';
        if (category === 'guide') {
          // guide는 날짜만
          return formatDateForInput(dateTimeString);
        } else {
          // 나머지는 날짜+시간
          return formatDateTimeForInput(dateTimeString);
        }
      };
      
      const category = program.category ? program.category.toLowerCase() : 'participate';
      
      setFormData({
        title: program.title || '',
        content: normalizeListMarkup(program.content || ''),
        applyStartDate: formatDateTimeForInput(program.applyStartDate),
        applyEndDate: formatDateTimeForInput(program.applyEndDate),
        eventDate: formatEventDateForInput(program.eventDate, category),
        applyUrl: program.applyUrl || '',
        programUrl: program.programUrl || '',
        maxParticipants: program.maxParticipants || '',
        status: program.status || 'UPCOMING',
        category: category,
        files: [],
      });
      
      if (program.files && program.files.length > 0) {
        setExistingFiles(program.files);
      }
    }
  }, [program]);

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

  const handleRemoveExistingFile = (index) => {
    const fileToDelete = existingFiles[index];
    const parsedBucketId = Number(fileToDelete?.bucketId ?? fileToDelete?.id ?? fileToDelete);
    if (Number.isNaN(parsedBucketId)) {
      alert('삭제할 파일 식별자를 읽지 못했습니다.');
      return;
    }
    setDeleteFiles(prev => [...prev, parsedBucketId]);
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
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
      
      formDataToSend.append('title', data.title);
      formDataToSend.append('content', normalizeListMarkup(data.content));
      formDataToSend.append('applyStartDate', formatDateTime(data.applyStartDate));
      if (data.applyEndDate) {
        formDataToSend.append('applyEndDate', formatDateTime(data.applyEndDate));
      }
      formDataToSend.append('eventDate', formatEventDate(data.eventDate, data.category));
      if (data.applyUrl) {
        formDataToSend.append('applyUrl', data.applyUrl);
      }
      if (data.programUrl) {
        formDataToSend.append('programUrl', data.programUrl);
      }
      formDataToSend.append('maxParticipants', data.maxParticipants);
      formDataToSend.append('status', data.status);
      if (data.category) {
        formDataToSend.append('category', data.category);
      }
      
      // 삭제할 파일 URL 추가
      deleteFiles.forEach(fileUrl => {
        formDataToSend.append('deleteFiles', fileUrl);
      });
      
      // 새 파일 추가
      data.files.forEach(file => {
        formDataToSend.append('files', file);
      });
      
      return updateProgram(id, formDataToSend);
    },
    onSuccess: () => {
      alert('프로그램이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['program', id] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      navigate('/admin');
    },
    onError: (error) => {
      alert('프로그램 수정에 실패했습니다: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitProgram(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">프로그램 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">프로그램 정보를 불러올 수 없습니다</h2>
          <p className="text-gray-600 mb-4">오류: {error.message}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">프로그램 수정</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 돌아가기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신청 시작일시
            </label>
            <input
              type="datetime-local"
              value={formData.applyStartDate}
              onChange={(e) => setFormData({ ...formData, applyStartDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신청 종료일시
            </label>
            <input
              type="datetime-local"
              value={formData.applyEndDate}
              onChange={(e) => setFormData({ ...formData, applyEndDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.category === 'guide' ? '신청자 발표' : '행사 일시'}
            </label>
            <input
              type={formData.category === 'guide' ? 'date' : 'datetime-local'}
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              외부 신청 링크 (선택, 구글폼 등)
            </label>
            <input
              type="url"
              value={formData.applyUrl}
              onChange={(e) => setFormData({ ...formData, applyUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="https://forms.google.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로그램 참고 링크 (선택)
            </label>
            <input
              type="url"
              value={formData.programUrl}
              onChange={(e) => setFormData({ ...formData, programUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="UPCOMING">접수전</option>
              <option value="IN_PROGRESS">접수중</option>
              <option value="CLOSED">접수마감</option>
              <option value="DONE">프로그램 종료</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="participate">참여 프로그램</option>
              <option value="guide">숲 해설가 양성교육</option>
              <option value="volunteer">자원봉사활동</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            modules={modules}
            className="h-64 mb-12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            첨부 파일
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
          
          {/* 기존 파일 목록 */}
          {existingFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">기존 파일</h4>
              <ul className="space-y-2">
                {existingFiles.map((fileUrl, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <a 
                      href={fileUrl.downloadUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      {fileUrl.fileName || `파일 #${index + 1}`}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 새 파일 목록 */}
          {fileNames.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">새 파일</h4>
              <ul className="space-y-2">
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
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
              transition-colors duration-200 disabled:bg-gray-400"
          >
            {isPending ? '수정 중...' : '프로그램 수정'}
          </button>
        </div>
      </form>
    </div>
  );
} 
