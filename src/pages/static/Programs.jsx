import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo, sortProgramsByStatus } from '../../utils/programStatus';
import { useMemo, useState } from 'react';
import { formatKoreanDateRange } from '../../utils/dateFormat';

const PROGRAM_STATUS_SECTIONS = [
  {
    status: 'IN_PROGRESS',
    title: '진행중 프로그램',
    description: '현재 신청 가능한 프로그램입니다.',
  },
  {
    status: 'UPCOMING',
    title: '접수 예정 프로그램',
    description: '곧 신청이 시작되는 프로그램입니다.',
  },
  {
    status: 'CLOSED',
    title: '접수 마감 프로그램',
    description: '신청은 마감되었지만 프로그램 참여 정보는 확인할 수 있습니다.',
  },
  {
    status: 'DONE',
    title: '종료된 프로그램',
    description: '운영이 종료된 프로그램입니다.',
  },
];

export default function Programs() {
  const { subCategory } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9; // 한 페이지당 표시할 프로그램 수

  const subCategories = [
    { id: 'participate', name: '참여 프로그램', path: '/programs/participate' },
    { id: 'guide', name: '숲 해설가 양성교육', path: '/programs/guide' },
    { id: 'volunteer', name: '자원봉사활동 신청', path: '/programs/volunteer' },
  ];

  // 모든 카테고리에서 API 데이터를 가져옴
  const { data: programsData, isLoading } = useQuery({
    queryKey: ['programs', subCategory, currentPage],
    queryFn: () => fetchPrograms(currentPage, pageSize, subCategory),
    enabled: !!subCategory, // subCategory가 있을 때만 API 호출
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
          type: 'api'
        };
      case 'volunteer':
        return {
          title: '자원봉사활동 신청',
          description: '자원봉사활동 신청 및 안내를 확인하실 수 있습니다.',
          type: 'api'
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
  const apiPrograms = programsData?.data?.contents || [];
  const totalCount = programsData?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const sortedPrograms = useMemo(() => sortProgramsByStatus(apiPrograms), [apiPrograms]);
  const groupedPrograms = useMemo(() => {
    const grouped = Object.fromEntries(PROGRAM_STATUS_SECTIONS.map((section) => [section.status, []]));

    sortedPrograms.forEach((program) => {
      if (grouped[program.status]) {
        grouped[program.status].push(program);
      }
    });

    return grouped;
  }, [sortedPrograms]);
  const hasPrograms = sortedPrograms.length > 0;

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

      {/* 프로그램 목록 (상태별 분리) */}
      {!hasPrograms ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-600">등록된 프로그램이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {PROGRAM_STATUS_SECTIONS.map((section) => {
            const sectionPrograms = groupedPrograms[section.status] || [];
            if (sectionPrograms.length === 0) {
              return null;
            }

            return (
              <section key={section.status} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                  </div>
                  <span className="inline-flex items-center self-start md:self-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    {sectionPrograms.length}건
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {sectionPrograms.map((program, index) => (
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
                            <span className={`px-3 py-1 text-sm rounded-full font-medium ${getProgramStatusInfo(program.status).className} shadow-sm`}>
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
                            <span>{formatKoreanDateRange(program.applyStartDate, program.applyEndDate)}</span>
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
              </section>
            );
          })}
        </div>
      )}

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
