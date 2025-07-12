import { useParams, Link } from 'react-router-dom';

export default function Resources() {
  const { subCategory } = useParams();

  const subCategories = [
    { id: 'general', name: '총회 자료집', path: '/resources/general' },
    { id: 'documents', name: '문서자료실', path: '/resources/documents' },
    { id: 'jbforest', name: '전북생명의숲자료실', path: '/resources/jbforest' },
  ];

  const jbforestSubCategories = [
    { id: 'video', name: '영상자료실', path: '/resources/jbforest/video' },
    { id: 'photo', name: '사진자료실', path: '/resources/jbforest/photo' },
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
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">문서자료실</h3>
                <p className="text-blue-700 mb-4">
                  전국 생명의숲 공식 문서자료실로 이동하여 다양한 문서 자료를 확인하실 수 있습니다.
                </p>
                <a 
                  href="https://forest.or.kr/documents?page=2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  문서자료실 바로가기
                </a>
              </div>
            </div>
          )
        };
      case 'jbforest':
        return {
          title: '전북생명의숲자료실',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 영상 및 사진 자료를 확인하실 수 있습니다.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {jbforestSubCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="bg-green-50 p-6 rounded-lg text-center hover:bg-green-100 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-green-800 mb-2">{category.name}</h3>
                    <p className="text-green-700 text-sm">자세히 보기</p>
                  </Link>
                ))}
              </div>
            </div>
          )
        };
      case 'video':
        return {
          title: '영상자료실',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 영상 자료를 확인하실 수 있습니다.
              </p>
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-red-800 mb-4">영상자료실</h3>
                <p className="text-red-700 mb-4">
                  전북생명의숲의 다양한 활동 영상을 확인하실 수 있습니다.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">활동 영상</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 숲 교육 프로그램</li>
                      <li>• 환경 보전 활동</li>
                      <li>• 시민 참여 프로그램</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">홍보 영상</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 조직 소개 영상</li>
                      <li>• 프로그램 홍보</li>
                      <li>• 성과 보고 영상</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      case 'photo':
        return {
          title: '사진자료실',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 사진 자료를 확인하실 수 있습니다.
              </p>
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-yellow-800 mb-4">사진자료실</h3>
                <p className="text-yellow-700 mb-4">
                  전북생명의숲의 다양한 활동 사진을 확인하실 수 있습니다.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">활동 사진</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 숲 가꾸기 활동</li>
                      <li>• 교육 프로그램</li>
                      <li>• 시민 참여 행사</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">기록 사진</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 조직 활동 기록</li>
                      <li>• 성과 사진</li>
                      <li>• 역사적 순간</li>
                    </ul>
                  </div>
                </div>
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

  // 전북생명의숲자료실의 하위 카테고리인 경우
  if (subCategory === 'video' || subCategory === 'photo') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 상위 카테고리 네비게이션 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {subCategories.map((category) => (
              <Link
                key={category.id}
                to={category.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  category.id === 'jbforest'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        {/* 하위 카테고리 네비게이션 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {jbforestSubCategories.map((category) => (
              <Link
                key={category.id}
                to={category.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  subCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
        <div className="prose prose-green max-w-none">
          {content}
        </div>
      </div>
    );
  }

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