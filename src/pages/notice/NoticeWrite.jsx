import { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createNotice } from '../../services/noticeService';
import { uploadImage } from '../../services/postService';
import { normalizeListMarkup } from '../../utils/editorContent';
import { useAuth } from '../../contexts/AuthContext';

export default function NoticeWrite() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const quillRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [images, setImages] = useState([]);

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
            const file = input.files?.[0];
            if (!file) return;

            try {
              const imageUrl = await uploadImage(file);
              const editor = quillRef.current?.getEditor();
              const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
              editor?.insertEmbed(range.index, 'image', imageUrl);
            } catch (error) {
              console.error('이미지 업로드 실패:', error);
              alert('이미지 업로드에 실패했습니다.');
            }
          };
        },
      },
    },
  }), []);

  const { mutate: submitNotice, isPending } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', normalizeListMarkup(content));
      images.forEach((image) => formData.append('images', image));

      if (isImportant) {
        const dynamicFieldsBlob = new Blob([JSON.stringify({ important: true })], {
          type: 'application/json',
        });
        formData.append('dynamic_fields', dynamicFieldsBlob);
      }

      return createNotice(formData);
    },
    onSuccess: () => {
      alert('공지사항이 등록되었습니다.');
      navigate('/news/notice');
    },
    onError: (error) => {
      alert('공지사항 등록에 실패했습니다: ' + error.message);
    },
  });

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    try {
      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file);
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
        editor?.insertEmbed(range.index, 'image', imageUrl);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();

    if (!plainText) {
      alert('내용을 입력해주세요.');
      return;
    }

    submitNotice();
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files]);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">공지사항 작성</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">중요 공지로 설정</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
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
          <div className="h-24" />
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
                <div key={`${image.name}-${index}`} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index}`}
                    className="h-20 w-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isPending ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
