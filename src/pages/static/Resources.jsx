import { useParams, Link } from 'react-router-dom';

export default function Resources() {
  const { subCategory } = useParams();

  const subCategories = [
    { id: 'general', name: '총회 자료집', path: '/resources/general' },
    { id: 'documents', name: '문서자료실', path: '/resources/documents' },
    { id: 'media', name: '미디어 자료실', path: '/resources/media' },
  ];

  const getContent = () => {
    switch (subCategory) {
      case 'general':
        return {
          title: '총회 자료집',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲 총회 자료집을 확인하실 수 있습니다.
              </p>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-800 mb-4">총회 자료집</h3>
                <p className="text-purple-700">
                  연도별 총회 자료집과 주요 의사결정 사항을 확인하실 수 있습니다.
                </p>
              </div>
            </div>
          )
        };
      case 'documents':
        return {
          title: '문서자료실',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 다양한 문서 자료를 확인하실 수 있습니다.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">정책 자료</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 환경 정책 자료</li>
                    <li>• 숲 보전 정책</li>
                    <li>• 교육 프로그램 자료</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">연구 보고서</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 생태 조사 보고서</li>
                    <li>• 교육 효과 분석</li>
                    <li>• 활동 성과 보고서</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        };
      case 'media':
        return {
          title: '미디어 자료실',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 미디어 자료를 확인하실 수 있습니다.
              </p>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">미디어 자료실</h3>
                <p className="text-orange-700">
                  활동 사진, 동영상, 홍보 자료 등을 확인하실 수 있습니다.
                </p>
              </div>
            </div>
          )
        };
      default:
        return {
          title: '자료실',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 다양한 자료를 확인하실 수 있습니다.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {subCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="bg-purple-50 p-6 rounded-lg text-center hover:bg-purple-100 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">{category.name}</h3>
                    <p className="text-purple-700 text-sm">자세히 보기</p>
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
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="prose prose-purple max-w-none">
        {content}
      </div>
    </div>
  );
} 