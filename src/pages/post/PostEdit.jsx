import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { fetchPostById, updatePost, uploadImage } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';

export default function PostEdit() {
  const { categoryId, postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quillRef = useRef(null);
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dynamicFields, setDynamicFields] = useState({});

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', categoryId, postId],
    queryFn: () => fetchPostById(categoryId, postId),
    enabled: !!categoryId && !!postId,
  });

  useEffect(() => {
    if (!post) return;
    setTitle(post.title || '');
    setContent(post.content || '');
    setDynamicFields(post.dynamicFields || {});
  }, [post]);

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
            } catch (uploadError) {
              console.error('이미지 업로드 실패:', uploadError);
              alert('이미지 업로드에 실패했습니다.');
            }
          };
        },
      },
    },
  }), []);

  const { mutate: submitEdit, isPending } = useMutation({
    mutationFn: () => updatePost(categoryId, postId, {
      title,
      content,
      dynamicFields,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', categoryId, postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', categoryId] });
      alert('게시글이 수정되었습니다.');
      navigate(`/post/${categoryId}/${postId}`);
    },
    onError: (updateError) => {
      alert('게시글 수정에 실패했습니다: ' + updateError.message);
    },
  });

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    try {
      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file);
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
        editor?.insertEmbed(range.index, 'image', imageUrl);
      }
    } catch (uploadError) {
      console.error('이미지 업로드 실패:', uploadError);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    submitEdit();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600">게시글 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">게시글 수정</h1>
        <button
          type="button"
          onClick={() => navigate(`/post/${categoryId}/${postId}`)}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 돌아가기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isPending ? '수정 중...' : '수정'}
          </button>
        </div>
      </form>
    </div>
  );
}
