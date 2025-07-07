import { useParams, Link } from 'react-router-dom';

export default function Donation() {
  const { subCategory } = useParams();

  const subCategories = [
    { id: 'guide', name: '후원 안내', path: '/donation/guide' },
    { id: 'individual', name: '개인후원 신청', path: '/donation/individual' },
    { id: 'corporate', name: '기업후원 신청', path: '/donation/corporate' },
    { id: 'history', name: '나의 기부금 내역 조회', path: '/donation/history' },
  ];

  const getContent = () => {
    switch (subCategory) {
      case 'guide':
        return {
          title: '후원 안내',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲 후원에 대한 안내사항입니다.
              </p>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-4">
                  여러분의 후원이 숲을 더 푸르게 만듭니다
                </h3>
                <p className="text-green-700">
                  전북생명의숲은 시민들의 후원으로 운영되는 비영리 단체입니다. 
                  여러분의 소중한 후원금은 우리 지역의 숲을 가꾸고 보전하는데 사용됩니다.
                </p>
              </div>
            </div>
          )
        };
      case 'individual':
        return {
          title: '개인후원 신청',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                개인 후원 신청을 위한 안내입니다.
              </p>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">후원 계좌</h3>
                <div className="space-y-2">
                  <p>농협은행: 123-4567-8901-23</p>
                  <p>예금주: 전북생명의숲</p>
                </div>
              </div>
            </div>
          )
        };
      case 'corporate':
        return {
          title: '기업후원 신청',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                기업 후원 신청을 위한 안내입니다.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">기업 후원 문의</h3>
                <p className="text-blue-700">
                  기업 후원에 대한 자세한 안내는 전화 또는 이메일로 문의해주세요.
                </p>
                <div className="mt-4 space-y-2">
                  <p>전화: 063-123-4567</p>
                  <p>이메일: corporate@jbforest.org</p>
                </div>
              </div>
            </div>
          )
        };
      case 'history':
        return {
          title: '나의 기부금 내역 조회',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                후원 내역을 조회하실 수 있습니다.
              </p>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">후원 내역 조회</h3>
                <p className="text-purple-700">
                  로그인 후 후원 내역을 확인하실 수 있습니다.
                </p>
              </div>
            </div>
          )
        };
      default:
        return {
          title: '후원하기',
          content: (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-100 to-emerald-50 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-green-800 mb-4">함께 만들어가는 푸른 숲</h2>
                <p className="text-green-700 mb-6 max-w-2xl mx-auto">
                  여러분의 소중한 후원은 더 많은 숲을 만들고 보전하는 데 사용됩니다.
                  작은 정성이 모여 큰 변화를 만듭니다.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subCategories.map((category) => (
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