import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../services/categoryService';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';
import { fetchPostsByCategory } from '../../services/postService';

export default function UserHome() {
  // 카테고리 조회
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 상위 2개 카테고리의 게시글 조회
  const topCategories = categories?.slice(0, 2) || [];

  // 각 카테고리의 최신 게시글 조회
  const categoryPosts = useQuery({
    queryKey: ['categoryPosts', topCategories],
    queryFn: async () => {
      const posts = await Promise.all(
        topCategories.map(async (category) => {
          const posts = await fetchPostsByCategory(category.id);
          return { categoryId: category.id, posts };
        })
      );
      return Object.fromEntries(posts.map(({ categoryId, posts }) => [categoryId, posts]));
    },
    enabled: topCategories.length > 0,
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 카테고리별 게시글 섹션 */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {topCategories.map(category => (
          <div key={category.id} className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
              <Link 
                to={`/category/${category.id}`}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                더보기 →
              </Link>
            </div>
            <div className="space-y-3">
              {categoryPosts.data?.[category.id]?.slice(0, 5).map(post => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block group"
                >
                  <div className="flex justify-between items-center py-2 border-b border-green-100">
                    <h3 className="text-gray-700 group-hover:text-green-600 truncate pr-4">
                      {post.title}
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
              {(!categoryPosts.data?.[category.id] || categoryPosts.data[category.id].length === 0) && (
                <p className="text-gray-500 text-center py-4">게시글이 없습니다.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 프로그램 섹션 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">진행중인 프로그램</h2>
          <Link 
            to="/programs"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            전체 프로그램 보기 →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {programs?.filter(program => program.status === 'IN_PROGRESS')
            .slice(0, 3)
            .map((program, index) => (
              <Link
                key={program.id}
                to={`/programs/${program.id}`}
                className={`
                  rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300
                  ${index % 3 === 0 ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 
                    index % 3 === 1 ? 'bg-gradient-to-br from-blue-50 to-sky-100' :
                    'bg-gradient-to-br from-amber-50 to-orange-100'}
                `}
              >
                {program.thumbnail && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={program.thumbnail} 
                      alt={program.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-3 py-1 text-sm rounded-full font-medium 
                        ${getProgramStatusInfo(program.status).className} shadow-sm`}>
                        {getProgramStatusInfo(program.status).text}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-green-700">
                    {program.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <span className="w-20">신청기간</span>
                      <span>{program.applyStartDate} ~ {program.applyEndDate}</span>
                    </p>
                    <p className="flex items-center">
                      <span className="w-20">모집인원</span>
                      <span>{program.maxParticipants}명</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
