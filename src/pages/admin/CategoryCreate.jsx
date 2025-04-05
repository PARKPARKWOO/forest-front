import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createCategory, fetchCategories } from '../../services/categoryService';

export default function CategoryCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'POST',
    readAuthority: 'EVERYONE',
    writeAuthority: 'EVERYONE',
    parentId: null,
    order: 0,
  });

  // 전체 카테고리 목록 조회
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { mutate: submitCategory, isPending } = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      alert('카테고리가 생성되었습니다.');
      navigate('/admin');
    },
    onError: (error) => {
      alert('카테고리 생성에 실패했습니다: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitCategory({
      ...formData,
      parentCategoryId: formData.parentId ? Number(formData.parentId) : null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">새 카테고리 생성</h2>
        <button
          onClick={() => navigate('/admin')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← 돌아가기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            부모 카테고리
          </label>
          <select
            value={formData.parentId || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              parentId: e.target.value ? e.target.value : null 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">최상위 카테고리</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 이름
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 타입
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="POST">일반 게시글</option>
            <option value="INFORMATION">정보 게시판</option>
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              읽기 권한
            </label>
            <select
              value={formData.readAuthority}
              onChange={(e) => setFormData({ ...formData, readAuthority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="EVERYONE">모든 사용자</option>
              <option value="PRIVATE">비공개</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              쓰기 권한
            </label>
            <select
              value={formData.writeAuthority}
              onChange={(e) => setFormData({ ...formData, writeAuthority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="EVERYONE">모든 사용자</option>
              <option value="PRIVATE">비공개</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정렬 순서
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
              transition-colors duration-200 disabled:bg-gray-400"
          >
            {isPending ? '생성 중...' : '카테고리 생성'}
          </button>
        </div>
      </form>
    </div>
  );
} 