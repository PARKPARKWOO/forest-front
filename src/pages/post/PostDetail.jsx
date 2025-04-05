import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPostById } from '../../services/postService';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPostById(postId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">게시글을 찾을 수 없습니다</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
        
        <div className="flex items-center text-gray-500 mb-8">
          <span>{post.authorName}</span>
          <span className="mx-2">•</span>
          <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
        </div>

        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.images && post.images.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {post.images.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`첨부 이미지 ${index + 1}`}
                className="rounded-lg shadow-sm"
              />
            ))}
          </div>
        )}

        {post.dynamicFields && Object.keys(post.dynamicFields).length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">추가 정보</h3>
            <dl className="grid grid-cols-2 gap-4">
              {Object.entries(post.dynamicFields).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-500">{key}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{value.toString()}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
} 