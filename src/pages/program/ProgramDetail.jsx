import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchProgramById } from '../../services/programService';
import { getProgramStatusInfo } from '../../utils/programStatus';

export default function ProgramDetail() {
  const { id } = useParams();
  const { data: program, isLoading } = useQuery({
    queryKey: ['program', id],
    queryFn: () => fetchProgramById(id),
  });

  if (isLoading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{program.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProgramStatusInfo(program.status).className}`}>
            {getProgramStatusInfo(program.status).text}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">신청기간:</span>
              <span className="ml-2">{program.applyStartDate} ~ {program.applyEndDate}</span>
            </div>
            <div>
              <span className="font-semibold">행사일시:</span>
              <span className="ml-2">{new Date(program.eventDate).toLocaleString()}</span>
            </div>
            <div>
              <span className="font-semibold">모집인원:</span>
              <span className="ml-2">{program.maxParticipants}명</span>
            </div>
            <div>
              <span className="font-semibold">상태:</span>
              <span className="ml-2">{program.status}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-green max-w-none mb-6">
          <div dangerouslySetInnerHTML={{ __html: program.content }} />
        </div>

        {program.files?.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">첨부파일</h3>
            <ul className="space-y-2">
              {program.files.map((file, index) => (
                <li key={index}>
                  <a
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    파일 다운로드
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 