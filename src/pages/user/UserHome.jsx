import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../services/categoryService';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';
import { fetchPostsByCategory } from '../../services/postService';
import { getNoticeList } from '../../services/noticeService';

export default function UserHome() {
  // 카테고리 조회
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 정렬된 카테고리에서 상위 2개 선택
  const topCategories = categories?.sort((a, b) => b.order - a.order).slice(0, 2) || [];

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

  // 프로그램 목록 조회
  const { data: programsData } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetchPrograms(1, 10), // 홈페이지에서는 최근 10개만 표시
  });

  // 서버 응답 구조에서 programs 추출 (안전한 접근)
  const programs = programsData?.data?.contents || [];

  // 공지사항 조회
  const { data: noticeData } = useQuery({
    queryKey: ['notices', 'home'],
    queryFn: () => getNoticeList(1),
  });

  const notices = noticeData?.data?.contents || [];

  // 중요 공지사항을 상단에 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    const aImportant = a.dynamicFields?.important || false;
    const bImportant = b.dynamicFields?.important || false;
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 메인 배너 */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-xl shadow-lg mb-12 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center">
          <div className="p-8 md:p-12 md:w-1/2">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              전북생명의숲에 오신 것을 환영합니다
            </h1>
            <p className="text-green-100 mb-6">
              숲을 통해 생명의 가치를 전하고 지속가능한 미래를 만들어갑니다.
              함께 참여하고 소통하며 더 나은 환경을 만들어보세요.
            </p>
            <div className="flex space-x-4">
              <Link 
                to="/intro" 
                className="bg-white text-green-700 px-6 py-2 rounded-full font-medium hover:bg-green-50 transition-colors duration-300"
              >
                소개 보기
              </Link>
              <Link 
                to="/programs" 
                className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-800 transition-colors duration-300 border border-green-400"
              >
                프로그램 참여
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 h-64 md:h-80">
            <img 
              src="https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
              alt="숲 이미지" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 공지사항 섹션 */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM11 5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 2a1 1 0 00-1 1v1a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1H9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6a1 1 0 011-1h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6z" />
            </svg>
            공지사항
          </h2>
          <Link 
            to="/news/notice"
            className="text-green-600 hover:text-green-700 font-medium flex items-center"
          >
            전체 공지사항 보기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="p-6">
            {notices.length > 0 ? (
              <div className="space-y-4">
                {sortedNotices.slice(0, 5).map((notice, index) => (
                  <Link
                    key={notice.id}
                    to={`/news/notice/${notice.id}`}
                    className="block group"
                  >
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          공지
                        </span>
                        <h3 className="text-gray-900 group-hover:text-red-600 font-medium truncate pr-4">
                          {notice.title}
                          {notice.dynamicFields?.important && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">
                              [중요]
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{notice.authorName}</span>
                        <span>{new Date(notice.updatedAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📢</div>
                <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">새로운 공지사항이 등록되면 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 카테고리별 게시글 섹션 */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {topCategories.map(category => (
          <div key={category.id} className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
              <Link 
                to={`/category/${category.id}`}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center"
              >
                더보기 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            <div className="space-y-3">
              {categoryPosts.data?.[category.id]?.slice(0, 5).map(post => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  state={{ categoryId: category.id, postType: category.type }}
                  className="block group"
                >
                  <div className="flex justify-between items-center py-2 border-b border-green-100">
                    <h3 className="text-gray-700 group-hover:text-green-600 truncate pr-4">
                      {post.title}
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(post.updatedAt).toLocaleDateString()}
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
            className="text-green-600 hover:text-green-700 font-medium flex items-center"
          >
            전체 프로그램 보기
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {programs?.filter(program => program.status === 'IN_PROGRESS')
            .slice(0, 3)
            .map((program, index) => (
              <Link
                key={program.id}
                to={`/programs/detail/${program.id}`}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
          
          {(!programs || programs.filter(p => p.status === 'IN_PROGRESS').length === 0) && (
            <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">현재 진행중인 프로그램이 없습니다.</p>
              <Link 
                to="/programs" 
                className="inline-block mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                전체 프로그램 보기
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* 후원 섹션 */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-green-800 mb-4">함께 만들어가는 푸른 숲</h2>
        <p className="text-green-700 mb-6 max-w-2xl mx-auto">
          여러분의 소중한 후원은 더 많은 숲을 만들고 보전하는 데 사용됩니다.
          작은 정성이 모여 큰 변화를 만듭니다.
        </p>
        <Link 
          to="/donation" 
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors duration-300"
        >
          후원하기
        </Link>
      </div>
    </div>
  );
}
