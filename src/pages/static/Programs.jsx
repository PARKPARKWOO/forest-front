import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';
import { useState } from 'react';

export default function Programs() {
  const { subCategory } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9; // 한 페이지당 표시할 프로그램 수

  const subCategories = [
    { id: 'participate', name: '참여 프로그램', path: '/programs/participate' },
    { id: 'guide', name: '숲 해설가 양성교육', path: '/programs/guide' },
    { id: 'volunteer', name: '자원봉사활동 신청', path: '/programs/volunteer' },
  ];

  // 참여 프로그램에서만 API 데이터를 가져옴
  const { data: programsData, isLoading } = useQuery({
    queryKey: ['programs', currentPage],
    queryFn: () => fetchPrograms(currentPage, pageSize),
    enabled: subCategory === 'participate' || !subCategory, // 참여 프로그램에서만 API 호출
  });

  const getContent = () => {
    switch (subCategory) {
      case 'participate':
        return {
          title: '참여 프로그램',
          description: '전북생명의숲의 다양한 참여 프로그램을 확인하실 수 있습니다.',
          type: 'api'
        };
      case 'guide':
        return {
          title: '숲 해설가 양성교육',
          description: '숲 해설가 양성을 위한 교육 프로그램을 소개합니다.',
          type: 'static',
          content: (
            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-4">숲 해설가 양성교육</h3>
                <p className="text-green-700 mb-4">
                  숲의 가치와 중요성을 알리고, 시민들에게 올바른 숲 교육을 제공할 수 있는 
                  숲 해설가를 양성하는 프로그램입니다.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">교육 과정</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 숲 생태학 기초</li>
                      <li>• 해설 기법 및 실습</li>
                      <li>• 안전 교육</li>
                      <li>• 현장 실습</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">자격 조건</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 만 18세 이상</li>
                      <li>• 숲에 대한 관심과 열정</li>
                      <li>• 봉사 정신</li>
                      <li>• 건강한 체력</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">신청 방법</h3>
                <p className="text-blue-700">
                  교육 신청은 전화 또는 이메일로 문의해주세요.<br />
                  전화: 063-231-4455<br />
                  이메일: forestjb@hanmail.net
                </p>
              </div>
            </div>
          )
        };
      case 'volunteer':
        return {
          title: '자원봉사활동 신청',
          description: '자원봉사활동 신청 및 안내를 확인하실 수 있습니다.',
          type: 'static',
          content: (
            <div className="space-y-6">
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-orange-800 mb-4">자원봉사활동</h3>
                <p className="text-orange-700 mb-4">
                  숲을 가꾸고 보전하는 활동에 함께 참여하실 수 있습니다. 
                  여러분의 소중한 시간이 더 푸른 숲을 만듭니다.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">봉사 활동</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 숲 가꾸기 활동</li>
                      <li>• 쓰레기 줍기</li>
                      <li>• 생태 복원 활동</li>
                      <li>• 교육 보조</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">활동 시간</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 평일: 오전 9시 ~ 오후 6시</li>
                      <li>• 주말: 오전 9시 ~ 오후 5시</li>
                      <li>• 계절별 조정 가능</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">신청 방법</h3>
                <p className="text-green-700">
                  자원봉사 신청은 아래 연락처로 문의해주세요.<br />
                  전화: 063-231-4455<br />
                  이메일: forestjb@hanmail.net
                </p>
              </div>
            </div>
          )
        };
      default:
        return {
          title: '프로그램 신청',
          description: '전북생명의숲의 다양한 프로그램을 확인하고 신청하실 수 있습니다.',
          type: 'static',
          content: (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-100 to-emerald-50 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-green-800 mb-4">다양한 프로그램에 참여하세요</h2>
                <p className="text-green-700 mb-6 max-w-2xl mx-auto">
                  전북생명의숲에서는 다양한 프로그램을 통해 숲의 가치를 전하고 있습니다.
                  여러분의 참여가 더 푸른 미래를 만듭니다.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {subCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={category.path}
                    className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm">자세히 보기</p>
                  </Link>
                ))}
              </div>
            </div>
          )
        };
    }
  };

  const { title, description, type, content } = getContent();

  // 참여 프로그램이 아닌 경우 정적 콘텐츠 표시
  if (type === 'static') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        <div className="prose prose-green max-w-none">
          {content}
        </div>
      </div>
    );
  }

  // 참여 프로그램인 경우 API 데이터 표시
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  // 데이터가 없거나 예상과 다른 구조인 경우 처리
  if (!programsData || !programsData.data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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
        <div className="text-center py-8">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  // 서버 응답 구조: { data: { contents: [], hasNextPage: boolean, totalCount: number } }
  const { contents: programs, totalCount } = programsData.data;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
        <div className="text-gray-600 mt-2">
          Total {totalCount}건 {currentPage}페이지
        </div>
      </div>

      {/* 프로그램 목록 */}
      <div className="grid md:grid-cols-3 gap-6">
        {programs?.map((program, index) => (
          <Link
            key={program.id}
            to={`/programs/detail/${program.id}`}
            className={`
              rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300
              ${index % 3 === 0 ? 'bg-gradient-to-br from-green-50 to-emerald-100' : 
                index % 3 === 1 ? 'bg-gradient-to-br from-blue-50 to-sky-100' :
                'bg-gradient-to-br from-amber-50 to-orange-100'}
            `}
          >
            {program.thumbnail && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={program.thumbnail} 
                  alt={program.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium 
                    ${getProgramStatusInfo(program.status).className} shadow-sm`}>
                    {getProgramStatusInfo(program.status).text}
                  </span>
                </div>
              </div>
            )}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {program.title}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center">
                  <span className="w-20">신청기간</span>
                  <span>{program.applyStartDate} ~ {program.applyEndDate}</span>
                </p>
                <p className="flex items-center">
                  <span className="w-20">모집인원</span>
                  <span>{program.maxParticipants}명</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            이전
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 border rounded-md ${
                currentPage === i + 1
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
} 