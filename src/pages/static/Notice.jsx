import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getNoticeList, deleteNotice } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';
import AsyncState from '../../components/AsyncState';

export default function Notice() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // 공지사항 목록 조회
  const {
    data: noticeData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['notices', page],
    queryFn: () => getNoticeList(page),
  });

  // 공지사항 삭제
  const deleteNoticeMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      alert('공지사항이 삭제되었습니다.');
      queryClient.invalidateQueries(['notices']);
    },
    onError: (error) => {
      alert('공지사항 삭제 실패: ' + error.message);
    }
  });

  const handleDelete = (noticeId) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      deleteNoticeMutation.mutate(noticeId);
    }
  };

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

  if (isError || !Array.isArray(noticeData?.data?.contents)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <AsyncState
          status="error"
          title="공지사항을 불러오지 못했습니다"
          description="인터넷 연결을 확인한 뒤 다시 시도해 주세요. 계속 문제가 생기면 잠시 후 이용해 주세요."
          onRetry={refetch}
          isRetrying={isFetching}
          className="w-full max-w-3xl border-red-100"
        />
      </div>
    );
  }

  const notices = noticeData.data.contents;
  const hasNextPage = noticeData?.data?.hasNextPage || false;
  const totalCount = noticeData?.data?.totalCount || 0;

  // 중요 공지사항을 상단에 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    const aImportant = a.dynamicFields?.important || false;
    const bImportant = b.dynamicFields?.important || false;
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항</h1>
          <p className="text-gray-600">전북생명의숲의 주요 소식을 확인하세요.</p>
        </div>

        {/* 관리자용 글쓰기 버튼 */}
        {isAdmin && (
          <div className="mb-6">
            <Link
              to="/news/notice/write"
              className="accessible-touch-target inline-flex items-center px-5 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              공지사항 작성
            </Link>
          </div>
        )}

        {/* 공지사항 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          {notices.length === 0 ? (
            <AsyncState
              status="empty"
              title="등록된 공지사항이 없습니다"
              description="새로운 공지사항이 등록되면 이곳에서 확인하실 수 있습니다."
              className="border-0 shadow-none"
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedNotices.map((notice) => (
                <div key={notice.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        to={`/news/notice/${notice.id}`}
                        className="block group"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200 mb-2">
                          {notice.title}
                          {notice.dynamicFields?.important && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-base font-medium bg-red-100 text-red-800">
                              [중요]
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center text-base text-gray-600 gap-x-4 gap-y-1">
                          <span>작성자: {notice.authorName}</span>
                          <span>작성일: {new Date(notice.updatedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </Link>
                    </div>
                    
                    {/* 관리자용 삭제 버튼 */}
                    {isAdmin && (
                      <div className="ml-4 flex items-center gap-2">
                        <Link
                          to={`/news/notice/edit/${notice.id}`}
                          className="accessible-touch-target inline-flex items-center justify-center p-2 text-green-700 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors duration-200"
                          title="수정"
                          aria-label={`${notice.title} 공지사항 수정`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          disabled={deleteNoticeMutation.isPending}
                          className="accessible-touch-target inline-flex items-center justify-center p-2 text-red-700 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-200"
                          title="삭제"
                          aria-label={`${notice.title} 공지사항 삭제`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalCount > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="accessible-touch-target px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="accessible-touch-target inline-flex items-center px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md" aria-live="polite">
                {page} / {Math.ceil(totalCount / 10)}
              </span>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!hasNextPage}
                className="accessible-touch-target px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
