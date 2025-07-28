import { useParams, Link } from 'react-router-dom';
import GoogleMap from '../../components/GoogleMap';

export default function Intro() {
  const { subCategory } = useParams();

  const subCategories = [
    { id: 'about', name: '전북생명의숲은!', path: '/intro/about' },
    { id: 'people', name: '함께하는이들', path: '/intro/people' },
    { id: 'activities', name: '주요활동', path: '/intro/activities' },
    { id: 'location', name: '오시는 길', path: '/intro/location' },
  ];

  const getContent = () => {
    switch (subCategory) {
      case 'about':
        return {
          title: '전북생명의숲은!',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲은 숲을 통해 생명의 가치를 실현하고자 하는 시민단체입니다.
                우리는 지속가능한 미래를 위해 숲을 가꾸고 보전하는 활동을 펼치고 있습니다.
              </p>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-4">우리의 비전</h3>
                <p className="text-green-700">
                  모든 생명이 공존하는 건강한 숲과 지속가능한 사회를 만들어갑니다.
                </p>
              </div>
            </div>
          )
        };
      case 'people':
        return {
          title: '함께하는이들',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲은 다양한 분야의 전문가들과 시민들이 함께 모여 활동하고 있습니다.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">이사진</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 이사장: [이름]</li>
                    <li>• 부이사장: [이름]</li>
                    <li>• 이사: [이름들]</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">전문가</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 숲 해설가</li>
                    <li>• 환경 전문가</li>
                    <li>• 교육 전문가</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        };
      case 'activities':
        return {
          title: '주요활동',
          content: (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">숲 교육</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 숲 해설 프로그램</li>
                    <li>• 환경 교육</li>
                    <li>• 체험 학습</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">보전 활동</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 숲 가꾸기</li>
                    <li>• 생태 복원</li>
                    <li>• 모니터링</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        };
      case 'location':
        return {
          title: '오시는 길',
          content: (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">주소</h3>
                <p className="text-gray-700 mb-4">
                  전북특별자치도 전주시 덕진구 중상보로30, 3층
                </p>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">연락처</h3>
                <p className="text-gray-700 mb-4">
                  전화: 063-231-4455<br />
                  이메일: contact@jbforest.org
                </p>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">교통편</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 버스: [버스 노선 정보]</li>
                  <li>• 지하철: [지하철 정보]</li>
                  <li>• 자동차: [주차 정보]</li>
                </ul>
              </div>
              
              {/* Google Maps */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">지도</h3>
                <GoogleMap 
                  address="전북특별자치도 전주시 덕진구 중상보로30, 3층"
                  className="w-full h-96"
                />
              </div>
            </div>
          )
        };
      default:
        return {
          title: '전북생명의숲 소개',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲은 숲을 통해 생명의 가치를 실현하고자 하는 시민단체입니다.
                우리는 지속가능한 미래를 위해 숲을 가꾸고 보전하는 활동을 펼치고 있습니다.
              </p>
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