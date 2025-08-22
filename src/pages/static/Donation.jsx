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
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-xl">
                <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">전북생명의숲 회원가입 및 후원신청</h2>
                <p className="text-green-700 text-center mb-8">
                  여러분의 소중한 후원이 더 푸른 숲을 만듭니다
                </p>
              </div>

              <form className="bg-white p-8 rounded-xl shadow-lg space-y-8">
                {/* 기본 정보 */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">기본 정보</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        성함을 기입해 주세요. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                        placeholder="성함을 입력해주세요"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        휴대전화를 남겨주세요. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                        placeholder="예시) 010-0000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* 후원 선택 */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">후원 선택</h3>
                  
                  <div className="space-y-4">
                    <label className="block text-lg font-semibold text-gray-700 mb-4">
                      후원선택 <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="donationType" value="general" className="w-5 h-5 text-green-600" />
                        <span className="text-lg">일반회원 : 월 10,000원 이상</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="donationType" value="family" className="w-5 h-5 text-green-600" />
                        <span className="text-lg">가족회원 : 월 15,000원 이상</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="donationType" value="corporate" className="w-5 h-5 text-green-600" />
                        <span className="text-lg">기업회원 : 월 30,000원 이상</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="donationType" value="lifetime" className="w-5 h-5 text-green-600" />
                        <span className="text-lg">평생회원 (1회 1,000,000원 이상)</span>
                      </label>
                      
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="donationType" value="other" className="w-5 h-5 text-green-600" />
                        <span className="text-lg">기타:</span>
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="금액을 입력해주세요"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 계좌 정보 */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">계좌 정보</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        은행명 및 계좌번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                        placeholder="예시) 은행명(전북은행,농협 등등) 000-0000-0000-00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        출금일 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="withdrawalDate" value="10" className="w-5 h-5 text-green-600" />
                          <span className="text-lg">10일</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="withdrawalDate" value="25" className="w-5 h-5 text-green-600" />
                          <span className="text-lg">25일</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 추가 정보 */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">추가 정보</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        생년월일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                      />
                      <p className="text-sm text-gray-600 mt-1">*단, 기부금영수증 발급을 원하시면 주민번호 13자리 전체 입력</p>
                    </div>
                    
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        주소
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                        placeholder="기부금 영수증 발급 및 우편물 수신에 동의하신다면 주소를 기입해주세요"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
                      placeholder="SNS 수신에 동의하신다면 이메일 주소를 기입해주세요"
                    />
                  </div>
                </div>

                {/* 동의사항 */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">동의사항</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        개인정보수집동의 <span className="text-red-500">*</span>
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <p className="text-gray-700">
                          - 수집 이용 목적 : 회비납부 및 정보제공 서비스 (수집항목 : 성명,생년월일,주소,전화번호,은행명,계좌번호), 기부금영수증발급을 위한 고유식별정보 / 회원관리서비스
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="privacyAgreement" value="yes" required className="w-5 h-5 text-green-600" />
                          <span className="text-lg">네, 동의합니다.</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="privacyAgreement" value="no" className="w-5 h-5 text-green-600" />
                          <span className="text-lg">아니오, 동의하지 않습니다.</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-lg font-semibold text-gray-700 mb-2">
                        개인정보 제3자 동의서 <span className="text-red-500">*</span>
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <p className="text-gray-700">
                          - 제공대상: 금융결제원, 휴먼소프트웨어 외 / 제공목적: CMS출금이체 등
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="thirdPartyAgreement" value="yes" required className="w-5 h-5 text-green-600" />
                          <span className="text-lg">네, 동의합니다.</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="thirdPartyAgreement" value="no" className="w-5 h-5 text-green-600" />
                          <span className="text-lg">아니오, 동의하지 않습니다.</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 최종 동의 */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-green-800 text-lg leading-relaxed">
                    위와같이 전북생명의숲 회원으로 가입하며 CMS출금 이체 신청에 동의합니다. 
                    모든 항목에 대하여 동의 및 거부할 수 있으며, 거부시 회비납부, 회원관리 서비스에 제한이 있을 수 있습니다. 
                    제공된 정보의 보유기간은 5년입니다.
                  </p>
                </div>

                {/* 제출 버튼 */}
                <div className="text-center">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-300 shadow-lg hover:shadow-xl"
                  >
                    후원 신청하기
                  </button>
                </div>
              </form>
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