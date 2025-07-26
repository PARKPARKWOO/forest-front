import { useParams, Link } from 'react-router-dom';

export default function ESG() {
  const { subCategory } = useParams();

  const subCategories = [
    { id: 'activities', name: '기업 ESG 사회 공헌활동', path: '/esg/activities' },
    { id: 'report', name: '기업 ESH 보고서', path: '/esg/report' },
  ];

  const getContent = () => {
    switch (subCategory) {
      case 'activities':
        return {
          title: '기업 ESG 사회 공헌활동',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                기업의 ESG(환경, 사회, 지배구조) 사회 공헌활동을 소개합니다.
              </p>
              <div className="bg-teal-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-teal-800 mb-4">ESG 사회 공헌활동</h3>
                <p className="text-teal-700">
                  기업과 함께하는 환경 보전 및 사회 공헌 활동을 통해 지속가능한 미래를 만들어갑니다.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">환경(Environment)</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 탄소 중립 활동</li>
                    <li>• 숲 조성 및 보전</li>
                    <li>• 생태계 복원</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">사회(Social)</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 지역 사회 발전</li>
                    <li>• 교육 프로그램 지원</li>
                    <li>• 자원봉사 활동</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        };
      case 'report':
        return {
          title: '기업 ESH 보고서',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                기업의 ESH(Environment, Safety, Health) 활동 보고서를 확인하실 수 있습니다.
              </p>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-indigo-800 mb-4">ESH 보고서</h3>
                <p className="text-indigo-700">
                  기업의 환경, 안전, 건강 관련 활동과 성과를 투명하게 공개합니다.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">환경 활동</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 환경 영향 평가</li>
                    <li>• 오염물질 관리</li>
                    <li>• 자원 절약 활동</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">안전 관리</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 안전 교육</li>
                    <li>• 사고 예방 활동</li>
                    <li>• 안전 점검</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">건강 관리</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 건강 검진</li>
                    <li>• 워라밸 지원</li>
                    <li>• 정신 건강 관리</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        };
      default:
        return {
          title: '기업 사회 공헌활동',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                기업의 ESG(환경, 사회, 지배구조) 사회 공헌활동을 소개합니다.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {subCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="bg-teal-50 p-6 rounded-lg text-center hover:bg-teal-100 transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-teal-800 mb-2">{category.name}</h3>
                    <p className="text-teal-700 text-sm">자세히 보기</p>
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
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="prose prose-teal max-w-none">
        {content}
      </div>
    </div>
  );
} 