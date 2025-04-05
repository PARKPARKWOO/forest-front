import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createPost, uploadImage } from '../../services/postService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function PostWrite() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [dynamicFields, setDynamicFields] = useState({});
  const quillRef = useRef();

  const { mutate: submitPost, isPending } = useMutation({
    mutationFn: async (formData) => {
      await createPost(formData);
    },
    onSuccess: () => {
      alert('게시글이 등록되었습니다.');
      navigate(`/category/${categoryId}`);
    },
    onError: (error) => {
      alert('게시글 등록에 실패했습니다: ' + error.message);
    },
  });

  // HTML을 순수 텍스트로 변환하는 함수
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', title);
    // HTML 태그를 제거하고 순수 텍스트만 전송
    formData.append('content', stripHtml(content));
    formData.append('category_id', categoryId);
    
    // 이미지 파일들 추가
    images.forEach((image) => {
      formData.append('images', image);
    });

    // 동적 필드 추가
    Object.entries(dynamicFields).forEach(([key, value]) => {
      formData.append(`dynamic_fields[${key}]`, value);
    });

    submitPost(formData);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
    imageHandler: async (file) => {
      try {
        const url = await uploadImage(file);
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        editor.insertEmbed(range.index, 'image', url);
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    // 이미지 파일만 필터링
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      for (const file of imageFiles) {
        const url = await uploadImage(file);
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection() || { index: editor.getLength() };
        editor.insertEmbed(range.index, 'image', url);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">게시글 작성</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 입력 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* 에디터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <div 
            className="h-96"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="h-80"
            />
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 첨부
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index}`}
                    className="h-20 w-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
              transition-colors duration-200 disabled:bg-gray-400"
          >
            {isPending ? '등록 중...' : '게시글 등록'}
          </button>
        </div>
      </form>
    </div>
  );
} 