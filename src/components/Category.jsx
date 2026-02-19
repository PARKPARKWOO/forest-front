import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchChildCategories, fetchCategoryById } from '../services/categoryService';
import { fetchPostsByCategory } from '../services/postService';
import { useQuery } from '@tanstack/react-query';

const Category = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [childCategories, setChildCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [writeAuthority, setWriteAuthority] = useState(false);
  const [parentCategory, setParentCategory] = useState(null);
  const [postType, setPostType] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 게시글 목록 조회
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', categoryId],
    queryFn: () => fetchPostsByCategory(categoryId),
    enabled: !!categoryId,
  });

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const currentCategory = await fetchCategoryById(categoryId);
        console.log('카테고리 데이터:', currentCategory);
        setCategoryName(currentCategory.name);
        setWriteAuthority(currentCategory.writeAuthority);
        setPostType(currentCategory.type);

        if (currentCategory.parentId && currentCategory.parentId !== "null") {
          const parent = await fetchCategoryById(currentCategory.parentId);
          setParentCategory(parent);
        }

        const children = await fetchChildCategories(categoryId);
        const sortedChildren = children.sort((a, b) => a.order - b.order);
        setChildCategories(sortedChildren);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };

    loadCategoryData();
  }, [categoryId]);

  const handleParentClick = () => {
    if (childCategories.length > 0 && parentCategory?.id) {
      navigate(`/category/${parentCategory.id}`);
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  if (!categoryName) {
    return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto">
      {/* 상단 네비게이션 */}
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
      
      {/* 하위 카테고리 목록 */}
      {childCategories.length > 0 && (
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
      )}

      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {postType === 'INFORMATION' ? '이미지 목록' : '게시글 목록'}
          </h2>
          {writeAuthority && (
            <button 
              onClick={() => {
                console.log('글쓰기 타입:', postType);
                navigate(`/category/${categoryId}/write`, {
                  state: { postType }
                });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 
                transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              {postType === 'INFORMATION' ? '이미지 업로드' : '글쓰기'}
            </button>
          )}
        </div>

        {postsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          </div>
        ) : posts?.length > 0 ? (
          <div className="space-y-4">
            {postType === 'INFORMATION' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="group relative"
                  >
                    {post.content && post.content.split(',').map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
                        onClick={() => {
                          setSelectedImage(imageUrl.trim());
                          setShowModal(true);
                        }}
                      >
                        <img 
                          src={imageUrl.trim()} 
                          alt={`이미지 ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    ))}
                    <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
                      <span>{post.authorName}</span>
                      <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-500 
                      transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`, {
                      state: { categoryId, postType }
                    })}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">{post.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 text-sm text-gray-500">
                      <span>{post.authorName}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {postType === 'INFORMATION' ? '등록된 이미지가 없습니다.' : '등록된 게시글이 없습니다.'}
          </div>
        )}
      </div>

      {/* 이미지 모달 */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={handleCloseModal}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl"
              onClick={handleCloseModal}
            >
              닫기 ×
            </button>
            <img
              src={selectedImage}
              alt="확대된 이미지"
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Category; 
