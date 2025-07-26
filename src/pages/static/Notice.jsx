import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getNoticeList, deleteNotice } from '../../services/noticeService';
import { useAuth } from '../../contexts/AuthContext';

export default function Notice() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // 공지사항 목록 조회
  const { data: noticeData, isLoading, error } = useQuery({
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const notices = noticeData?.data?.contents || [];
  const hasNextPage = noticeData?.data?.hasNextPage || false;
  const totalCount = noticeData?.data?.totalCount || 0;

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
              to="/notice/write"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
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
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">등록된 공지사항이 없습니다</h3>
              <p className="text-gray-500">새로운 공지사항이 등록되면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notices.map((notice) => (
                <div key={notice.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        to={`/notice/${notice.id}`}
                        className="block group"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200 mb-2">
                          {notice.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>작성자: {notice.authorName}</span>
                          <span>작성일: {new Date(notice.updatedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </Link>
                    </div>
                    
                    {/* 관리자용 삭제 버튼 */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(notice.id)}
                        disabled={deleteNoticeMutation.isPending}
                        className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                        title="삭제"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                {page} / {Math.ceil(totalCount / 10)}
              </span>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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