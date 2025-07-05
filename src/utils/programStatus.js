export const getProgramStatusInfo = (status) => {
  switch (status) {
    case 'UPCOMING':
      return {
        text: '접수전',
        className: 'bg-green-100 text-green-800'
      };
    case 'IN_PROGRESS':
      return {
        text: '접수중',
        className: 'bg-red-100 text-red-800'
      };
    case 'CLOSED':
      return {
        text: '접수마감',
        className: 'bg-gray-900 text-white'
      };
    case 'DONE':
      return {
        text: '프로그램 종료',
        className: 'bg-gray-100 text-gray-800'
      };
    default:
      return {
        text: '알 수 없음',
        className: 'bg-gray-100 text-gray-800'
      };
  }
}; 