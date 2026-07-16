import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchChildCategories, fetchCategoryById } from '../services/categoryService';
import { deletePost, fetchPostsByCategory } from '../services/postService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncState from './AsyncState';
import { useAuth } from '../contexts/AuthContext';
import ImageModal from './ImageModal';

const Category = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    data: categoryData,
    isLoading: categoryLoading,
    isError: categoryError,
    error: categoryQueryError,
    isFetching: categoryFetching,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ['category-page', categoryId],
    queryFn: async () => {
      const currentCategory = await fetchCategoryById(categoryId);
      const parentId = currentCategory?.parentId;
      const [parentCategory, children] = await Promise.all([
        parentId && parentId !== 'null'
          ? fetchCategoryById(parentId)
          : Promise.resolve(null),
        fetchChildCategories(categoryId),
      ]);

      if (!currentCategory || !Array.isArray(children)) {
        throw new Error('INVALID_CATEGORY_RESPONSE');
      }

      return {
        currentCategory,
        parentCategory,
        childCategories: [...children].sort((a, b) => a.order - b.order),
      };
    },
    enabled: !!categoryId,
  });

  const currentCategory = categoryData?.currentCategory;
  const childCategories = categoryData?.childCategories || [];
  const parentCategory = categoryData?.parentCategory || null;
  const categoryName = currentCategory?.name || '';
  const canWrite = Boolean(
    isAuthenticated
      && (isAdmin || currentCategory?.writeAuthority),
  );
  const postType = currentCategory?.type || null;
  const categoryErrorCode = categoryQueryError?.response?.data?.code;
  const categoryNotFound = categoryError && (
    categoryQueryError?.response?.status === 404 || categoryErrorCode === 'NOT_FOUND_REQUEST'
  );

  // 게시글 목록 조회
  const {
    data: posts,
    isLoading: postsLoading,
    isError: postsError,
    error: postsQueryError,
    isFetching: postsFetching,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['posts', categoryId],
    queryFn: () => fetchPostsByCategory(categoryId),
    enabled: !!categoryId,
  });
  const postsForbidden = postsQueryError?.response?.status === 403;

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

  const {
    mutate: removeInformationPost,
    isPending: isDeletingInformation,
    variables: deletingInformationId,
  } = useMutation({
    mutationFn: (postId) => deletePost(categoryId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', categoryId] });
      handleCloseModal();
      alert('이미지 게시물이 삭제되었습니다.');
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error.message;
      alert(`이미지 게시물을 삭제하지 못했습니다: ${message}`);
    },
  });

  const handleInformationDelete = (postId) => {
    if (window.confirm('이 이미지 게시물과 포함된 이미지를 모두 삭제하시겠습니까?')) {
      removeInformationPost(postId);
    }
  };

  if (categoryLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <AsyncState
          status="loading"
          title="게시판을 불러오고 있습니다"
          className="w-full max-w-3xl"
        />
      </div>
    );
  }

  if (categoryNotFound || (!categoryError && !currentCategory)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <AsyncState
          status="empty"
          title="게시판을 찾을 수 없습니다"
          description="주소가 바뀌었거나 삭제된 게시판입니다. 홈에서 다른 게시판을 이용해 주세요."
        />
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="accessible-touch-target rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (categoryError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <AsyncState
          status="error"
          title="게시판을 불러오지 못했습니다"
          description="인터넷 연결을 확인한 뒤 다시 시도해 주세요."
          onRetry={refetchCategory}
          isRetrying={categoryFetching}
          className="w-full max-w-3xl border-red-100"
        />
      </div>
    );
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
          {canWrite && (
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
          <AsyncState
            status="loading"
            title={postType === 'INFORMATION' ? '이미지를 불러오고 있습니다' : '게시글을 불러오고 있습니다'}
            className="border-0 shadow-none"
          />
        ) : postsError || !Array.isArray(posts) ? (
          <AsyncState
            status="error"
            title={postsForbidden
              ? '이 게시판은 로그인이 필요합니다'
              : postType === 'INFORMATION'
                ? '이미지를 불러오지 못했습니다'
                : '게시글을 불러오지 못했습니다'}
            description={postsForbidden
              ? '로그인한 뒤 본인이 작성한 게시물 또는 관리 권한이 있는 게시물을 확인할 수 있습니다.'
              : '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'}
            onRetry={postsForbidden ? undefined : refetchPosts}
            isRetrying={postsFetching}
            className="border-red-100 shadow-none"
          />
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {postType === 'INFORMATION' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="group relative"
                  >
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleInformationDelete(post.id)}
                        disabled={isDeletingInformation && deletingInformationId === post.id}
                        className="mb-3 min-h-12 w-full rounded-lg border border-red-300 bg-red-50 px-4 py-3
                          text-base font-semibold text-red-800 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isDeletingInformation && deletingInformationId === post.id
                          ? '삭제 중…'
                          : '이 이미지 게시물 삭제'}
                      </button>
                    )}
                    {post.content && post.content.split(',').map((imageUrl, index) => (
                      <button
                        type="button"
                        key={index} 
                        className="aspect-square w-full overflow-hidden rounded-lg shadow-md focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                        aria-label={`${index + 1}번 이미지 크게 보기`}
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
                      </button>
                    ))}
                    <div className="mt-2 flex items-center justify-between text-base text-gray-600">
                      <span>{post.authorName}</span>
                      <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <button
                    type="button"
                    key={post.id}
                    className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all duration-200 hover:border-green-500 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
                    onClick={() => navigate(`/post/${categoryId}/${post.id}`, {
                      state: { categoryId, postType }
                    })}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">{post.title}</h3>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-base text-gray-600">
                      <span>{post.authorName}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <AsyncState
            status="empty"
            title={postType === 'INFORMATION' ? '등록된 이미지가 없습니다' : '등록된 게시글이 없습니다'}
            description={postType === 'INFORMATION'
              ? '새로운 이미지가 등록되면 이곳에서 확인하실 수 있습니다.'
              : '새로운 게시글이 등록되면 이곳에서 확인하실 수 있습니다.'}
            className="border-0 shadow-none"
          />
        )}
      </div>

      {/* 이미지 모달 */}
      {showModal && (
        <ImageModal imageUrl={selectedImage} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Category; 
