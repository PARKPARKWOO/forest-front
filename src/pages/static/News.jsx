import { useParams } from 'react-router-dom';

export default function News() {
  const { subCategory } = useParams();

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
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">최신 공지</h3>
                <p className="text-yellow-700">현재 등록된 공지사항이 없습니다.</p>
              </div>
            </div>
          )
        };
      case 'activities':
        return {
          title: '생명의 숲 활동보기',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                전북생명의숲의 다양한 활동들을 소개합니다.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">최근 활동</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 숲 해설 프로그램 진행</li>
                    <li>• 환경 교육 실시</li>
                    <li>• 자원봉사 활동</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">활동 사진</h3>
                  <p className="text-gray-600">활동 사진들이 업로드될 예정입니다.</p>
                </div>
              </div>
            </div>
          )
        };
      case 'board':
        return {
          title: '자유게시판',
          content: (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                회원들이 자유롭게 소통할 수 있는 공간입니다.
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">게시판 안내</h3>
                <p className="text-blue-700">자유게시판은 로그인 후 이용하실 수 있습니다.</p>
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
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-yellow-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">공지사항</h3>
                  <p className="text-yellow-700">중요한 공지사항을 확인하세요</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">생명의 숲 활동보기</h3>
                  <p className="text-green-700">우리의 다양한 활동을 만나보세요</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">자유게시판</h3>
                  <p className="text-blue-700">회원들과 자유롭게 소통하세요</p>
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