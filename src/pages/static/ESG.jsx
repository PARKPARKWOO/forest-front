import { useParams } from 'react-router-dom';

export default function ESG() {
  const { subCategory } = useParams();

  const getContent = () => {
    switch (subCategory) {
      case 'activities':
        return {
          title: '기업 ESG 사회 공헌활동',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲과 함께하는 기업 ESG 사회 공헌활동을 소개합니다.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">ESG 활동</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 환경(Environmental) 활동</li>
                    <li>• 사회(Social) 활동</li>
                    <li>• 지배구조(Governance) 활동</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">파트너십</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 기업 협력 프로그램</li>
                    <li>• 사회공헌 활동</li>
                    <li>• 지속가능 발전</li>
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
                전북생명의숲의 기업 ESH(Environment, Safety, Health) 보고서를 확인하실 수 있습니다.
              </p>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">최신 보고서</h3>
                <p className="text-orange-700">현재 등록된 ESH 보고서가 없습니다.</p>
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
                전북생명의숲과 함께하는 기업 사회 공헌활동을 소개합니다.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">기업 ESG 사회 공헌활동</h3>
                  <p className="text-green-700">ESG 활동과 파트너십을 확인하세요</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">기업 ESH 보고서</h3>
                  <p className="text-orange-700">ESH 보고서를 확인하세요</p>
                </div>
              </div>
            </div>
          )
        };
    }
  };

  const { title, content } = getContent();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="prose prose-green max-w-none">
        {content}
      </div>
    </div>
  );
} 