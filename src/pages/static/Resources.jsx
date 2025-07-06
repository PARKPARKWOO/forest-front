import { useParams } from 'react-router-dom';

export default function Resources() {
  const { subCategory } = useParams();

  const getContent = () => {
    switch (subCategory) {
      case 'general':
        return {
          title: '총회 자료집',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲 총회 자료집을 다운로드하실 수 있습니다.
              </p>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">최신 자료</h3>
                <p className="text-purple-700">현재 등록된 총회 자료집이 없습니다.</p>
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">정관 및 규정</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 정관</li>
                    <li>• 운영 규정</li>
                    <li>• 회칙</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">보고서</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 연간 활동보고서</li>
                    <li>• 사업보고서</li>
                    <li>• 연구보고서</li>
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">사진 자료</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 활동 사진</li>
                    <li>• 행사 사진</li>
                    <li>• 교육 사진</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">동영상 자료</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 활동 동영상</li>
                    <li>• 교육 동영상</li>
                    <li>• 홍보 동영상</li>
                  </ul>
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
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-purple-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">총회 자료집</h3>
                  <p className="text-purple-700">총회 관련 자료를 확인하세요</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">문서자료실</h3>
                  <p className="text-blue-700">다양한 문서 자료를 확인하세요</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">미디어 자료실</h3>
                  <p className="text-green-700">사진과 동영상 자료를 확인하세요</p>
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