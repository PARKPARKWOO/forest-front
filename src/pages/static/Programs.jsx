import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchPrograms } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';

export default function Programs() {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">프로그램</h1>
        {/* 관리자만 보이도록 수정 필요 */}
        <Link
          to="/programs/create"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          프로그램 등록
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : (
        <div className="grid gap-6">
          {programs?.map((program) => (
            <Link
              key={program.id}
              to={`/programs/${program.id}`}
              className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {program.title}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgramStatusInfo(program.status).className}`}>
                  {getProgramStatusInfo(program.status).text}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>신청기간: {program.applyStartDate} ~ {program.applyEndDate}</p>
                <p>행사일시: {new Date(program.eventDate).toLocaleString()}</p>
                <p>모집인원: {program.maxParticipants}명</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 