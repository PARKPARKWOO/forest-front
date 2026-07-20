export default function LegacyOrganizationDirectory() {
  return (
    <div className="min-w-0 space-y-8">
      <p className="break-words text-center text-xl leading-relaxed text-gray-700">
        전북생명의숲은 다양한 분야의 전문가들과 시민들이 함께 모여 활동하고 있습니다.
      </p>

      {/* 조직도 */}
      <div className="min-w-0 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-10">
        <h3 className="text-3xl font-bold text-green-800 mb-10 text-center">조직도</h3>

        <div className="flex min-w-0 flex-col items-center space-y-8">
          {/* 최고 지도층 */}
          <div className="w-full min-w-0 max-w-[250px] rounded-lg bg-green-700 px-4 py-4 text-center text-lg font-semibold text-white sm:px-8">
            공동대표 / 이사장
          </div>

          {/* 이사회와 감사 */}
          <div className="flex w-full min-w-0 flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-10">
            <button
              type="button"
              className="min-h-12 w-full min-w-0 rounded-lg bg-blue-600 px-4 py-4 text-center text-lg font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-900 sm:w-auto sm:min-w-[150px] sm:px-8"
              onClick={() => {
                const element = document.getElementById('board-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              이사회
            </button>
            <div className="w-full min-w-0 rounded-lg bg-gray-600 px-4 py-4 text-center text-lg font-semibold text-white sm:w-auto sm:min-w-[100px] sm:px-8">
              감사
            </div>
          </div>

          {/* 운영위원회 */}
          <button
            type="button"
            className="min-h-12 w-full min-w-0 max-w-[200px] rounded-lg bg-orange-700 px-4 py-4 text-center text-lg font-semibold text-white transition-colors duration-200 hover:bg-orange-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-orange-950 sm:px-8"
            onClick={() => {
              const element = document.getElementById('committee-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            운영위원회
          </button>

          {/* 4개 분과 */}
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 min-[390px]:grid-cols-2 md:grid-cols-4 md:gap-6">
            <div className="min-w-0 break-words rounded-lg bg-purple-700 px-4 py-3 text-center text-base font-medium text-white sm:px-6">
              탄소중립숲분과
            </div>
            <div className="min-w-0 break-words rounded-lg bg-purple-700 px-4 py-3 text-center text-base font-medium text-white sm:px-6">
              숲문화탐방분과
            </div>
            <div className="min-w-0 break-words rounded-lg bg-purple-700 px-4 py-3 text-center text-base font-medium text-white sm:px-6">
              숲교육분과
            </div>
            <div className="min-w-0 break-words rounded-lg bg-purple-700 px-4 py-3 text-center text-base font-medium text-white sm:px-6">
              숲조직홍보분과
            </div>
          </div>

          {/* 사무국 */}
          <div className="w-full min-w-0 max-w-[120px] rounded-lg bg-yellow-700 px-4 py-4 text-center text-lg font-semibold text-white sm:px-8">
            사무국
          </div>
        </div>
      </div>

      {/* 조직 구성원 명단 */}
      <div className="space-y-8">
        {/* 공동대표 */}
        <div className="min-w-0 break-words rounded-lg border-l-4 border-green-500 bg-white p-4 shadow-sm sm:p-8">
          <h3 className="text-2xl font-bold text-green-800 mb-6">공동대표</h3>
          <div className="space-y-3 text-gray-700 text-lg">
            <p>• 박종민 (전북대학교 산림환경과학과 교수)</p>
            <p>• 박해영 (금강유역환경회의 전북지역위원회 대표)</p>
            <p>• 김정숙 (산소리숲마을)</p>
          </div>
        </div>

        {/* 감사 */}
        <div className="min-w-0 break-words rounded-lg border-l-4 border-gray-500 bg-white p-4 shadow-sm sm:p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">감사</h3>
          <div className="space-y-3 text-gray-700 text-lg">
            <p>• 사업감사: 양차랑 (국립생태원)</p>
          </div>
        </div>

        {/* 이사회 */}
        <div id="board-section" className="min-w-0 break-words rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow-sm sm:p-8">
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
        <div id="committee-section" className="min-w-0 break-words rounded-lg border-l-4 border-orange-500 bg-white p-4 shadow-sm sm:p-8">
          <h3 className="text-2xl font-bold text-orange-800 mb-6">운영위원회 (운영위원장: 황중하)</h3>

          {/* 탄소중립분과 */}
          <div className="mb-8 rounded-lg bg-purple-50 p-4 sm:p-6">
            <h4 className="text-xl font-semibold text-purple-800 mb-3">탄소중립분과</h4>
            <p className="text-purple-700 mb-3 text-lg">분과장: 박해영</p>
            <p className="text-purple-700 text-lg">분과위원: 김연주, 김창석</p>
          </div>

          {/* 숲문화탐방분과 */}
          <div className="mb-8 rounded-lg bg-purple-50 p-4 sm:p-6">
            <h4 className="text-xl font-semibold text-purple-800 mb-3">숲문화탐방분과</h4>
            <p className="text-purple-700 mb-3 text-lg">분과장: 전정일</p>
            <p className="text-purple-700 text-lg">분과위원: 박영호, 박형근, 차옥순</p>
          </div>

          {/* 숲교육분과 */}
          <div className="mb-8 rounded-lg bg-purple-50 p-4 sm:p-6">
            <h4 className="text-xl font-semibold text-purple-800 mb-3">숲교육분과</h4>
            <p className="text-purple-700 mb-3 text-lg">분과장: 정진권</p>
            <p className="text-purple-700 text-lg">분과위원: 김기수, 김은아, 오광민, 이근자, 박은미</p>
          </div>

          {/* 숲조직홍보분과 */}
          <div className="rounded-lg bg-purple-50 p-4 sm:p-6">
            <h4 className="text-xl font-semibold text-purple-800 mb-3">숲조직홍보분과</h4>
            <p className="text-purple-700 mb-3 text-lg">분과장: 황중하</p>
            <p className="text-purple-700 text-lg">분과위원: 김계숙, 김기수, 김석균, 박정섭</p>
          </div>
        </div>
      </div>
    </div>
  );
}
