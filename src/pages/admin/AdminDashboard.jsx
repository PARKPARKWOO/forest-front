import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, deleteCategory } from '../../services/categoryService';
import {
  deleteProgram,
  fetchProgramApplyCounts,
  fetchProgramApplies,
  fetchProgramForm,
  fetchPrograms,
} from '../../services/programService';
import { fetchSupporters, markSupportComplete } from '../../services/supportService';
import { getStaticContent, updateStaticContent } from '../../services/staticContentService';
import { getHomeBanner, updateHomeBanner } from '../../services/homeBannerService';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getProgramStatusInfo, sortProgramsByStatus } from '../../utils/programStatus';
import { formatKoreanDateRange } from '../../utils/dateFormat';
import { uploadImage } from '../../services/postService';
import { getHtmlPreviewText, hasMeaningfulHtmlContent } from '../../utils/contentUtils';
import { normalizeListMarkup } from '../../utils/editorContent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import UserManagement from './UserManagement';
import ProgramFormBuilder from '../../components/program/ProgramFormBuilder';
import ProgramApplyDetailModal from '../../components/program/ProgramApplyDetailModal';
import { useAuth } from '../../contexts/AuthContext';
import AsyncState from '../../components/AsyncState';
import OrganizationDirectoryEditor from '../../components/admin/organization/OrganizationDirectoryEditor';
import HomeHero from '../../features/home/HomeHero';
import {
  HOME_HERO_DEFAULT,
  createHomeBannerUpdatePayload,
  normalizeHomeBanners,
  resetHomeHeroVisibleFields,
  validateHomeHeroBanners,
} from '../../features/home/homeHeroModel';
import Button from '../../design-system/primitives/Button';
import FormField from '../../design-system/primitives/FormField';
import StatusBadge from '../../design-system/primitives/StatusBadge';
import Surface from '../../design-system/patterns/Surface';

// 카테고리 뱃지 헬퍼 함수
const getCategoryBadge = (category) => {
  const categoryInfo = {
    PARTICIPATE: { label: '참여 프로그램', className: 'bg-green-100 text-green-800' },
    participate: { label: '참여 프로그램', className: 'bg-green-100 text-green-800' },
    GUIDE: { label: '양성교육', className: 'bg-blue-100 text-blue-800' },
    guide: { label: '양성교육', className: 'bg-blue-100 text-blue-800' },
    VOLUNTEER: { label: '자원봉사', className: 'bg-orange-100 text-orange-800' },
    volunteer: { label: '자원봉사', className: 'bg-orange-100 text-orange-800' },
  };

  const info = categoryInfo[category] || { label: '참여', className: 'bg-gray-100 text-gray-800' };
  
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${info.className}`}>
      {info.label}
    </span>
  );
};

const INTRO_CONTENT_ITEMS = [
  { key: 'intro-greeting', label: '인사말', path: '/intro/greeting' },
  { key: 'intro-declaration', label: '창립선언문', path: '/intro/declaration' },
  { key: 'intro-people', label: '함께하는이들', path: '/intro/people' },
  { key: 'intro-activities', label: '주요활동', path: '/intro/activities' },
  { key: 'intro-location', label: '오시는 길', path: '/intro/location' },
];

const homeBannerTextFields = [
  ['home-banner-badge-text', '배지 문구', 'badgeText'],
  ['home-banner-title', '제목', 'title'],
];
const homeBannerActionFields = [
  ['home-banner-primary-button-text', '버튼 A 문구', 'primaryButtonText'],
  ['home-banner-primary-button-link', '버튼 A 링크', 'primaryButtonLink'],
  ['home-banner-secondary-button-text', '버튼 B 문구', 'secondaryButtonText'],
  ['home-banner-secondary-button-link', '버튼 B 링크', 'secondaryButtonLink'],
];
const ADMIN_MENU_KEYS = new Set([
  'categories',
  'programs',
  'users',
  'intro',
  'homeBanner',
  'donations',
  'mail',
]);
const MAX_ONLY_ADMIN_MENUS = new Set(['categories', 'users']);

const getInitialAdminMenu = (requestedMenu, hasMaxAccess) => {
  if (
    ADMIN_MENU_KEYS.has(requestedMenu)
    && (hasMaxAccess || !MAX_ONLY_ADMIN_MENUS.has(requestedMenu))
  ) {
    return requestedMenu;
  }
  return hasMaxAccess ? 'categories' : 'programs';
};

const getRequestErrorMessage = (error, fallback) => (
  error?.response?.data?.message || fallback
);

const getProgramApplyCountLabel = ({
  count,
  isError,
  isFetching,
  maxParticipants,
}) => {
  if (count !== undefined) {
    const safeCount = Number(count) || 0;
    const safeMaximum = Number(maxParticipants) || 0;
    return {
      count: `${safeCount}명`,
      percentage: safeMaximum > 0
        ? `${Math.round((safeCount / safeMaximum) * 100)}%`
        : null,
    };
  }
  if (isError) {
    return { count: '확인 필요', percentage: null };
  }
  return {
    count: isFetching ? '계산 중…' : '대기 중…',
    percentage: null,
  };
};

export default function AdminDashboard() {
  const { hasMaxAccess } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMenu = searchParams.get('section');
  const activeMenu = getInitialAdminMenu(requestedMenu, hasMaxAccess);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [supportersPage, setSupportersPage] = useState(0);
  const [supportersSize] = useState(10);
  const [selectedSupporter, setSelectedSupporter] = useState(null);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedProgramForForm, setSelectedProgramForForm] = useState(null);
  const [existingForm, setExistingForm] = useState(null);
  const [showApplyDetailModal, setShowApplyDetailModal] = useState(false);
  const [selectedApply, setSelectedApply] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIntroItem, setSelectedIntroItem] = useState(null);
  const [introDraft, setIntroDraft] = useState('');
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [homeBanners, setHomeBanners] = useState([HOME_HERO_DEFAULT]);
  const [selectedHomeBannerIndex, setSelectedHomeBannerIndex] = useState(0);
  const [homeBannerFieldErrors, setHomeBannerFieldErrors] = useState([]);
  const [uploadingBannerField, setUploadingBannerField] = useState(null);
  const [openingProgramFormId, setOpeningProgramFormId] = useState(null);
  const [formBuilderLoadError, setFormBuilderLoadError] = useState('');
  const introQuillRef = useRef(null);
  const programFormRequestRef = useRef(0);
  const homeBannerForm = homeBanners[selectedHomeBannerIndex] || HOME_HERO_DEFAULT;

  const selectAdminMenu = (menu) => {
    const nextMenu = getInitialAdminMenu(menu, hasMaxAccess);
    setSelectedProgramId(null);
    setFormBuilderLoadError('');
    programFormRequestRef.current += 1;
    setOpeningProgramFormId(null);
    setSearchParams({ section: nextMenu });
  };

  useEffect(() => {
    if (hasMaxAccess || !MAX_ONLY_ADMIN_MENUS.has(requestedMenu)) return;
    const next = new URLSearchParams(searchParams);
    next.set('section', 'programs');
    next.delete('item');
    setSearchParams(next, { replace: true });
  }, [hasMaxAccess, requestedMenu, searchParams, setSearchParams]);

  // 카테고리 목록 조회
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 프로그램 목록 조회
  const {
    data: programsData,
    error: programsError,
    isError: programsIsError,
    isFetching: programsFetching,
    isLoading: programsLoading,
    refetch: refetchPrograms,
  } = useQuery({
    queryKey: ['programs', categoryFilter],
    queryFn: () => fetchPrograms(1, 100, categoryFilter === 'all' ? null : categoryFilter),
    enabled: activeMenu === 'programs',
  });

  const programContents = programsData?.data?.contents;
  const hasInvalidProgramPayload = Boolean(programsData) && !Array.isArray(programContents);
  const rawPrograms = useMemo(
    () => (Array.isArray(programContents) ? programContents : []),
    [programContents],
  );
  const programs = useMemo(() => sortProgramsByStatus(rawPrograms), [rawPrograms]);
  const programIds = useMemo(
    () => rawPrograms.map((program) => program.id),
    [rawPrograms],
  );

  // 선택된 프로그램의 신청 목록 조회
  const {
    data: programApplies,
    error: appliesError,
    isError: appliesIsError,
    isFetching: appliesFetching,
    isLoading: appliesLoading,
    refetch: refetchProgramApplies,
  } = useQuery({
    queryKey: ['programApplies', selectedProgramId],
    queryFn: () => fetchProgramApplies(selectedProgramId),
    enabled: activeMenu === 'programs' && !!selectedProgramId,
  });

  // 관리자 목록은 배치 집계 API 한 번으로 신청자 수를 가져온다.
  const {
    data: programApplyCounts,
    isError: programApplyCountsIsError,
    isFetching: programApplyCountsFetching,
    refetch: refetchProgramApplyCounts,
  } = useQuery({
    queryKey: ['programApplyCounts', programIds],
    queryFn: () => fetchProgramApplyCounts(programIds),
    enabled: activeMenu === 'programs' && rawPrograms.length > 0,
    retry: (failureCount, error) => (
      ![400, 401, 403, 404].includes(error?.response?.status)
      && failureCount < 2
    ),
  });

  // 후원신청 목록 조회
  const { data: supportersData, isLoading: supportersLoading } = useQuery({
    queryKey: ['supporters', supportersPage, supportersSize],
    queryFn: () => fetchSupporters(supportersPage, supportersSize),
    enabled: activeMenu === 'donations',
  });

  const supporters = supportersData?.data?.contents || [];
  const totalPages = supportersData?.data?.totalPages || 0;
  const totalElements = supportersData?.data?.totalCount || 0;

  // 소개(정적 카테고리) 콘텐츠 조회
  const { data: introContents, isLoading: introContentsLoading } = useQuery({
    queryKey: ['introContents'],
    queryFn: async () => {
      const responses = await Promise.all(
        INTRO_CONTENT_ITEMS.map(async (item) => {
          const content = await getStaticContent(item.key);
          return [item.key, content];
        })
      );
      return Object.fromEntries(responses);
    },
    enabled: activeMenu === 'intro',
  });

  const {
    data: homeBannerData,
    isLoading: homeBannerLoading,
    isError: homeBannerError,
    isFetching: homeBannerFetching,
    refetch: refetchHomeBanner,
  } = useQuery({
    queryKey: ['homeBanner', 'admin'],
    queryFn: getHomeBanner,
    enabled: activeMenu === 'homeBanner',
    retry: false,
  });

  // 후원신청 완료 처리
  const { mutate: completeSupport } = useMutation({
    mutationFn: markSupportComplete,
    onSuccess: () => {
      alert('후원신청이 완료 처리되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['supporters'] });
    },
    onError: (error) => {
      alert('후원신청 완료 처리에 실패했습니다: ' + error.message);
    },
  });

  // 카테고리 삭제
  const { mutate: removeCategory } = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      alert('카테고리가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      alert('카테고리 삭제에 실패했습니다: ' + error.message);
    },
  });

  // 프로그램 삭제
  const {
    mutate: removeProgram,
    isPending: deletingProgram,
    variables: deletingProgramId,
  } = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      alert('프로그램이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programApplyCounts'] });
    },
    onError: (error) => {
      alert('프로그램 삭제에 실패했습니다: ' + error.message);
    },
  });

  // 소개글 저장
  const { mutate: saveIntroContent, isPending: isSavingIntroContent } = useMutation({
    mutationFn: ({ key, label, content }) => updateStaticContent(key, {
      title: label,
      content,
    }),
    onSuccess: () => {
      alert('소개글이 저장되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['introContents'] });
      setShowIntroModal(false);
      setSelectedIntroItem(null);
      setIntroDraft('');
    },
    onError: (error) => {
      alert('소개글 저장에 실패했습니다: ' + error.message);
    },
  });

  const { mutate: saveHomeBanner, isPending: isSavingHomeBanner } = useMutation({
    mutationFn: updateHomeBanner,
    onSuccess: () => {
      alert('홈 배너가 저장되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['homeBanner'] });
      queryClient.invalidateQueries({ queryKey: ['homeBanner', 'admin'] });
    },
    onError: (error) => {
      alert('홈 배너 저장에 실패했습니다: ' + error.message);
    },
  });

  // 신청 폼 생성/수정 열기
  const handleOpenFormBuilder = async (program) => {
    if (openingProgramFormId) return;

    const requestId = programFormRequestRef.current + 1;
    programFormRequestRef.current = requestId;
    setOpeningProgramFormId(program.id);
    setFormBuilderLoadError('');
    try {
      const form = await fetchProgramForm(program.id);
      if (programFormRequestRef.current !== requestId) return;
      setSelectedProgramForForm(program);
      setExistingForm(form);
      setShowFormBuilder(true);
    } catch (error) {
      if (programFormRequestRef.current !== requestId) return;
      setFormBuilderLoadError(getRequestErrorMessage(
        error,
        '신청 폼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ));
    } finally {
      if (programFormRequestRef.current === requestId) {
        setOpeningProgramFormId(null);
      }
    }
  };

  // 폼 빌더 닫기
  const handleCloseFormBuilder = () => {
    setShowFormBuilder(false);
    setSelectedProgramForForm(null);
    setExistingForm(null);
  };

  // 신청 상세 모달 열기
  const handleOpenApplyDetail = (apply) => {
    setSelectedApply(apply);
    setShowApplyDetailModal(true);
  };

  // 신청 상세 모달 닫기
  const handleCloseApplyDetail = () => {
    setShowApplyDetailModal(false);
    setSelectedApply(null);
  };

  const handleOpenIntroEditor = (item) => {
    const existingContent = introContents?.[item.key]?.content || '';
    setSelectedIntroItem(item);
    setIntroDraft(normalizeListMarkup(existingContent));
    setShowIntroModal(true);
  };

  const handleCloseIntroEditor = () => {
    setShowIntroModal(false);
    setSelectedIntroItem(null);
    setIntroDraft('');
  };

  const handleSaveIntroContent = () => {
    if (!selectedIntroItem) {
      return;
    }
    saveIntroContent({
      key: selectedIntroItem.key,
      label: selectedIntroItem.label,
      content: normalizeListMarkup(introDraft),
    });
  };

  const handleHomeBannerFieldChange = (field, value) => {
    setHomeBanners((current) => current.map((banner, index) => (
      index === selectedHomeBannerIndex ? { ...banner, [field]: value } : banner
    )));
    setHomeBannerFieldErrors((current) => current.map((errors, index) => (
      index === selectedHomeBannerIndex ? { ...errors, [field]: undefined } : errors
    )));
  };

  const handleHomeBannerImageUpload = async (field, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingBannerField(field);
    try {
      const imageUrl = await uploadImage(file);
      handleHomeBannerFieldChange(field, imageUrl);
    } catch (error) {
      console.error('홈 배너 이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingBannerField(null);
      event.target.value = '';
    }
  };

  const handleSaveHomeBanner = () => {
    if (homeBannerLoading || homeBannerError) return;
    const validation = validateHomeHeroBanners(homeBanners);
    const firstInvalidIndex = validation.findIndex((errors) => Object.keys(errors).length > 0);
    setHomeBannerFieldErrors(validation);
    if (firstInvalidIndex >= 0) {
      setSelectedHomeBannerIndex(firstInvalidIndex);
      return;
    }
    saveHomeBanner(createHomeBannerUpdatePayload(homeBanners));
  };

  const handleAddHomeBanner = () => {
    const nextBanner = {
      ...HOME_HERO_DEFAULT,
      title: `${HOME_HERO_DEFAULT.title} ${homeBanners.length + 1}`,
    };
    setHomeBanners((prev) => [...prev, nextBanner]);
    setHomeBannerFieldErrors((current) => [...current, {}]);
    setSelectedHomeBannerIndex(homeBanners.length);
  };

  const handleRemoveCurrentHomeBanner = () => {
    if (homeBanners.length <= 1) {
      alert('최소 1개의 배너는 필요합니다.');
      return;
    }
    setHomeBanners((prev) => prev.filter((_, index) => index !== selectedHomeBannerIndex));
    setHomeBannerFieldErrors((current) => current.filter((_, index) => index !== selectedHomeBannerIndex));
    setSelectedHomeBannerIndex((prev) => Math.max(0, prev - 1));
  };

  const handleApplyDefaultHomeBanner = () => {
    setHomeBannerFieldErrors((current) => current.map((errors, index) => (
      index === selectedHomeBannerIndex ? {} : errors
    )));
    setHomeBanners((current) => current.map((banner, index) => (
      index === selectedHomeBannerIndex ? resetHomeHeroVisibleFields(banner) : banner
    )));
  };

  useEffect(() => {
    const nextBanners = normalizeHomeBanners(homeBannerData);
    setHomeBanners(nextBanners);
    setHomeBannerFieldErrors(nextBanners.map(() => ({})));
    setSelectedHomeBannerIndex(0);
  }, [homeBannerData]);

  const introEditorModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
              const imageUrl = await uploadImage(file);
              const editor = introQuillRef.current?.getEditor();
              const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
              editor?.insertEmbed(range.index, 'image', imageUrl);
            } catch (error) {
              console.error('이미지 업로드 실패:', error);
              alert('이미지 업로드에 실패했습니다.');
            }
          };
        },
      },
    },
  }), []);

  const handleIntroEditorDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      return;
    }

    try {
      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file);
        const editor = introQuillRef.current?.getEditor();
        const range = editor?.getSelection() || { index: editor?.getLength() || 0 };
        editor?.insertEmbed(range.index, 'image', imageUrl);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const selectedProgram = programs.find((program) => program.id === selectedProgramId);
  const validProgramApplies = Array.isArray(programApplies) ? programApplies : [];
  const hasInvalidProgramApplies = Boolean(programApplies) && !Array.isArray(programApplies);

  const openProgramEdit = (programId) => {
    navigate(`/programs/edit/${programId}`, {
      state: { returnTo: '/admin?section=programs' },
    });
  };

  const confirmProgramDelete = (program) => {
    if (deletingProgram) return;
    if (window.confirm(`'${program.title}' 프로그램을 정말 삭제하시겠습니까?`)) {
      removeProgram(program.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      {/* 좌측 사이드바 */}
      <aside className="w-full bg-white shadow-md lg:w-64 lg:shrink-0">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">관리자 메뉴</h2>
        </div>
        <nav className="grid grid-cols-2 gap-2 px-3 pb-4 sm:grid-cols-3 lg:mt-2 lg:block lg:space-y-1 lg:px-0">
          {hasMaxAccess && (
            <button
              type="button"
              aria-current={activeMenu === 'categories' ? 'page' : undefined}
              className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
                activeMenu === 'categories'
                  ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => selectAdminMenu('categories')}
            >
              카테고리 관리
            </button>
          )}
          <button
            type="button"
            aria-current={activeMenu === 'programs' ? 'page' : undefined}
            className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
              activeMenu === 'programs' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => selectAdminMenu('programs')}
          >
            프로그램 관리
          </button>
          {hasMaxAccess && (
            <button
              type="button"
              aria-current={activeMenu === 'users' ? 'page' : undefined}
              className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
                activeMenu === 'users'
                  ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => selectAdminMenu('users')}
            >
              사용자 관리
            </button>
          )}
          <button
            type="button"
            aria-current={activeMenu === 'intro' ? 'page' : undefined}
            className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
              activeMenu === 'intro'
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => selectAdminMenu('intro')}
          >
            소개글 관리
          </button>
          <button
            type="button"
            aria-current={activeMenu === 'homeBanner' ? 'page' : undefined}
            className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
              activeMenu === 'homeBanner'
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => selectAdminMenu('homeBanner')}
          >
            홈배너 관리
          </button>
          <button
            type="button"
            aria-current={activeMenu === 'donations' ? 'page' : undefined}
            className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
              activeMenu === 'donations' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => selectAdminMenu('donations')}
          >
            후원금 관리
          </button>
          <button
            type="button"
            aria-current={activeMenu === 'mail' ? 'page' : undefined}
            className={`min-h-12 w-full rounded-lg px-4 py-3 text-left text-base font-semibold lg:rounded-none ${
              activeMenu === 'mail' 
                ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => selectAdminMenu('mail')}
          >
            메일 발송
          </button>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeMenu === 'categories' && '카테고리 관리'}
            {activeMenu === 'programs' && '프로그램 관리'}
            {activeMenu === 'users' && '사용자 관리'}
            {activeMenu === 'intro' && '소개글 관리'}
            {activeMenu === 'homeBanner' && '홈배너 관리'}
            {activeMenu === 'donations' && '후원금 관리'}
            {activeMenu === 'mail' && '메일 발송'}
          </h1>
        </div>

        {/* 카테고리 관리 */}
        {activeMenu === 'categories' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">카테고리 목록</h3>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => navigate('/admin/category/create')}
              >
                새 카테고리
              </button>
            </div>

            {categoriesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">읽기 권한</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">쓰기 권한</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories?.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.readAuthority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.writeAuthority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          className="text-green-600 hover:text-green-900 mr-3"
                          onClick={() => {/* 수정 모달 열기 */}}
                        >
                          수정
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                              removeCategory(category.id);
                            }
                          }}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 프로그램 관리 */}
        {activeMenu === 'programs' && (
          <section className="rounded-2xl bg-white p-4 shadow sm:p-6" aria-labelledby="program-management-title">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                <h3 id="program-management-title" className="text-2xl font-bold text-gray-900">
                  프로그램 목록
                </h3>
                <label className="flex flex-col gap-1 text-base font-semibold text-gray-700">
                  <span>카테고리</span>
                <select
                  value={categoryFilter}
                    onChange={(event) => {
                      programFormRequestRef.current += 1;
                      setOpeningProgramFormId(null);
                      setCategoryFilter(event.target.value);
                      setSelectedProgramId(null);
                      setFormBuilderLoadError('');
                    }}
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600 sm:w-auto"
                >
                  <option value="all">전체 카테고리</option>
                  <option value="participate">참여 프로그램</option>
                  <option value="guide">숲 해설가 양성교육</option>
                  <option value="volunteer">자원봉사활동</option>
                </select>
                </label>
              </div>
              <button
                type="button"
                className="min-h-12 w-full rounded-lg bg-green-700 px-5 py-3 text-base font-bold text-white hover:bg-green-800 sm:w-auto"
                onClick={() => navigate('/programs/create', {
                  state: { returnTo: '/admin?section=programs' },
                })}
              >
                새 프로그램
              </button>
            </div>

            {formBuilderLoadError && (
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
                <p>{formBuilderLoadError}</p>
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-red-300 px-4 font-semibold hover:bg-red-100"
                  onClick={() => setFormBuilderLoadError('')}
                >
                  닫기
                </button>
              </div>
            )}

            {programsLoading ? (
              <AsyncState
                status="loading"
                title="프로그램 목록을 불러오고 있습니다"
              />
            ) : programsIsError || hasInvalidProgramPayload ? (
              <AsyncState
                status="error"
                title="프로그램 목록을 불러오지 못했습니다"
                description={hasInvalidProgramPayload
                  ? '서버 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.'
                  : getRequestErrorMessage(programsError, '잠시 후 다시 시도해 주세요.')}
                onRetry={refetchPrograms}
                isRetrying={programsFetching}
              />
            ) : selectedProgramId ? (
              // 프로그램 신청자 목록
              <div className="min-w-0">
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={() => setSelectedProgramId(null)}
                    className="inline-flex min-h-12 items-center rounded-lg px-3 text-base font-bold text-green-700 hover:bg-green-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    프로그램 목록으로 돌아가기
                  </button>
                </div>
                
                <h4 className="mb-5 break-words text-xl font-bold text-gray-900">
                  {selectedProgram?.title || '선택한 프로그램'} - 신청자 목록
                </h4>
                
                {appliesLoading ? (
                  <AsyncState status="loading" title="신청자 목록을 불러오고 있습니다" />
                ) : appliesIsError || hasInvalidProgramApplies ? (
                  <AsyncState
                    status="error"
                    title="신청자 목록을 불러오지 못했습니다"
                    description={hasInvalidProgramApplies
                      ? '서버 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.'
                      : getRequestErrorMessage(appliesError, '잠시 후 다시 시도해 주세요.')}
                    onRetry={refetchProgramApplies}
                    isRetrying={appliesFetching}
                  />
                ) : validProgramApplies.length > 0 ? (
                  <>
                    <div className="space-y-4 xl:hidden">
                      {validProgramApplies.map((apply) => (
                        <article key={apply.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
                          <dl className="space-y-3 text-base">
                            <div>
                              <dt className="font-semibold text-gray-600">신청자</dt>
                              <dd className="mt-1 font-bold text-gray-900">{apply.proposer}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-gray-600">사용자 ID</dt>
                              <dd className="mt-1 break-all text-gray-800">{apply.userId}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-gray-600">신청일</dt>
                              <dd className="mt-1 text-gray-800">{new Date(apply.createdAt).toLocaleDateString('ko-KR')}</dd>
                            </div>
                          </dl>
                          <button
                            type="button"
                            onClick={() => handleOpenApplyDetail(apply)}
                            className="mt-4 min-h-12 w-full rounded-lg bg-blue-700 px-4 py-3 text-base font-bold text-white hover:bg-blue-800"
                          >
                            상세보기
                          </button>
                        </article>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto rounded-xl border border-gray-200 xl:block">
                      <table className="min-w-[900px] divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-5 py-4 text-left text-base font-bold text-gray-700">신청자</th>
                            <th className="px-5 py-4 text-left text-base font-bold text-gray-700">사용자 ID</th>
                            <th className="px-5 py-4 text-left text-base font-bold text-gray-700">신청일</th>
                            <th className="px-5 py-4 text-left text-base font-bold text-gray-700">폼 응답</th>
                            <th className="px-5 py-4 text-left text-base font-bold text-gray-700">작업</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {validProgramApplies.map((apply) => (
                            <tr key={apply.id} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap px-5 py-4 text-base font-semibold text-gray-900">{apply.proposer}</td>
                              <td className="whitespace-nowrap px-5 py-4 text-base text-gray-600">{apply.userId}</td>
                              <td className="whitespace-nowrap px-5 py-4 text-base text-gray-600">{new Date(apply.createdAt).toLocaleDateString('ko-KR')}</td>
                              <td className="whitespace-nowrap px-5 py-4 text-base text-gray-600">
                                {apply.formResponses && Object.keys(apply.formResponses).length > 0
                                  ? `${Object.keys(apply.formResponses).length}개 응답`
                                  : '응답 없음'}
                              </td>
                              <td className="whitespace-nowrap px-5 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleOpenApplyDetail(apply)}
                                  className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 text-base font-bold text-white hover:bg-blue-800"
                                >
                                  상세보기
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <AsyncState
                    status="empty"
                    title="신청자가 없습니다"
                    description="이 프로그램에 접수된 신청이 아직 없습니다."
                  />
                )}
              </div>
            ) : programs.length === 0 ? (
              <AsyncState
                status="empty"
                title="등록된 프로그램이 없습니다"
                description="위의 ‘새 프로그램’ 버튼을 눌러 첫 프로그램을 등록할 수 있습니다."
              />
            ) : (
              // 프로그램 목록
              <div className="min-w-0">
                {programApplyCountsIsError && (
                  <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-base text-amber-900 sm:flex-row sm:items-center sm:justify-between" role="alert">
                    <p>신청자 수를 불러오지 못했습니다. 프로그램 관리 기능은 계속 사용할 수 있습니다.</p>
                    <button
                      type="button"
                      onClick={() => refetchProgramApplyCounts()}
                      disabled={programApplyCountsFetching}
                      className="min-h-11 rounded-lg border border-amber-400 px-4 font-bold hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {programApplyCountsFetching ? '다시 불러오는 중…' : '신청자 수 다시 불러오기'}
                    </button>
                  </div>
                )}

                <div className="space-y-4 2xl:hidden">
                  {programs.map((program) => {
                    const countLabel = getProgramApplyCountLabel({
                      count: programApplyCounts?.[program.id],
                      isError: programApplyCountsIsError,
                      isFetching: programApplyCountsFetching,
                      maxParticipants: program.maxParticipants,
                    });
                    return (
                      <article key={program.id} className="rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h4 className="min-w-0 flex-1 break-words text-lg font-bold text-gray-900">{program.title}</h4>
                          <span className={`rounded-full px-3 py-1 text-sm font-bold ${getProgramStatusInfo(program.status).className}`}>
                            {getProgramStatusInfo(program.status).text}
                          </span>
                        </div>
                        <div className="mt-3">{getCategoryBadge(program.category)}</div>
                        <dl className="mt-4 grid gap-3 text-base sm:grid-cols-2">
                          <div>
                            <dt className="font-semibold text-gray-600">신청기간</dt>
                            <dd className="mt-1 text-gray-900">{formatKoreanDateRange(program.applyStartDate, program.applyEndDate)}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-gray-600">모집 / 신청</dt>
                            <dd className="mt-1 text-gray-900">
                              {program.maxParticipants}명 / <span className="font-bold text-green-700">{countLabel.count}</span>
                              {countLabel.percentage && <span className="ml-1 text-gray-500">({countLabel.percentage})</span>}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => setSelectedProgramId(program.id)} className="min-h-12 rounded-lg bg-blue-700 px-4 py-3 text-base font-bold text-white hover:bg-blue-800">신청자 보기</button>
                          <button
                            type="button"
                            onClick={() => handleOpenFormBuilder(program)}
                            disabled={openingProgramFormId !== null}
                            className="min-h-12 rounded-lg bg-purple-700 px-4 py-3 text-base font-bold text-white hover:bg-purple-800 disabled:cursor-wait disabled:bg-gray-500"
                          >
                            {openingProgramFormId === program.id ? '폼 불러오는 중…' : '신청 폼 관리'}
                          </button>
                          <button type="button" onClick={() => openProgramEdit(program.id)} className="min-h-12 rounded-lg border-2 border-green-700 px-4 py-3 text-base font-bold text-green-800 hover:bg-green-50">수정</button>
                          <button type="button" disabled={deletingProgram} onClick={() => confirmProgramDelete(program)} className="min-h-12 rounded-lg border-2 border-red-600 px-4 py-3 text-base font-bold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">{deletingProgram && deletingProgramId === program.id ? '삭제 중…' : '삭제'}</button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto rounded-xl border border-gray-200 2xl:block">
                  <table className="min-w-[1100px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['제목', '카테고리', '상태', '신청기간', '모집인원', '신청자 수', '신청 폼', '작업'].map((heading) => (
                          <th key={heading} className="px-4 py-4 text-left text-base font-bold text-gray-700">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {programs.map((program) => {
                        const countLabel = getProgramApplyCountLabel({
                          count: programApplyCounts?.[program.id],
                          isError: programApplyCountsIsError,
                          isFetching: programApplyCountsFetching,
                          maxParticipants: program.maxParticipants,
                        });
                        return (
                          <tr key={program.id} className="hover:bg-gray-50">
                            <td className="max-w-xs px-4 py-4 text-base font-semibold text-gray-900"><span className="line-clamp-2">{program.title}</span></td>
                            <td className="whitespace-nowrap px-4 py-4">{getCategoryBadge(program.category)}</td>
                            <td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-3 py-1 text-sm font-bold ${getProgramStatusInfo(program.status).className}`}>{getProgramStatusInfo(program.status).text}</span></td>
                            <td className="whitespace-nowrap px-4 py-4 text-base text-gray-600">{formatKoreanDateRange(program.applyStartDate, program.applyEndDate)}</td>
                            <td className="whitespace-nowrap px-4 py-4 text-base text-gray-600">{program.maxParticipants}명</td>
                            <td className="whitespace-nowrap px-4 py-4 text-base"><span className="font-bold text-green-700">{countLabel.count}</span>{countLabel.percentage && <span className="ml-1 text-gray-500">({countLabel.percentage})</span>}</td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <button
                                type="button"
                                onClick={() => handleOpenFormBuilder(program)}
                                disabled={openingProgramFormId !== null}
                                className="min-h-11 rounded-lg bg-purple-700 px-4 py-2 text-base font-bold text-white hover:bg-purple-800 disabled:cursor-wait disabled:bg-gray-500"
                              >
                                {openingProgramFormId === program.id ? '불러오는 중…' : '폼 관리'}
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedProgramId(program.id)} className="min-h-11 rounded-lg border border-blue-600 px-3 py-2 text-base font-bold text-blue-700 hover:bg-blue-50">신청자</button>
                                <button type="button" onClick={() => openProgramEdit(program.id)} className="min-h-11 rounded-lg border border-green-700 px-3 py-2 text-base font-bold text-green-800 hover:bg-green-50">수정</button>
                                <button type="button" disabled={deletingProgram} onClick={() => confirmProgramDelete(program)} className="min-h-11 rounded-lg border border-red-600 px-3 py-2 text-base font-bold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">{deletingProgram && deletingProgramId === program.id ? '삭제 중…' : '삭제'}</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 소개글 관리 */}
        {activeMenu === 'intro' && searchParams.get('item') === 'people' && (
          <OrganizationDirectoryEditor onBack={() => {
            const next = new URLSearchParams(searchParams);
            next.set('section', 'intro');
            next.delete('item');
            setSearchParams(next, { replace: true });
          }} />
        )}
        {activeMenu === 'intro' && searchParams.get('item') !== 'people' && (
          <div className="min-w-0 rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium">소개(정적 카테고리) 편집</h3>
              <span className="text-sm text-gray-500">
                저장 후 즉시 프론트 소개 페이지에 반영됩니다.
              </span>
            </div>

            {introContentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : (
              <table className="block w-full divide-y divide-gray-200 md:table md:min-w-full">
                <thead className="sr-only bg-gray-50 md:not-sr-only md:table-header-group">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">항목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">미리보기</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="block divide-y divide-gray-200 bg-white md:table-row-group">
                  {INTRO_CONTENT_ITEMS.map((item) => {
                    const content = introContents?.[item.key];
                    const rawContent = content?.content || '';
                    const hasCustomContent = hasMeaningfulHtmlContent(rawContent);
                    const previewText = hasCustomContent
                      ? getHtmlPreviewText(rawContent)
                      : '기본 템플릿 사용 중';

                    return (
                      <tr key={item.key} className="block py-3 md:table-row md:py-0">
                        <td className="block w-full px-0 py-2 text-sm font-medium text-gray-900 md:table-cell md:w-auto md:whitespace-nowrap md:px-6 md:py-4">
                          {item.label}
                        </td>
                        <td className="block w-full px-0 py-2 text-sm md:table-cell md:w-auto md:whitespace-nowrap md:px-6 md:py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            hasCustomContent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {hasCustomContent ? '커스텀 적용' : '기본값'}
                          </span>
                        </td>
                        <td className="block w-full max-w-none px-0 py-2 text-sm text-gray-500 md:table-cell md:max-w-xs md:px-6 md:py-4">
                          <div className="line-clamp-2">{previewText || '내용 없음'}</div>
                        </td>
                        <td className="block w-full px-0 py-2 text-sm md:table-cell md:w-auto md:whitespace-nowrap md:px-6 md:py-4">
                          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.key === 'intro-people') {
                                  const next = new URLSearchParams(searchParams);
                                  next.set('section', 'intro');
                                  next.set('item', 'people');
                                  setSearchParams(next, { replace: true });
                                  return;
                                }
                                handleOpenIntroEditor(item);
                              }}
                              className="inline-flex min-h-12 items-center justify-center rounded-lg px-3 font-semibold text-green-700 hover:bg-green-50 hover:text-green-900"
                            >
                              {item.key === 'intro-people' ? '조직도 관리' : '수정'}
                            </button>
                            <Link
                              to={item.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-12 items-center justify-center rounded-lg px-3 font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                            >
                              보기
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 홈 배너 관리 */}
        {activeMenu === 'homeBanner' && (
          homeBannerLoading ? (
            <AsyncState status="loading" title="홈 배너를 불러오고 있습니다" />
          ) : homeBannerError ? (
            <AsyncState
              status="error"
              title="홈 배너를 불러오지 못했습니다"
              description="기존 운영 값을 보호하기 위해 편집을 중단했습니다. 다시 불러온 뒤 수정해 주세요."
              onRetry={() => refetchHomeBanner()}
              isRetrying={homeBannerFetching}
            />
          ) : (
            <div className="space-y-forest-6">
              <Surface aria-labelledby="home-banner-editor-title">
                <div className="flex flex-col gap-forest-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 id="home-banner-editor-title" className="text-forest-heading-3 font-bold text-forest-text-primary">홈 화면 메인 배너 편집</h3>
                    <p className="mt-forest-2 text-forest-supporting text-forest-text-muted">
                      문구, 버튼, 배경 이미지를 수정하면 아래 실제 공개 화면 미리보기에 반영됩니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-forest-2">
                    <Button variant="secondary" onClick={handleApplyDefaultHomeBanner}>현재 배너 초기화</Button>
                    <Button variant="secondary" onClick={handleAddHomeBanner}>배너 추가</Button>
                    <Button variant="danger" onClick={handleRemoveCurrentHomeBanner}>현재 배너 삭제</Button>
                    <Button aria-label="저장" onClick={handleSaveHomeBanner} isPending={isSavingHomeBanner}
                      disabled={homeBannerLoading} pendingLabel="저장 중…">저장</Button>
                  </div>
                </div>

                <div className="mt-forest-6 flex flex-wrap gap-forest-2">
                  {homeBanners.map((_, index) => (
                    <Button
                      key={`home-banner-tab-${index}`}
                      variant={selectedHomeBannerIndex === index ? 'primary' : 'secondary'}
                      aria-pressed={selectedHomeBannerIndex === index}
                      onClick={() => setSelectedHomeBannerIndex(index)}
                    >
                      배너 {index + 1}
                    </Button>
                  ))}
                </div>

                <div className="mt-forest-6 space-y-forest-6">
                  <div className="grid gap-forest-4 md:grid-cols-2">
                    {homeBannerTextFields.map(([id, label, field]) => (
                      <FormField key={field} id={id} label={label}
                        error={homeBannerFieldErrors[selectedHomeBannerIndex]?.[field]} required>
                        {(controlProps) => (
                          <input {...controlProps} aria-label={label} type="text" value={homeBannerForm[field]}
                            onChange={(event) => handleHomeBannerFieldChange(field, event.target.value)} />
                        )}
                      </FormField>
                    ))}
                  </div>

                  <FormField id="home-banner-description" label="설명 문구"
                    error={homeBannerFieldErrors[selectedHomeBannerIndex]?.description} required>
                    {(controlProps) => (
                      <textarea {...controlProps} aria-label="설명 문구" rows={3} value={homeBannerForm.description}
                        onChange={(event) => handleHomeBannerFieldChange('description', event.target.value)} />
                    )}
                  </FormField>

                  <fieldset aria-describedby="home-banner-action-priority">
                    <legend className="text-forest-label font-bold text-forest-text-primary">공개 화면 버튼</legend>
                    <p id="home-banner-action-priority" className="mt-forest-2 text-forest-supporting text-forest-text-muted">
                      버튼 A와 B 중 프로그램 페이지로 연결되는 버튼은 공개 화면에서 먼저 표시됩니다.
                    </p>
                    <div className="mt-forest-4 grid gap-forest-4 md:grid-cols-2">
                      {homeBannerActionFields.map(([id, label, field]) => (
                        <FormField key={field} id={id} label={label}
                          error={homeBannerFieldErrors[selectedHomeBannerIndex]?.[field]} required>
                          {(controlProps) => (
                            <input {...controlProps} aria-label={label} type="text" value={homeBannerForm[field]}
                              onChange={(event) => handleHomeBannerFieldChange(field, event.target.value)} />
                          )}
                        </FormField>
                      ))}
                    </div>
                  </fieldset>

                  <div className="space-y-forest-3">
                    <FormField id="home-banner-background-image" label="배경 이미지"
                      error={homeBannerFieldErrors[selectedHomeBannerIndex]?.backgroundImageUrl} required>
                      {(controlProps) => (
                        <input {...controlProps} aria-label="배경 이미지" type="text" value={homeBannerForm.backgroundImageUrl}
                          onChange={(event) => handleHomeBannerFieldChange('backgroundImageUrl', event.target.value)} />
                      )}
                    </FormField>
                    <label className="inline-flex min-h-forest-control cursor-pointer items-center rounded-forest-control border border-forest-border-strong bg-forest-surface-raised px-forest-4 font-bold text-forest-strong focus-within:outline focus-within:outline-forest focus-within:outline-offset-2 focus-within:outline-forest-focus">
                      이미지 업로드
                      <input type="file" accept="image/*" className="sr-only"
                        onChange={(event) => handleHomeBannerImageUpload('backgroundImageUrl', event)} />
                    </label>
                    {uploadingBannerField === 'backgroundImageUrl' && (
                      <StatusBadge tone="info">배경 이미지 업로드 중…</StatusBadge>
                    )}
                  </div>
                </div>
              </Surface>

              <Surface aria-labelledby="home-banner-preview-title">
                <h4 id="home-banner-preview-title" className="mb-forest-4 text-forest-heading-3 font-bold text-forest-text-primary">실제 공개 화면 미리보기</h4>
                <HomeHero banners={[homeBannerForm]} isPreview headingLevel={2} />
              </Surface>
            </div>
          )
        )}

        {/* 메일 발송 폼 */}
        {activeMenu === 'mail' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">준비중입니다</h2>
              <p className="text-gray-600 mb-6">
                메일 발송 기능은 현재 개발 중입니다.<br />
                빠른 시일 내에 서비스할 예정입니다.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                개발 진행중
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'users' && (
          <UserManagement />
        )}

        {/* 후원신청 관리 */}
        {activeMenu === 'donations' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">후원신청 목록</h3>
              <div className="text-sm text-gray-500">
                총 {totalElements}건의 후원신청
              </div>
            </div>

            {supportersLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : supporters.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">성함</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supporters.map((supporter) => (
                      <tr 
                        key={supporter.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedSupporter(supporter);
                          setShowSupporterModal(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supporter.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supporter.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            supporter.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {supporter.isCompleted ? '완료' : '대기'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(supporter.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('이 후원신청을 완료 처리하시겠습니까?')) {
                                completeSupport(supporter.id);
                              }
                            }}
                            disabled={supporter.isCompleted}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                              supporter.isCompleted 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            완료
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      페이지 {supportersPage + 1} / {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSupportersPage(Math.max(0, supportersPage - 1))}
                        disabled={supportersPage === 0}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          supportersPage === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        이전
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(0, Math.min(totalPages - 4, supportersPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setSupportersPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              pageNum === supportersPage
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setSupportersPage(Math.min(totalPages - 1, supportersPage + 1))}
                        disabled={supportersPage === totalPages - 1}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          supportersPage === totalPages - 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                후원신청이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 소개글 편집 모달 */}
        {showIntroModal && selectedIntroItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium">{selectedIntroItem.label} 소개글 수정</h3>
                <button
                  onClick={handleCloseIntroEditor}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  편집기에서 텍스트와 이미지를 쉽게 꾸밀 수 있습니다. 비어 있으면 기존 프론트 기본 콘텐츠가 노출됩니다.
                </p>
                <div
                  className="min-h-[500px]"
                  onDrop={handleIntroEditorDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <ReactQuill
                    ref={introQuillRef}
                    theme="snow"
                    value={introDraft}
                    onChange={setIntroDraft}
                    modules={introEditorModules}
                    className="h-[450px]"
                  />
                </div>
                <div className="h-24" />
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={handleCloseIntroEditor}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveIntroContent}
                  disabled={isSavingIntroContent}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
                >
                  {isSavingIntroContent ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 후원신청 상세 모달 */}
        {showSupporterModal && selectedSupporter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium">후원신청 상세정보</h3>
                <button
                  onClick={() => {
                    setShowSupporterModal(false);
                    setSelectedSupporter(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성함</label>
                    <p className="text-gray-900">{selectedSupporter.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <p className="text-gray-900">{selectedSupporter.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">후원 유형</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSupporter.supportType === '일반회원' ? 'bg-blue-100 text-blue-800' :
                      selectedSupporter.supportType === '가족회원' ? 'bg-green-100 text-green-800' :
                      selectedSupporter.supportType === '기업회원' ? 'bg-purple-100 text-purple-800' :
                      selectedSupporter.supportType === '평생회원' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSupporter.supportType}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">출금일</label>
                    <p className="text-gray-900">{selectedSupporter.withdrawalDate}일</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">계좌 정보</label>
                    <p className="text-gray-900">{selectedSupporter.account}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주민등록번호</label>
                    <p className="text-gray-900">{selectedSupporter.nationalIdIdentificationNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기부금영수증</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSupporter.isDonation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSupporter.isDonation ? '발급' : '미발급'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">신청일</label>
                    <p className="text-gray-900">{new Date(selectedSupporter.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">처리상태</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSupporter.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedSupporter.isCompleted ? '완료' : '대기'}
                    </span>
                  </div>
                  {selectedSupporter.address && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <p className="text-gray-900">{selectedSupporter.address}</p>
                    </div>
                  )}
                  {selectedSupporter.email && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <p className="text-gray-900">{selectedSupporter.email}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                {!selectedSupporter.isCompleted && (
                  <button
                    onClick={() => {
                      if (window.confirm('이 후원신청을 완료 처리하시겠습니까?')) {
                        completeSupport(selectedSupporter.id);
                        setShowSupporterModal(false);
                        setSelectedSupporter(null);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    완료 처리
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSupporterModal(false);
                    setSelectedSupporter(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 신청 폼 빌더 모달 */}
        {showFormBuilder && selectedProgramForForm && (
          <ProgramFormBuilder
            programId={selectedProgramForForm.id}
            existingForm={existingForm}
            onClose={handleCloseFormBuilder}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['programForm', selectedProgramForForm.id] });
            }}
          />
        )}

        {/* 신청 상세 모달 */}
        {showApplyDetailModal && selectedApply && (
          <ProgramApplyDetailModal
            apply={selectedApply}
            programId={selectedProgramId}
            onClose={handleCloseApplyDetail}
          />
        )}
      </div>
    </div>
  );
}
