import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserList, getAuthorities, updateUserRole, createAuthority } from '../../services/userService';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAuthority, setSelectedAuthority] = useState('');
  const [authorityForm, setAuthorityForm] = useState({
    level: 1,
    authority: ''
  });

  // 사용자 목록 조회
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUserList(page),
  });

  // 권한 목록 조회
  const { data: authorities, isLoading: authoritiesLoading } = useQuery({
    queryKey: ['authorities'],
    queryFn: getAuthorities,
  });

  // 권한 생성
  const createAuthorityMutation = useMutation({
    mutationFn: (formData) => createAuthority(formData.level, formData.authority),
    onSuccess: () => {
      alert('권한이 생성되었습니다.');
      setAuthorityForm({ level: 1, authority: '' });
      queryClient.invalidateQueries(['authorities']);
    },
    onError: (error) => {
      alert('권한 생성 실패: ' + error.message);
    }
  });

  // 사용자 권한 수정
  const updateRoleMutation = useMutation({
    mutationFn: ({ targetId, authorityId }) => updateUserRole(targetId, authorityId),
    onSuccess: () => {
      alert('권한이 수정되었습니다.');
      queryClient.invalidateQueries(['users']);
      setSelectedUser(null);
      setSelectedAuthority('');
    },
    onError: (error) => {
      alert('권한 수정 실패: ' + error.message);
    }
  });

  const handleCreateAuthority = (e) => {
    e.preventDefault();
    createAuthorityMutation.mutate(authorityForm);
  };

  const handleSaveRole = () => {
    if (!selectedUser || !selectedAuthority) {
      alert('사용자와 권한을 모두 선택해주세요.');
      return;
    }

    updateRoleMutation.mutate({
      targetId: selectedUser.userId,
      authorityId: Number(selectedAuthority)
    });
  };

  if (usersLoading || authoritiesLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 권한 생성 폼 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">권한 생성</h2>
        <form onSubmit={handleCreateAuthority} className="flex gap-4 items-end">
          <div className="flex-1">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              레벨
            </label>
            <input
              type="number"
              value={authorityForm.level}
              onChange={(e) => setAuthorityForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
              min="1"
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
        <h2 className="text-xl font-bold mb-6">사용자 목록</h2>
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
                  현재 권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한 변경
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users?.contents.map((user) => (
                <tr 
                  key={user.userId}
                  className={selectedUser?.userId === user.userId ? 'bg-green-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedUser?.userId === user.userId ? (
                      <div className="flex gap-2">
                        <select
                          className="border border-gray-300 rounded-md shadow-sm px-3 py-2"
                          value={selectedAuthority}
                          onChange={(e) => setSelectedAuthority(e.target.value)}
                        >
                          <option value="">권한 선택</option>
                          {authorities?.map((authority) => (
                            <option key={authority.id} value={authority.id}>
                              {authority.authority} (레벨: {authority.level})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleSaveRole}
                          disabled={!selectedAuthority}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                            disabled:bg-gray-400 text-sm"
                        >
                          저장
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-green-600 hover:text-green-700"
                      >
                        권한 변경
                      </button>
                    )}
                  </td>
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
      </div>
    </div>
  );
} 