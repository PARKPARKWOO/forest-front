import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';
import { useState } from 'react';

export default function Programs() {
  const { subCategory } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9; // 한 페이지당 표시할 프로그램 수

  const { data: programsData, isLoading } = useQuery({
    queryKey: ['programs', currentPage],
    queryFn: () => fetchPrograms(currentPage, pageSize),
  });

  const getContent = () => {
    switch (subCategory) {
      case 'participate':
        return {
          title: '참여 프로그램',
          description: '전북생명의숲의 다양한 참여 프로그램을 확인하실 수 있습니다.'
        };
      case 'guide':
        return {
          title: '숲 해설가 양성교육',
          description: '숲 해설가 양성을 위한 교육 프로그램을 소개합니다.'
        };
      case 'volunteer':
        return {
          title: '자원봉사활동 신청',
          description: '자원봉사활동 신청 및 안내를 확인하실 수 있습니다.'
        };
      default:
        return {
          title: '프로그램 신청',
          description: '전북생명의숲의 다양한 프로그램을 확인하고 신청하실 수 있습니다.'
        };
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  // 데이터가 없거나 예상과 다른 구조인 경우 처리
  if (!programsData || !programsData.data) {
    return <div className="text-center py-8">데이터를 불러올 수 없습니다.</div>;
  }

  // 서버 응답 구조: { data: { contents: [], hasNextPage: boolean, totalCount: number } }
  const { contents: programs, totalCount } = programsData.data;
  const totalPages = Math.ceil(totalCount / pageSize);
  const { title, description } = getContent();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
            to={`/programs/${program.id}`}
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