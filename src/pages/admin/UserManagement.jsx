import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAuthority, getUserList } from '../../services/userService';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [authorityForm, setAuthorityForm] = useState({
    level: 1,
    authority: ''
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUserList(page),
  });

  const createAuthorityMutation = useMutation({
    mutationFn: (formData) => createAuthority(formData.level, formData.authority),
    onSuccess: () => {
      alert('권한이 생성되었습니다.');
      setAuthorityForm({ level: 1, authority: '' });
    },
    onError: (error) => {
      alert('권한 생성 실패: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAuthorityMutation.mutate(authorityForm);
  };

  return (
    <div className="space-y-8">
      {/* 권한 생성 폼 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">권한 생성</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한 레벨
            </label>
            <input
              type="number"
              value={authorityForm.level}
              onChange={(e) => setAuthorityForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한명
            </label>
            <input
              type="text"
              value={authorityForm.authority}
              onChange={(e) => setAuthorityForm(prev => ({ ...prev, authority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={createAuthorityMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
              transition-colors duration-200 disabled:bg-gray-400"
          >
            {createAuthorityMutation.isPending ? '생성 중...' : '권한 생성'}
          </button>
        </form>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">사용자 목록</h2>
        {isLoading ? (
          <div className="text-center py-4">로딩 중...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.contents.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.userId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 페이지네이션 */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                이전
              </button>
              <span>페이지 {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!users?.hasNextPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 