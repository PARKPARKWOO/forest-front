const image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"%3E%3Crect width="1200" height="700" fill="%23166534"/%3E%3C/svg%3E';

export const publicHomeData = {
  userStatus: 403,
  categories: [
    { id: '101', name: '숲 이야기', children: [
      { id: '111', name: '지역 숲 기록', children: [] },
    ] },
    { id: '102', name: '시민 게시판', children: [] },
  ],
  banner: {
    banners: [{
      badgeText: '전북의 숲, 시민과 함께',
      title: '숲을 지키는 가장 가까운 방법',
      description: '전북생명의숲의 활동과 시민 참여 프로그램을 만나보세요.',
      backgroundImageUrl: image,
      sideImageUrl: image,
      titleColor: '#FFFFFF',
      descriptionColor: '#F0FDF4',
      badgeTextColor: '#F0FDF4',
      primaryButtonText: '단체 소개',
      primaryButtonLink: '/intro',
      secondaryButtonText: '프로그램 참여',
      secondaryButtonLink: '/programs/participate',
      sideTitle: '',
      sideDescription: '',
    }],
    autoSlideSeconds: 5,
  },
  programs: [{
    id: 'program-1',
    title: '전북 숲길 시민 프로그램',
    content: '<p>숲길을 함께 걸어요.</p>',
    category: 'PARTICIPATE',
    status: 'IN_PROGRESS',
    applyStartDate: '2026-07-01T09:00:00',
    applyEndDate: '2026-07-30T18:00:00',
    eventDate: '2026-08-02T10:00:00',
    maxParticipants: 20,
  }],
  notices: [{
    id: 'notice-1',
    title: '여름 숲 프로그램 참가 안내와 준비물 공지',
    authorName: '전북생명의숲',
    updatedAt: '2026-07-18T10:00:00',
    dynamicFields: { important: true },
  }],
  activities: [{
    id: 'activity-1',
    title: '시민과 함께한 전북 숲 돌봄 활동',
    content: `<p><img src="${image}" alt="" /></p>`,
    thumbnail: image,
    updatedAt: '2026-07-17T10:00:00',
  }],
  boardPosts: {
    '101': [{ id: 'post-101', title: '숲 이야기 첫 글', updatedAt: '2026-07-16T10:00:00', content: '' }],
    '111': [{ id: 'post-111', title: '지역 숲 기록 첫 글', updatedAt: '2026-07-15T10:00:00', content: '' }],
    '102': [],
  },
};
