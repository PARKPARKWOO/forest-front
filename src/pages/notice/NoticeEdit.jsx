import { useMemo, useRef, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getNoticeDetail, updateNotice } from '../../services/noticeService';
import { uploadImage } from '../../services/postService';
import { normalizeListMarkup } from '../../utils/editorContent';
import { useAuth } from '../../contexts/AuthContext';
import AsyncState from '../../components/AsyncState';
import HashtagHints from '../../components/editor/HashtagHints';

const getNoticeUpdateErrorMessage = (error) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (!error?.response) {
    return '인터넷 연결이 끊겼습니다. 입력한 내용은 유지되니 연결을 확인한 뒤 다시 저장해 주세요.';
  }
  if (status === 401 || status === 403) {
    return '수정 권한을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.';
  }
  if (status === 400 && typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage;
  }
  if (status >= 500) {
    return '서버 문제로 저장하지 못했습니다. 입력한 내용은 유지되니 잠시 후 다시 시도해 주세요.';
  }
  return '공지사항을 저장하지 못했습니다. 입력한 내용은 유지되니 다시 시도해 주세요.';
};

export default function NoticeEdit() {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const quillRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    data: noticeData,
    isLoading,
    isError,
    error: noticeQueryError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['notice', noticeId],
    queryFn: () => getNoticeDetail(noticeId),
    enabled: !!noticeId,
  });
  const notice = noticeData?.data;
  const noticeErrorCode = noticeQueryError?.response?.data?.code;
  const noticeNotFound = isError && (
    noticeQueryError?.response?.status === 404 || noticeErrorCode === 'NOT_FOUND_POST'
  );

  useEffect(() => {
    if (!notice) return;

    setTitle(notice.title || '');
    setContent(normalizeListMarkup(notice.content || ''));
    setIsImportant(Boolean(notice.dynamicFields?.important));
    setFormError('');
  }, [notice]);

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
              setFormError('');
              const imageUrl = await uploadImage(file);
              const editor = quillRef.current?.getEditor();
              const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
              editor?.insertEmbed(range.index, 'image', imageUrl);
            } catch (error) {
              console.error('이미지 업로드 실패:', error);
              setFormError('이미지를 올리지 못했습니다. 인터넷 연결과 파일을 확인한 뒤 다시 시도해 주세요.');
            }
          };
        },
      },
    },
  }), []);

  const { mutate: submitEdit, isPending } = useMutation({
    mutationFn: () => updateNotice(noticeId, {
      title,
      content: normalizeListMarkup(content),
      dynamicFields: isImportant ? { important: true } : {},
    }),
    onMutate: () => {
      setFormError('');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notice', noticeId] });
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      alert('공지사항이 수정되었습니다.');
      navigate(`/news/notice/${noticeId}`);
    },
    onError: (error) => {
      setFormError(getNoticeUpdateErrorMessage(error));
    },
  });

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    try {
      setFormError('');
      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file);
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
        editor?.insertEmbed(range.index, 'image', imageUrl);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setFormError('이미지를 올리지 못했습니다. 인터넷 연결과 파일을 확인한 뒤 다시 시도해 주세요.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('제목을 입력해 주세요.');
      return;
    }

    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();
    const hasEmbeddedContent = /<(img|video|audio|iframe|embed|object|svg)\b/i.test(content);

    if (!plainText && !hasEmbeddedContent) {
      setFormError('내용을 입력해 주세요.');
      return;
    }

    submitEdit();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-500">공지사항 수정은 관리자만 가능합니다.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <AsyncState
          status="loading"
          title="공지사항을 불러오고 있습니다"
          className="w-full max-w-3xl"
        />
      </div>
    );
  }

  if (!noticeId || noticeNotFound || (!isError && !notice)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AsyncState
          status="empty"
          title="수정할 공지사항을 찾을 수 없습니다"
          description="삭제되었거나 주소가 바뀐 공지사항입니다. 목록에서 다른 공지사항을 확인해 주세요."
        />
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/news/notice')}
            className="accessible-touch-target rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
          >
            공지사항 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <AsyncState
          status="error"
          title="공지사항을 불러오지 못했습니다"
          description="인터넷 연결을 확인한 뒤 다시 시도해 주세요."
          onRetry={refetch}
          isRetrying={isFetching}
          className="w-full max-w-3xl border-red-100"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">공지사항 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div
            id="notice-edit-error"
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-base font-medium text-red-800"
          >
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setFormError('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => {
                setIsImportant(e.target.checked);
                setFormError('');
              }}
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
              onChange={(nextContent) => {
                setContent(nextContent);
                setFormError('');
              }}
              modules={modules}
              className="h-[450px]"
            />
            <HashtagHints content={content} />
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
