export const getProgramStatusInfo = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        text: '모집 진행중',
        className: 'bg-green-100 text-green-800',
      };
    case 'CLOSED':
      return {
        text: '모집 종료',
        className: 'bg-gray-100 text-gray-800',
      };
    case 'UPCOMING':
      return {
        text: '모집 예정',
        className: 'bg-blue-100 text-blue-800',
      };
    default:
      return {
        text: '상태 미정',
        className: 'bg-gray-100 text-gray-600',
      };
  }
}; 