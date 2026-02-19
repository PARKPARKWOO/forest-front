import { useState, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createPost, uploadImage } from '../../services/postService';
import { normalizeListMarkup } from '../../utils/editorContent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function PostWrite() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const postType = location.state?.postType;
  
  console.log('PostWrite - postType:', postType); // postType 확인
  console.log('PostWrite - location.state:', location.state); // 전체 state 확인

  // INFORMATION 타입이 아닐 때만 title과 content 상태 사용
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const quillRef = useRef();

  const { mutate: submitPost, isPending } = useMutation({
    mutationFn: async (formData) => {
      await createPost(formData);
    },
    onSuccess: () => {
      alert('등록되었습니다.');
      navigate(`/category/${categoryId}`);
    },
    onError: (error) => {
      alert('등록에 실패했습니다: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('category_id', categoryId);
    
    if (postType === 'INFORMATION') {
      // INFORMATION 타입일 경우 이미지만 전송
      images.forEach((image) => {
        formData.append('images', image);
      });
    } else {
      // 일반 게시글일 경우 모든 데이터 전송
      formData.append('title', title);
      formData.append('content', normalizeListMarkup(content));
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    submitPost(formData);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  // modules 객체를 useMemo로 메모이제이션
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            try {
              const imageUrl = await uploadImage(file);
              const editor = quillRef.current.getEditor();
              const range = editor.getSelection();
              editor.insertEmbed(range.index, 'image', imageUrl);
            } catch (error) {
              console.error('이미지 업로드 실패:', error);
              alert('이미지 업로드에 실패했습니다.');
            }
          };
        }
      }
    },
  }), []); // 빈 의존성 배열로 한 번만 생성

  // 드래그 앤 드롭 핸들러
  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    try {
      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file);
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection() || { index: editor.getLength() };
        editor.insertEmbed(range.index, 'image', imageUrl);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">
        {postType === 'INFORMATION' ? '이미지 업로드' : '게시글 작성'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {postType === 'INFORMATION' ? (
          // INFORMATION 타입일 경우 이미지 업로드만 표시
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label 
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">클릭하여 이미지 선택 또는 드래그하여 업로드</span>
            </label>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // 일반 게시글 작성 폼
          <>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <div 
                className="min-h-[500px]"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  className="h-[450px]"
                />
              </div>
            </div>

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
          </>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || (postType === 'INFORMATION' && images.length === 0)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
              transition-colors duration-200 disabled:bg-gray-400"
          >
            {isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
} 
