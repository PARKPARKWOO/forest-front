import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchChildCategories, fetchCategoryById } from '../services/categoryService';

const Category = () => {
  const { categoryId } = useParams();
  const [childCategories, setChildCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [writeAuthority, setWriteAuthority] = useState(false);
  const [parentCategory, setParentCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const currentCategory = await fetchCategoryById(categoryId);
        setCategoryName(currentCategory.name);
        setWriteAuthority(currentCategory.writeAuthority);

        if (currentCategory.parentId) {
          const parent = await fetchCategoryById(currentCategory.parentId);
          setParentCategory(parent);
        }

        const children = await fetchChildCategories(categoryId);
        // order 기준으로 정렬
        const sortedChildren = children.sort((a, b) => a.order - b.order);
        setChildCategories(sortedChildren);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };

    loadCategoryData();
  }, [categoryId]);

  const handleParentClick = () => {
    if (childCategories.length > 0) {
      // order가 가장 낮은 자식 카테고리로 이동
      const firstChild = childCategories[0];
      if (firstChild.readAuthority) {
        navigate(`/category/${firstChild.id}`);
      }
    }
  };

  if (!categoryName) {
    return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  }

  return (
    <div className="flex">
      {/* 메인 컨텐츠 */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {parentCategory && (
            <div className="text-center mb-6">
              <button 
                onClick={handleParentClick}
                className="text-gray-600 hover:text-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                {parentCategory.name}
              </button>
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">{categoryName}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {childCategories.map(category => (
              <button 
                key={category.id}
                className={`
                  p-4 rounded-lg border transition-all duration-200
                  ${!category.readAuthority ? 'opacity-70' : 'hover:border-green-500 hover:shadow-md'}
                  ${category.id === categoryId ? 'bg-green-50 border-green-500' : 'border-gray-200'}
                `}
                onClick={() => {
                  if (category.readAuthority) {
                    navigate(`/category/${category.id}`);
                  } else {
                    alert('접근 권한이 없습니다.');
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{category.name}</span>
                  {!category.readAuthority && (
                    <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded">
                      비공개
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {writeAuthority && (
            <div className="text-center">
              <button 
                onClick={() => navigate(`/category/${categoryId}/write`)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                글쓰기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 우측 네비게이터 */}
      <div className="w-64 border-l border-gray-200 p-4">
        <div className="sticky top-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">카테고리 목록</h2>
          <div className="space-y-2">
            {childCategories.map(category => (
              <button
                key={category.id}
                className={`
                  w-full text-left px-4 py-2 rounded-md transition-colors duration-200
                  ${category.id === categoryId 
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'}
                  ${!category.readAuthority ? 'opacity-50' : ''}
                `}
                onClick={() => {
                  if (category.readAuthority) {
                    navigate(`/category/${category.id}`);
                  } else {
                    alert('접근 권한이 없습니다.');
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{category.name}</span>
                  {!category.readAuthority && (
                    <span className="text-xs text-red-500">비공개</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category; 