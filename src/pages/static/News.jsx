import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function News() {
  const { subCategory } = useParams();
  const { isAdmin } = useAuth();

  const subCategories = [
    { id: 'notice', name: '공지사항', path: '/news/notice' },
    { id: 'activities', name: '전북생명의숲 활동보기', path: '/news/activities' },
  ];

  const getContent = () => {
    switch (subCategory) {
      case 'notice':
        return {
          title: '공지사항',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 주요 공지사항을 확인하실 수 있습니다.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">공지사항</h3>
                <p className="text-blue-700">
                  중요한 소식과 안내사항을 빠르게 전달합니다.
                </p>
              </div>
            </div>
          )
        };
      case 'activities':
        return {
          title: '전북생명의숲 활동보기',
          content: (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-lg text-gray-700 leading-relaxed">
                  전북생명의숲의 다양한 활동들을 확인하실 수 있습니다.
                </p>
                {isAdmin && (
                  <Link
                    to="/post/write?categoryId=0"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    글쓰기
                  </Link>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">최근 활동</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 숲 가꾸기 활동</li>
                    <li>• 환경 교육 프로그램</li>
                    <li>• 시민 참여 행사</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">활동 갤러리</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 활동 사진</li>
                    <li>• 후기 및 소감</li>
                    <li>• 성과 보고</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        };
      default:
        return {
          title: '소식',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 최신 소식과 활동을 확인하실 수 있습니다.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {subCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="bg-blue-50 p-6 rounded-lg text-center hover:bg-blue-100 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">{category.name}</h3>
                    <p className="text-blue-700 text-sm">자세히 보기</p>
                  </Link>
                ))}
              </div>
            </div>
          )
        };
    }
  };

  const { title, content } = getContent();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* 하위 카테고리 네비게이션 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {subCategories.map((category) => (
            <Link
              key={category.id}
              to={category.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                subCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="prose prose-blue max-w-none">
        {content}
      </div>
    </div>
  );
} 