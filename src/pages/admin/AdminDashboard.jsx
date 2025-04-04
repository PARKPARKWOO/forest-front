import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../../services/categoryService';
import { useState } from 'react';

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // ENUM 옵션 (백엔드와 맞춰야 함)
  const postTypes = [
    { value: 'INFORMATION', label: '정보' },
    { value: 'POST', label: '게시글' },
    { value: 'PROGRAM', label: '프로그램' },
  ];

  const postAuthorities = [
    { value: 'EVERYONE', label: '모두' },
    { value: 'PRIVATE', label: '비공개' },
  ];

  const [form, setForm] = useState({
    parentCategoryId: null,
    name: '',
    type: 'POST',
    readAuthority: 'EVERYONE',
    writeAuthority: 'EVERYONE',
    order: 1,
  });

  const { mutate: addCategory, isPending } = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      alert('카테고리가 생성되었습니다');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      alert('카테고리 생성에 실패했습니다');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-200 via-green-100 to-green-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">카테고리 생성</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCategory(form);
          }}
          className="space-y-6"
        >
          {/* 카테고리 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 이름
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="카테고리 이름을 입력하세요"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          {/* 유형 선택 */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              유형
            </label>
            <select
              id="type"
              name="type"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.type}
              onChange={handleChange}
            >
              {postTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 읽기/쓰기 권한 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="readAuthority" className="block text-sm font-medium text-gray-700 mb-1">
                읽기 권한
              </label>
              <select
                id="readAuthority"
                name="readAuthority"
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.readAuthority}
                onChange={handleChange}
              >
                {postAuthorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="writeAuthority" className="block text-sm font-medium text-gray-700 mb-1">
                쓰기 권한
              </label>
              <select
                id="writeAuthority"
                name="writeAuthority"
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.writeAuthority}
                onChange={handleChange}
              >
                {postAuthorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 우선순위 */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
              우선순위 <span className="text-xs text-gray-500">(숫자가 낮을수록 우선)</span>
            </label>
            <input
              id="order"
              type="number"
              name="order"
              placeholder="우선순위를 입력하세요"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.order}
              onChange={handleChange}
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            {isPending ? '생성중...' : '카테고리 생성'}
          </button>
        </form>
      </div>
    </div>
  );
}
