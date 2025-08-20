import { useParams, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Intro() {
  const { subCategory } = useParams();

  const subCategories = [
    { id: 'greeting', name: '인사말', path: '/intro/greeting' },
    { id: 'declaration', name: '창립선언문', path: '/intro/declaration' },
    { id: 'people', name: '함께하는이들', path: '/intro/people' },
    { id: 'activities', name: '주요활동', path: '/intro/activities' },
    { id: 'location', name: '오시는 길', path: '/intro/location' },
  ];

  const getContent = () => {
    switch (subCategory) {
      case 'greeting':
        return {
          title: '인사말',
          content: (
            <div className="space-y-8">
              {/* 편지 형태의 인사말 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-10 rounded-xl border-2 border-green-200 shadow-lg">
                <div className="prose prose-xl max-w-none text-gray-800 leading-relaxed">
                  <p className="mb-8 text-xl">
                    (사)전북생명의숲을 찾아 주심에 환영합니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    전 세계 곳곳 기후변화로 인해 거대한 태풍, 지진, 쓰나미 등이 발생하고 있습니다.
                    이로 인해 기후위기에 대응 및 적응하는 정책과 행동이 중요시 되는 현실입니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    (사)전북생명의숲은 도시의 열섬현상 완화와 녹색디자인을 통한 녹색생태도시의 실현을 위해 다양한 숲 운동을 전개하고 있습니다.
                    이러한 지역의 환경운동을 위해서는 우리 회원들의 역할이 더욱 필요한 시기입니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    (사)전북생명의숲은 회원의 후원으로 운영되는 소박한 시민단체로 숲운동, 숲해설가 양성 등을 비롯한
                    다양한 회원 참여 분과를 운영하고 있습니다.
                    취미, 동아리부터 학교숲가꾸기, 도시숲만들기 등으로 폭을 넓혀 나가도록 하겠습니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    그리고 지방행정의 녹색정책에 대해서도 저걸한 이슈를 제기하면서
                    도시와 농촌의 녹색 마인드가 집약된 녹색 전략을 시민에게 알려 녹색 서비스가 활성화 되도록 힘쓰겠습니다.
                  </p>
                  
                  <p className="mb-10 text-xl font-semibold text-green-800">
                    회원분들께서도 앞으로 (사)전북생명의숲과 함께 해 주시기 바랍니다.
                  </p>
                  
                  {/* 서명과 로고 */}
                  <div className="mt-10 pt-8 border-t-2 border-green-200">
                    <div className="flex items-center justify-between">
                      {/* 로고 */}
                      <div className="flex-shrink-0">
                        <img 
                          src={logo} 
                          alt="전북생명의숲 로고" 
                          className="h-20 w-auto object-contain"
                        />
                      </div>
                      
                      {/* 서명 */}
                      <div className="text-center flex-1">
                        <p className="text-xl text-gray-700 mb-4">(사)전북생명의숲 공동대표</p>
                        <div className="flex flex-wrap justify-center gap-6 text-xl font-semibold text-green-800">
                          <span>박해영</span>
                          <span>박종민</span>
                          <span>김정숙</span>
                        </div>
                      </div>
                      
                      {/* 빈 공간 (균형을 위해) */}
                      <div className="flex-shrink-0 w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      case 'declaration':
        return {
          title: '창립선언문',
          content: (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-10 rounded-lg border-l-4 border-green-500">
                <div className="prose prose-xl max-w-none text-gray-800 leading-relaxed">
                  <p className="mb-8 text-xl">
                    변변한 나무그늘도 없는 도심에서 숲을 키워내는 일은 어쩌면 사막에서 나무를 키우는 일처럼 대단한 용기와
                    고집을 필요로 할 지 모릅니다. 편안한 것과 효율적인 것만을 최고로 대우했던 우리가 이제 대단한 경제적인 대
                    가를 치루더라도 자연이 필요한 만큼의 숲을 키워내야만 할 때에 이르렀다고 합니다. 사막에서 사람이 살지 못
                    하는 것처럼 숲이 없는 곳에서 인간의 삶은 있어 본 적도 없다는 것을 너무나 잘 알고 있지만 아직 숲과 함께 공
                    존하는 방법을 알지 못합니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    숲에서 인간의 삶이 가능하였고 그 숲이 주는 경제적 이익으로 문명의 발전도 가능하였지만 이제 그 이익을 숲
                    에 돌려주려는 노력 없이는 그나마 그 의존적 삶마저 유한하다는 것을 알게 됩니다. 숲이 주는 효과는 숫자로 환
                    산하기조차 어렵습니다. 무엇을 받았는지 조차 헤아리기 어렵습니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    제 키보다 훌쩍 큰 나무에 올라타서 하루종일 놀아보지 않은 아이들에게 나무는 인간에게 필요한 것을 주는 경
                    제적 도구로만 느끼게 되지 않을까 싶습니다. 마을의 공원에 숲을 들이고 학교교정에 나무그늘을 만들고 흐르는
                    냇물에 나무그늘을 만들어 주는 일은, 우리가 삶이 노곤할 때 편안한 휴식이 되어주는 집을 갖는 것과 같습니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    숲은 경관으로서의 가치뿐 아니라 어머니가 자식을 키우는 것처럼 스스로 그 안에 있는 다양한 생물 종을 키워
                    내고 가꾸어냅니다. 초목이 무성한 숲은 떨어진 낙엽으로 완전히 뒤덮여 있어서 지면은 언제나 시원하고 족족함
                    은 물론 아무리 많은 비가 내려도 대부분의 수분이 지표면으로 쉽게 흡수됩니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    이 물은 다시 지하수계로 이동하여 다시 수면은 항상 일정한 수준 이상을 유지시켜 물을 완전한 순환을 가능케
                    합니다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    지나친 개발로 숲이 사라지면 샘이 마르고 종국에는 우리 자신도 병들어 신음하는 파국을 면키 어려울 것입니
                    다.
                  </p>
                  
                  <p className="mb-8 text-xl">
                    미래세대에 물려줄 수 있는 건강한 숲을 만들기 위해 기업, 정부, 학계, 그리고 시민들이 힘을 합침으로써 이시
                    기에 처한 난국을 이기고 정신적인 풍요를 찾을 수 있을 것입니다.
                  </p>
                  
                  <div className="mt-10 pt-8 border-t-2 border-green-200 text-center">
                    <p className="text-xl font-semibold text-green-800">2003. 8. 7</p>
                    <p className="text-2xl font-bold text-green-900">전북 생명의 숲 창립준비위원회 일동</p>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      case 'people':
        return {
          title: '함께하는이들',
          content: (
            <div className="space-y-8">
              <p className="text-xl text-gray-700 leading-relaxed text-center">
                전북생명의숲은 다양한 분야의 전문가들과 시민들이 함께 모여 활동하고 있습니다.
              </p>
              
              {/* 조직도 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-10 rounded-xl border border-green-200">
                <h3 className="text-3xl font-bold text-green-800 mb-10 text-center">조직도</h3>
                
                <div className="flex flex-col items-center space-y-8">
                  {/* 최고 지도층 */}
                  <div className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-center min-w-[250px] text-lg cursor-pointer hover:bg-green-700 transition-colors duration-200">
                    공동대표 / 이사장
                  </div>
                  
                  {/* 이사회와 감사 */}
                  <div className="flex justify-center space-x-10">
                    <div 
                      className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-center min-w-[150px] text-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                      onClick={() => {
                        const element = document.getElementById('board-section');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      이사회
                    </div>
                    <div className="bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-center min-w-[100px] text-lg cursor-pointer hover:bg-gray-700 transition-colors duration-200">
                      감사
                    </div>
                  </div>
                  
                  {/* 운영위원회 */}
                  <div 
                    className="bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold text-center min-w-[200px] text-lg cursor-pointer hover:bg-orange-600 transition-colors duration-200"
                    onClick={() => {
                      const element = document.getElementById('committee-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    운영위원회
                  </div>
                  
                  {/* 4개 분과 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-purple-400 text-white px-6 py-3 rounded-lg font-medium text-center text-base cursor-pointer hover:bg-purple-500 transition-colors duration-200">
                      탄소중립숲분과
                    </div>
                    <div className="bg-purple-400 text-white px-6 py-3 rounded-lg font-medium text-center text-base cursor-pointer hover:bg-purple-500 transition-colors duration-200">
                      숲문화탐방분과
                    </div>
                    <div className="bg-purple-400 text-white px-6 py-3 rounded-lg font-medium text-center text-base cursor-pointer hover:bg-purple-500 transition-colors duration-200">
                      숲교육분과
                    </div>
                    <div className="bg-purple-400 text-white px-6 py-3 rounded-lg font-medium text-center text-base cursor-pointer hover:bg-purple-500 transition-colors duration-200">
                      숲조직홍보분과
                    </div>
                  </div>
                  
                  {/* 사무국 */}
                  <div className="bg-yellow-500 text-white px-8 py-4 rounded-lg font-semibold text-center min-w-[120px] text-lg cursor-pointer hover:bg-yellow-600 transition-colors duration-200">
                    사무국
                  </div>
                </div>
              </div>

              {/* 조직 구성원 명단 */}
              <div className="space-y-8">
                {/* 공동대표 */}
                <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-green-500">
                  <h3 className="text-2xl font-bold text-green-800 mb-6">공동대표</h3>
                  <div className="space-y-3 text-gray-700 text-lg">
                    <p>• 박종민 (전북대학교 산림환경과학과 교수)</p>
                    <p>• 박해영 (금강유역환경회의 전북지역위원회 대표)</p>
                    <p>• 김정숙 (산소리숲마을)</p>
                  </div>
                </div>

                {/* 감사 */}
                <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-gray-500">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">감사</h3>
                  <div className="space-y-3 text-gray-700 text-lg">
                    <p>• 사업감사: 양차랑 (국립생태원)</p>
                  </div>
                </div>

                {/* 이사회 */}
                <div id="board-section" className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <h3 className="text-2xl font-bold text-blue-800 mb-6">이사회</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-gray-700 text-lg">
                    <div className="space-y-2">
                      <p>• 김계숙 (숲쟁이협동조합)</p>
                      <p>• 김석균 (흙건축연구소 대표)</p>
                      <p>• 김양용 (숲해설가)</p>
                      <p>• 김연주 (작가, 숲해설가)</p>
                      <p>• 김은아 (산림치유지도사)</p>
                      <p>• 김정숙 (산소리숲마을)</p>
                      <p>• 김종찬 (전주한일고등학교)</p>
                      <p>• 김창석 (평화의숲전북연대)</p>
                      <p>• 박성수 (前전북생명의숲사무국장)</p>
                      <p>• 박종민 (전북대학교 산림환경과학과)</p>
                      <p>• 박해영 (금강유역환경회의 전북지역위원회대표)</p>
                      <p>• 서욱현 (구례자연드림파크밀크쿱대표)</p>
                    </div>
                    <div className="space-y-2">
                      <p>• 손재호 (산림기술사)</p>
                      <p>• 양준화 (前전북생명의숲활동가)</p>
                      <p>• 양차랑 (국립생태원)</p>
                      <p>• 윤여인 (숲정이산림기술사사무소)</p>
                      <p>• 오흥근 (전북강살리기추진단)</p>
                      <p>• 이은성 (산소리숲마을)</p>
                      <p>• 이은주 (전주시새활용센터)</p>
                      <p>• 이창헌 (전북대학교 산림환경과학과)</p>
                      <p>• 전경수 (前원광대학교 환경조경학과)</p>
                      <p>• 전정일 ((사)생태교육센터 숲터대표)</p>
                      <p>• 정용준 (완주군귀농귀촌지원센터장)</p>
                      <p>• 정진권 (前한일고등학교)</p>
                    </div>
                    <div className="space-y-2">
                      <p>• 조명자 (산소리숲마을대표)</p>
                      <p>• 최석원 (장수군청 산림공원과)</p>
                      <p>• 표효숙 (숲해설가)</p>
                      <p>• 한경연 (前 성일고등학교 교사)</p>
                      <p>• 홍석기 (이화유치원)</p>
                      <p>• 황중하 (두산임업(유))</p>
                    </div>
                  </div>
                </div>

                {/* 운영위원회 */}
                <div id="committee-section" className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-orange-500">
                  <h3 className="text-2xl font-bold text-orange-800 mb-6">운영위원회 (운영위원장: 황중하)</h3>
                  
                  {/* 탄소중립분과 */}
                  <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                    <h4 className="text-xl font-semibold text-purple-800 mb-3">탄소중립분과</h4>
                    <p className="text-purple-700 mb-3 text-lg">분과장: 박해영</p>
                    <p className="text-purple-700 text-lg">분과위원: 김연주, 김창석</p>
                  </div>

                  {/* 숲문화탐방분과 */}
                  <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                    <h4 className="text-xl font-semibold text-purple-800 mb-3">숲문화탐방분과</h4>
                    <p className="text-purple-700 mb-3 text-lg">분과장: 전정일</p>
                    <p className="text-purple-700 text-lg">분과위원: 박영호, 박형근, 차옥순</p>
                  </div>

                  {/* 숲교육분과 */}
                  <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                    <h4 className="text-xl font-semibold text-purple-800 mb-3">숲교육분과</h4>
                    <p className="text-purple-700 mb-3 text-lg">분과장: 정진권</p>
                    <p className="text-purple-700 text-lg">분과위원: 김기수, 김은아, 오광민, 이근자, 박은미</p>
                  </div>

                  {/* 숲조직홍보분과 */}
                  <div className="p-6 bg-purple-50 rounded-lg">
                    <h4 className="text-xl font-semibold text-purple-800 mb-3">숲조직홍보분과</h4>
                    <p className="text-purple-700 mb-3 text-lg">분과장: 황중하</p>
                    <p className="text-purple-700 text-lg">분과위원: 김계숙, 김기수, 김석균, 박정섭</p>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      case 'activities':
        return {
          title: '주요활동',
          content: (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6">숲 교육</h3>
                  <ul className="space-y-3 text-gray-600 text-lg">
                    <li>• 숲 해설 프로그램</li>
                    <li>• 환경 교육</li>
                    <li>• 체험 학습</li>
                  </ul>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6">보전 활동</h3>
                  <ul className="space-y-3 text-gray-600 text-lg">
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
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">주소</h3>
                <p className="text-gray-700 mb-6 text-lg">
                  전북특별자치도 전주시 덕진구 중상보로30, 3층
                </p>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">연락처</h3>
                <p className="text-gray-700 mb-6 text-lg">
                  전화: 063-231-4455<br />
                  이메일: contact@jbforest.org
                </p>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">교통편</h3>
                <ul className="space-y-3 text-gray-600 text-lg">
                  <li>• 버스: [버스 노선 정보]</li>
                  <li>• 지하철: [지하철 정보]</li>
                  <li>• 자동차: [주차 정보]</li>
                </ul>
              </div>
              
              {/* Google Maps */}
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">지도</h3>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3234.6505843832474!2d127.16824487655981!3d35.833047772538585!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sko!2skr!4v1753699359752!5m2!1sko!2skr" 
                    width="100%" 
                    height="450" 
                    style={{border: 0}} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  />
                </div>
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
              className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors duration-200 ${
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

      <h1 className="text-4xl font-bold text-gray-900 mb-8">{title}</h1>
      <div className="prose prose-lg prose-green max-w-none">
        {content}
      </div>
    </div>
  );
} 