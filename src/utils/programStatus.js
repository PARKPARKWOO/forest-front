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

const STATUS_PRIORITY = {
  IN_PROGRESS: 0,
  UPCOMING: 1,
  CLOSED: 2,
  DONE: 3,
};

const parseDateToTime = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

const getPriority = (status) => STATUS_PRIORITY[status] ?? 9;

export const sortProgramsByStatus = (programs = []) => {
  return [...programs].sort((left, right) => {
    const priorityDiff = getPriority(left.status) - getPriority(right.status);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    switch (left.status) {
      case 'IN_PROGRESS': {
        const leftDeadline = parseDateToTime(left.applyEndDate || left.eventDate || left.applyStartDate);
        const rightDeadline = parseDateToTime(right.applyEndDate || right.eventDate || right.applyStartDate);
        return leftDeadline - rightDeadline;
      }
      case 'UPCOMING': {
        const leftStart = parseDateToTime(left.applyStartDate);
        const rightStart = parseDateToTime(right.applyStartDate);
        return leftStart - rightStart;
      }
      case 'CLOSED':
      case 'DONE': {
        const leftRecent = parseDateToTime(left.updatedAt || left.eventDate || left.applyEndDate);
        const rightRecent = parseDateToTime(right.updatedAt || right.eventDate || right.applyEndDate);
        return rightRecent - leftRecent;
      }
      default:
        return 0;
    }
  });
};
