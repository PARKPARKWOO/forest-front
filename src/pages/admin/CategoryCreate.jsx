import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createCategory } from '../../services/categoryService';

export default function CategoryCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'POST', // 기본값
    readAuthority: true,
    writeAuthority: true,
    parentId: null,
    order: 0,  // 추가
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
      readAuthority: formData.readAuthority ? 'AUTHORIZED' : 'UNAUTHORIZED',
      writeAuthority: formData.writeAuthority ? 'AUTHORIZED' : 'UNAUTHORIZED',
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

        <div className="flex gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="readAuthority"
              checked={formData.readAuthority}
              onChange={(e) => setFormData({ ...formData, readAuthority: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="readAuthority" className="ml-2 block text-sm text-gray-900">
              읽기 권한
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="writeAuthority"
              checked={formData.writeAuthority}
              onChange={(e) => setFormData({ ...formData, writeAuthority: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="writeAuthority" className="ml-2 block text-sm text-gray-900">
              쓰기 권한
            </label>
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