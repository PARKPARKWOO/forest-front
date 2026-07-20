import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncState from '../../AsyncState';
import useUnsavedChanges from '../../../hooks/useUnsavedChanges';
import { ORGANIZATION_WRITES_ENABLED } from '../../../config/organizationDeployment';
import { sanitizeRichText } from '../../../utils/editorContent';
import {
  getManagedOrganizationDirectory,
  updateManagedOrganizationDirectory,
} from '../../../services/organizationDirectoryService';
import { getStaticContent } from '../../../services/staticContentService';
import {
  hasMeaningfulLegacyPeopleHtml,
  resolveSelectedGroupId,
} from '../../../utils/organizationDirectory';
import {
  canDeletePerson,
  canDeleteGroup,
  createUuid,
  getParentCandidates,
  moveGroup,
  moveMembership,
  validateOrganizationDraft,
} from '../../../utils/organizationDirectoryDraft';
import OrganizationDirectoryPreview from './OrganizationDirectoryPreview';
import OrganizationGroupForm from './OrganizationGroupForm';
import OrganizationGroupTree from './OrganizationGroupTree';
import OrganizationMembershipEditor from './OrganizationMembershipEditor';
import OrganizationPeopleDirectory from './OrganizationPeopleDirectory';
import OrganizationSaveConfirmation from './OrganizationSaveConfirmation';

const cloneEditableSnapshot = (snapshot) => ({
  schemaVersion: snapshot.schemaVersion,
  groups: snapshot.groups.map((group) => ({ ...group })),
  people: snapshot.people.map((person) => ({ ...person })),
  memberships: snapshot.memberships.map((membership) => ({ ...membership })),
});

const stableSerialize = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const validateOrganizationEditorDraft = (draft, pendingCustomMembershipIds) => {
  const canonicalErrors = validateOrganizationDraft(draft);
  const canonicalPaths = new Set(canonicalErrors.map(({ path }) => path));
  const transientErrors = draft.memberships.flatMap((membership, index) => {
    const path = `memberships.${index}.affiliationOverride`;
    return pendingCustomMembershipIds.has(membership.id) && !canonicalPaths.has(path)
      ? [{ path, message: '다른 소속을 입력해 주세요.' }]
      : [];
  });
  return [...canonicalErrors, ...transientErrors];
};

const nextSiblingOrder = (groups, parentGroupId) => {
  const siblingOrders = groups
    .filter((group) => group.parentGroupId === parentGroupId)
    .map(({ displayOrder }) => displayOrder);
  return siblingOrders.length === 0 ? 10 : Math.max(...siblingOrders) + 10;
};

const nextMembershipOrder = (memberships, groupId) => {
  const groupOrders = memberships
    .filter((membership) => membership.groupId === groupId)
    .map(({ displayOrder }) => displayOrder);
  return groupOrders.length === 0 ? 10 : Math.max(...groupOrders) + 10;
};

export default function OrganizationDirectoryEditor({ onBack }) {
  const queryClient = useQueryClient();
  const [acceptedServerSnapshot, setAcceptedServerSnapshot] = useState(null);
  const acceptedServerSnapshotRef = useRef(null);
  acceptedServerSnapshotRef.current = acceptedServerSnapshot;
  const organizationQuery = useQuery({
    queryKey: ['organizationDirectory', 'manage'],
    queryFn: ({ signal }) => getManagedOrganizationDirectory({
      signal: acceptedServerSnapshotRef.current ? signal : undefined,
    }),
    retry: false,
  });
  const [draft, setDraft] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [panel, setPanel] = useState('groups');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [revisionConflict, setRevisionConflict] = useState(null);
  const [pendingCutover, setPendingCutover] = useState(null);
  const [legacyConflictRefresh, setLegacyConflictRefresh] = useState(null);
  const [pendingCustomMembershipIds, setPendingCustomMembershipIds] = useState(new Set());
  const legacyDecisionRequired = Boolean(
    acceptedServerSnapshot
    && (!acceptedServerSnapshot.configured || acceptedServerSnapshot.legacyContentDrift),
  );
  const legacyDecisionGeneration = acceptedServerSnapshot
    ? [
      acceptedServerSnapshot.revision,
      acceptedServerSnapshot.legacyContentFingerprint,
      acceptedServerSnapshot.configured,
      acceptedServerSnapshot.legacyContentDrift,
    ]
    : ['unaccepted'];
  const legacyQuery = useQuery({
    queryKey: [
      'staticContent',
      'intro-people',
      'organization-editor',
      ...legacyDecisionGeneration,
    ],
    queryFn: () => getStaticContent('intro-people'),
    enabled: legacyDecisionRequired,
    retry: false,
  });
  const saveMutation = useMutation({
    mutationFn: updateManagedOrganizationDirectory,
    retry: false,
  });
  const editorRef = useRef(null);
  const saveFeedbackRef = useRef(null);
  const saveRequestInFlightRef = useRef(false);
  const feedbackSequenceRef = useRef(0);
  const draftRef = useRef(null);
  const authoritativeManageOperationRef = useRef(0);
  const pendingCustomMembershipIdsRef = useRef(new Set());
  draftRef.current = draft;
  pendingCustomMembershipIdsRef.current = pendingCustomMembershipIds;

  const acceptServerSnapshot = (snapshot) => {
    const nextDraft = cloneEditableSnapshot(snapshot);
    setAcceptedServerSnapshot(snapshot);
    setDraft(nextDraft);
    setSelectedGroupId((current) => resolveSelectedGroupId(nextDraft.groups, current));
    setRevisionConflict(null);
    setPendingCutover(null);
    setPendingCustomMembershipIds(new Set());
  };

  const showSaveFeedback = (type, message, { focus = false } = {}) => {
    feedbackSequenceRef.current += 1;
    setSaveFeedback({ type, message, focus, sequence: feedbackSequenceRef.current });
  };

  useEffect(() => {
    if (!saveFeedback?.focus) return undefined;
    const focusTimer = window.setTimeout(() => saveFeedbackRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [saveFeedback]);

  useEffect(() => {
    if (!organizationQuery.data || acceptedServerSnapshot) return;
    acceptServerSnapshot(organizationQuery.data);
    // The first successful load is the only automatic draft initialization.
    // Later query responses are compared below and require an explicit refresh.
  }, [acceptedServerSnapshot, organizationQuery.data]);

  const dirty = useMemo(() => (
    Boolean(draft && acceptedServerSnapshot)
    && stableSerialize(draft) !== stableSerialize(cloneEditableSnapshot(acceptedServerSnapshot))
  ), [acceptedServerSnapshot, draft]);
  useUnsavedChanges(dirty);

  const latestServerSnapshot = organizationQuery.data;
  const revisionChanged = Boolean(
    latestServerSnapshot
    && acceptedServerSnapshot
    && latestServerSnapshot.revision > acceptedServerSnapshot.revision,
  );
  const cutoverStateChanged = Boolean(
    latestServerSnapshot
    && acceptedServerSnapshot
    && latestServerSnapshot.revision === acceptedServerSnapshot.revision
    && (
      latestServerSnapshot.legacyContentFingerprint !== acceptedServerSnapshot.legacyContentFingerprint
      || latestServerSnapshot.legacyContentDrift !== acceptedServerSnapshot.legacyContentDrift
    ),
  );
  const sanitizedLegacyHtml = useMemo(
    () => sanitizeRichText(legacyQuery.data?.content || ''),
    [legacyQuery.data],
  );
  const effectiveLegacyHtml = pendingCutover?.sanitizedLegacyHtml ?? sanitizedLegacyHtml;
  const legacyQueryReady = Boolean(
    pendingCutover
    || (legacyQuery.isSuccess && legacyQuery.fetchStatus === 'idle'),
  );
  const legacySaveBlocked = (
    (legacyDecisionRequired && !legacyQueryReady)
    || Boolean(legacyConflictRefresh)
  );
  const legacyConfirmationRequired = Boolean(
    pendingCutover
    || (
      acceptedServerSnapshot
      && (
        acceptedServerSnapshot.legacyContentDrift
        || (!acceptedServerSnapshot.configured && hasMeaningfulLegacyPeopleHtml(effectiveLegacyHtml))
      )
    ),
  );

  if (!draft && !organizationQuery.isError) {
    return <AsyncState status="loading" title="조직도 관리 정보를 불러오고 있습니다" />;
  }
  if (!draft) {
    return (
      <AsyncState
        status="error"
        title="조직도 관리 정보를 불러오지 못했습니다"
        description="관리 권한과 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
        onRetry={organizationQuery.refetch}
        isRetrying={organizationQuery.isFetching}
      />
    );
  }

  const selectedGroup = draft.groups.find(({ id }) => id === selectedGroupId) ?? null;
  const selectedIndex = draft.groups.findIndex(({ id }) => id === selectedGroupId);
  const validationErrors = validateOrganizationEditorDraft(draft, pendingCustomMembershipIds);
  const selectedErrors = selectedIndex < 0
    ? []
    : validationErrors.filter(({ path }) => path.startsWith(`groups.${selectedIndex}.`));
  const parentOptions = selectedGroup ? getParentCandidates(draft.groups, selectedGroup.id) : [];
  const selectedMemberships = selectedGroup
    ? draft.memberships.filter(({ groupId }) => groupId === selectedGroup.id)
    : [];
  const selectedMembershipIds = new Set(selectedMemberships.map(({ id }) => id));
  const membershipErrors = validationErrors.flatMap((error) => {
    const match = error.path.match(/^memberships\.(\d+)\./);
    const membershipId = match ? draft.memberships[Number(match[1])]?.id : null;
    return membershipId && selectedMembershipIds.has(membershipId) ? [{ ...error, membershipId }] : [];
  });
  const peopleErrors = validationErrors.flatMap((error) => {
    const match = error.path.match(/^people\.(\d+)\./);
    const personId = match ? draft.people[Number(match[1])]?.id : null;
    return personId ? [{ ...error, personId }] : [];
  });
  const groupNamesById = new Map(draft.groups.map((group) => [group.id, group.name]));
  const peopleWithLinks = draft.people.map((person) => ({
    ...person,
    linkedGroupNames: [...new Set(draft.memberships
      .filter(({ personId }) => personId === person.id)
      .map(({ groupId }) => groupNamesById.get(groupId))
      .filter(Boolean))],
  }));
  const membershipsWithGroupNames = draft.memberships.map((membership) => ({
    ...membership,
    groupName: groupNamesById.get(membership.groupId) ?? '',
  }));
  const revisionConflictActive = Boolean(revisionConflict || (dirty && revisionChanged));

  const focusValidationPath = (path) => {
    const [collection, indexText, field] = path.split('.');
    const index = Number(indexText);
    if (collection === 'groups' && draft.groups[index]) {
      setPanel('groups');
      setSelectedGroupId(draft.groups[index].id);
    } else if (collection === 'people' && draft.people[index]) {
      setPanel('people');
    } else if (collection === 'memberships' && draft.memberships[index]) {
      setPanel('groups');
      setSelectedGroupId(draft.memberships[index].groupId);
    }

    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const root = editorRef.current;
      let target = null;
      if (collection === 'groups' && draft.groups[index]) {
        const form = root?.querySelector('[aria-labelledby="organization-group-form-title"]');
        if (field === 'name') target = form?.querySelector('input[type="text"]');
        if (field === 'description') target = form?.querySelector('textarea');
        if (field === 'parentGroupId') target = form?.querySelector('select');
      } else if (collection === 'people' && draft.people[index]) {
        const personId = window.CSS.escape(draft.people[index].id);
        if (field === 'name') target = root?.querySelector(`#organization-person-name-${personId}`);
        if (field === 'affiliation') target = root?.querySelector(`#organization-person-affiliation-${personId}`);
      } else if (collection === 'memberships' && draft.memberships[index]) {
        const membershipId = window.CSS.escape(draft.memberships[index].id);
        if (field === 'roleLabel') target = root?.querySelector(`#organization-membership-role-${membershipId}`);
        if (field === 'affiliationOverride') {
          target = root?.querySelector(`#organization-membership-custom-affiliation-${membershipId}`);
        }
      }
      if (target) {
        target.setAttribute('data-field-path', path);
        const escapedPath = window.CSS.escape(path);
        root.querySelector(`[data-field-path="${escapedPath}"]`)?.focus();
      } else {
        saveFeedbackRef.current?.focus();
      }
    }));
  };

  const beginAuthoritativeManageOperation = () => {
    authoritativeManageOperationRef.current += 1;
    return authoritativeManageOperationRef.current;
  };

  const protectAuthoritativeManageSnapshot = async (
    snapshot,
    operation,
    { writeCache = true } = {},
  ) => {
    await queryClient.cancelQueries({
      queryKey: ['organizationDirectory', 'manage'],
      exact: true,
    });
    if (operation !== authoritativeManageOperationRef.current) return false;
    const acceptedRevision = acceptedServerSnapshotRef.current?.revision ?? -1;
    const cachedRevision = queryClient
      .getQueryData(['organizationDirectory', 'manage'])?.revision ?? -1;
    if (snapshot.revision < Math.max(acceptedRevision, cachedRevision)) return false;
    if (writeCache) {
      queryClient.setQueryData(['organizationDirectory', 'manage'], snapshot);
    }
    return true;
  };

  const fetchLatestForRevisionConflict = async () => {
    const operation = beginAuthoritativeManageOperation();
    setRevisionConflict({ status: 'loading', snapshot: null });
    try {
      const latest = await getManagedOrganizationDirectory();
      const accepted = await protectAuthoritativeManageSnapshot(latest, operation);
      if (!accepted) {
        if (operation === authoritativeManageOperationRef.current) {
          setRevisionConflict({ status: 'error', snapshot: null });
        }
        return;
      }
      setRevisionConflict({ status: 'ready', snapshot: latest });
    } catch {
      if (operation !== authoritativeManageOperationRef.current) return;
      setRevisionConflict({ status: 'error', snapshot: null });
      showSaveFeedback('error', '최신 조직도 내용을 불러오지 못했습니다. 다시 확인해 주세요.', { focus: true });
    }
  };

  const refreshLegacyConflictState = async () => {
    const operation = beginAuthoritativeManageOperation();
    setLegacyConflictRefresh({ status: 'loading' });
    const [latestResult, legacyResult] = await Promise.allSettled([
      getManagedOrganizationDirectory(),
      getStaticContent('intro-people'),
    ]);
    if (operation !== authoritativeManageOperationRef.current) return;
    if (
      latestResult.status === 'fulfilled'
      && latestResult.value.revision !== acceptedServerSnapshot.revision
    ) {
      const latest = latestResult.value;
      const accepted = await protectAuthoritativeManageSnapshot(latest, operation);
      if (!accepted) {
        if (operation === authoritativeManageOperationRef.current) {
          setLegacyConflictRefresh({ status: 'error' });
        }
        return;
      }
      setRevisionConflict({ status: 'ready', snapshot: latest });
      setPendingCutover(null);
      setLegacyConflictRefresh({ status: 'error' });
      showSaveFeedback('error', '저장 충돌이 발생했습니다. 최신 내용을 확인해 주세요.');
      return;
    }
    if (latestResult.status === 'rejected' || legacyResult.status === 'rejected') {
      setPendingCutover(null);
      setLegacyConflictRefresh({ status: 'error' });
      showSaveFeedback('error', '최신 기존 내용을 확인하지 못했습니다. 초안은 유지됩니다.', { focus: true });
      return;
    }
    const latest = latestResult.value;
    const accepted = await protectAuthoritativeManageSnapshot(latest, operation, { writeCache: false });
    if (!accepted) {
      if (operation === authoritativeManageOperationRef.current) {
        setPendingCutover(null);
        setLegacyConflictRefresh({ status: 'error' });
      }
      return;
    }
    const refreshedLegacyHtml = sanitizeRichText(legacyResult.value?.content || '');
    setPendingCutover({
      legacyContentFingerprint: latest.legacyContentFingerprint,
      sanitizedLegacyHtml: refreshedLegacyHtml,
    });
    setLegacyConflictRefresh(null);
    queryClient.setQueryData(['staticContent', 'intro-people'], legacyResult.value);
    showSaveFeedback('error', '기존 함께하는이들 내용이 변경되었습니다. 다시 확인해 주세요.');
  };

  const handleSaveError = async (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code ?? error?.code;
    if (code === 'ORGANIZATION_REVISION_CONFLICT') {
      showSaveFeedback('error', '저장 충돌이 발생했습니다. 최신 내용을 확인해 주세요.');
      await fetchLatestForRevisionConflict();
      return;
    }
    if (code === 'ORGANIZATION_LEGACY_CONTENT_CONFLICT') {
      showSaveFeedback('error', '기존 함께하는이들 내용이 변경되었습니다. 다시 확인해 주세요.');
      await refreshLegacyConflictState();
      return;
    }
    if (status === 400) {
      showSaveFeedback('error', '입력 내용을 저장할 수 없습니다. 표시된 항목을 확인해 주세요.', { focus: true });
      return;
    }
    if (status === 403) {
      showSaveFeedback('error', '로그인 상태와 조직도 관리 권한을 확인해 주세요. 초안은 유지됩니다.', { focus: true });
      return;
    }
    showSaveFeedback('error', '조직도를 저장하지 못했습니다. 초안은 유지됩니다.', { focus: true });
  };

  const performSave = async () => {
    if (saveRequestInFlightRef.current || !dirty || revisionConflictActive || legacySaveBlocked) return;
    const currentDraft = draftRef.current;
    const defensiveErrors = validateOrganizationEditorDraft(
      currentDraft,
      pendingCustomMembershipIdsRef.current,
    );
    if (defensiveErrors.length > 0) {
      showSaveFeedback('error', '저장할 수 없는 항목이 있습니다. 첫 번째 오류를 확인해 주세요.');
      focusValidationPath(defensiveErrors[0].path);
      return;
    }
    saveRequestInFlightRef.current = true;
    const operation = beginAuthoritativeManageOperation();
    const request = {
      schemaVersion: currentDraft.schemaVersion,
      revision: acceptedServerSnapshot.revision,
      legacyContentFingerprint: pendingCutover?.legacyContentFingerprint
        ?? acceptedServerSnapshot.legacyContentFingerprint,
      groups: currentDraft.groups,
      people: currentDraft.people,
      memberships: currentDraft.memberships,
    };
    const submittedDraft = currentDraft;
    try {
      await queryClient.cancelQueries({
        queryKey: ['organizationDirectory', 'manage'],
        exact: true,
      });
      if (operation !== authoritativeManageOperationRef.current) return;
      const saved = await saveMutation.mutateAsync(request);
      const accepted = await protectAuthoritativeManageSnapshot(saved, operation);
      if (!accepted) {
        showSaveFeedback('error', '더 최신인 서버 응답이 있어 저장 결과를 적용하지 않았습니다.', { focus: true });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['organizationDirectory', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['staticContent', 'intro-people'] });
      const latestDraft = draftRef.current;
      const changedWhilePending = (
        latestDraft
        && stableSerialize(latestDraft) !== stableSerialize(submittedDraft)
      );
      setAcceptedServerSnapshot(saved);
      if (!changedWhilePending) {
        const nextDraft = cloneEditableSnapshot(saved);
        setDraft(nextDraft);
        setSelectedGroupId((current) => resolveSelectedGroupId(nextDraft.groups, current));
      }
      setRevisionConflict(null);
      setPendingCutover(null);
      setLegacyConflictRefresh(null);
      showSaveFeedback('success', `조직도를 저장했습니다. revision ${saved.revision}`);
    } catch (error) {
      await handleSaveError(error);
    } finally {
      saveRequestInFlightRef.current = false;
    }
  };

  const requestSave = () => {
    if (saveRequestInFlightRef.current || saveMutation.isPending) return;
    const currentErrors = validationErrors;
    if (currentErrors.length > 0) {
      showSaveFeedback('error', '저장할 수 없는 항목이 있습니다. 첫 번째 오류를 확인해 주세요.');
      focusValidationPath(currentErrors[0].path);
      return;
    }
    if (legacyConfirmationRequired) {
      setConfirmationOpen(true);
      return;
    }
    performSave();
  };

  const saveDisabled = (
    !ORGANIZATION_WRITES_ENABLED
    || !dirty
    || saveMutation.isPending
    || revisionConflictActive
    || legacySaveBlocked
  );
  const saveLabel = !ORGANIZATION_WRITES_ENABLED
    ? '미리보기에서는 저장할 수 없습니다'
    : saveMutation.isPending ? '저장 중…' : '변경사항 저장';

  const addGroup = (parentGroupId) => {
    const newGroup = {
      id: createUuid(),
      name: '새 조직',
      description: '',
      parentGroupId,
      displayOrder: nextSiblingOrder(draft.groups, parentGroupId),
      enabled: true,
    };
    setDraft((current) => ({ ...current, groups: [...current.groups, newGroup] }));
    setSelectedGroupId(newGroup.id);
  };

  const changeSelectedGroup = (field, value) => {
    setDraft((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id !== selectedGroupId) return group;
        if (field === 'parentGroupId' && group.parentGroupId !== value) {
          return {
            ...group,
            parentGroupId: value,
            displayOrder: nextSiblingOrder(current.groups.filter(({ id }) => id !== group.id), value),
          };
        }
        return { ...group, [field]: value };
      }),
    }));
  };

  const deleteGroup = (groupId) => {
    const guard = canDeleteGroup(draft, groupId);
    if (!guard.allowed) {
      const reasons = [];
      if (guard.childGroupIds.length) reasons.push(`하위 조직 ${guard.childGroupIds.length}개`);
      if (guard.membershipIds.length) reasons.push(`구성원 연결 ${guard.membershipIds.length}개`);
      window.alert(`${reasons.join('과 ')}를 먼저 이동하거나 제거해 주세요.`);
      return;
    }
    const group = draft.groups.find(({ id }) => id === groupId);
    if (!group || !window.confirm(`'${group.name}' 그룹을 삭제하시겠습니까?`)) return;
    const groups = draft.groups.filter(({ id }) => id !== groupId);
    setDraft({ ...draft, groups });
    setSelectedGroupId((selected) => (
      selected === groupId ? resolveSelectedGroupId(groups, null) : selected
    ));
  };

  const loadLatestServerSnapshot = async () => {
    const snapshot = revisionConflict?.snapshot ?? latestServerSnapshot;
    if (!snapshot) return;
    if (dirty && !window.confirm('저장하지 않은 변경사항을 버리고 최신 내용을 불러오시겠습니까?')) return;
    const operation = beginAuthoritativeManageOperation();
    const accepted = await protectAuthoritativeManageSnapshot(snapshot, operation);
    if (!accepted) {
      setRevisionConflict({ status: 'error', snapshot: null });
      showSaveFeedback('error', '최신 조직도 기준을 다시 확인해 주세요.', { focus: true });
      return;
    }
    acceptServerSnapshot(snapshot);
    setSaveFeedback(null);
  };

  const addPerson = ({ name, affiliation }) => {
    const person = { id: createUuid(), name, affiliation, enabled: true };
    setDraft((current) => ({ ...current, people: [...current.people, person] }));
    return person;
  };

  const changePerson = (personId, field, value) => {
    setDraft((current) => ({
      ...current,
      people: current.people.map((person) => (
        person.id === personId ? { ...person, [field]: value } : person
      )),
    }));
  };

  const deletePerson = (personId) => {
    const guard = canDeletePerson(draft, personId);
    if (!guard.allowed) {
      const linkedGroupNames = [...new Set(draft.memberships
        .filter(({ personId: linkedPersonId }) => linkedPersonId === personId)
        .map(({ groupId }) => groupNamesById.get(groupId))
        .filter(Boolean))];
      window.alert(`연결된 그룹을 먼저 제거해 주세요: ${linkedGroupNames.join(', ')}`);
      return;
    }
    const person = draft.people.find(({ id }) => id === personId);
    if (!person || !window.confirm(`'${person.name}' 인물을 삭제하시겠습니까?`)) return;
    setDraft((current) => ({
      ...current,
      people: current.people.filter(({ id }) => id !== personId),
    }));
  };

  const addExistingMembership = (personId) => {
    if (!selectedGroup || !personId) return;
    setDraft((current) => {
      if (!current.people.some(({ id }) => id === personId) || current.memberships.some((membership) => (
        membership.groupId === selectedGroup.id && membership.personId === personId
      ))) return current;
      return {
        ...current,
        memberships: [...current.memberships, {
          id: createUuid(),
          groupId: selectedGroup.id,
          personId,
          roleLabel: '',
          affiliationOverride: null,
          displayOrder: nextMembershipOrder(current.memberships, selectedGroup.id),
        }],
      };
    });
  };

  const createAndAddMembership = ({ name, affiliation }) => {
    if (!selectedGroup) return;
    setDraft((current) => {
      const person = { id: createUuid(), name, affiliation, enabled: true };
      return {
        ...current,
        people: [...current.people, person],
        memberships: [...current.memberships, {
          id: createUuid(),
          groupId: selectedGroup.id,
          personId: person.id,
          roleLabel: '',
          affiliationOverride: null,
          displayOrder: nextMembershipOrder(current.memberships, selectedGroup.id),
        }],
      };
    });
  };

  const changeMembership = (membershipId, field, value) => {
    setDraft((current) => ({
      ...current,
      memberships: current.memberships.map((membership) => (
        membership.id === membershipId ? { ...membership, [field]: value } : membership
      )),
    }));
  };

  const changePendingCustomMembership = (membershipId, pending) => {
    setPendingCustomMembershipIds((current) => {
      const next = new Set(current);
      if (pending) next.add(membershipId);
      else next.delete(membershipId);
      return next;
    });
  };

  const removeMembership = (membershipId) => {
    changePendingCustomMembership(membershipId, false);
    setDraft((current) => ({
      ...current,
      memberships: current.memberships.filter(({ id }) => id !== membershipId),
    }));
  };

  return (
    <div ref={editorRef} className="min-w-0 space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <button type="button" onClick={onBack} className="min-h-12 w-full rounded-lg border border-gray-300 px-4 font-bold text-gray-800 hover:bg-gray-50 sm:w-auto">
          소개글 목록으로 돌아가기
        </button>
        <div className="mt-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">함께하는이들 조직도 관리</h2>
            <p className="mt-2 text-gray-700">그룹 변경은 저장 전 미리보기 모델에만 반영됩니다.</p>
          </div>
          <div className="grid w-full grid-cols-1 items-center gap-3 sm:w-auto sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPanel((current) => (current === 'people' ? 'groups' : 'people'))}
              className="min-h-12 w-full rounded-lg border border-green-700 px-4 font-bold text-green-800"
            >
              {panel === 'people' ? '조직 편집' : '인물 관리'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="min-h-12 w-full rounded-lg bg-green-700 px-4 font-bold text-white"
            >
              저장 전 미리보기
            </button>
            <button
              type="button"
              onClick={() => organizationQuery.refetch()}
              disabled={organizationQuery.isFetching || saveMutation.isPending || saveRequestInFlightRef.current}
              className="min-h-12 w-full rounded-lg border border-gray-300 px-4 font-bold text-gray-800 disabled:cursor-wait disabled:opacity-60"
            >
              {organizationQuery.isFetching ? '서버 확인 중…' : '서버 변경 확인'}
            </button>
            <button
              type="button"
              onClick={requestSave}
              disabled={saveDisabled}
              className="min-h-12 w-full rounded-lg bg-green-800 px-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-700"
            >
              {saveLabel}
            </button>
            <p className={`rounded-full px-4 py-2 text-sm font-bold sm:col-span-2 ${dirty ? 'bg-amber-100 text-amber-900' : 'bg-green-100 text-green-800'}`} role="status">
              {dirty ? '저장하지 않은 변경사항 있음' : '서버 내용과 동일'}
            </p>
          </div>
        </div>
      </header>

      {saveFeedback && (
        <div
          ref={saveFeedbackRef}
          role={saveFeedback.type === 'success' ? 'status' : 'alert'}
          tabIndex={-1}
          data-save-feedback
          className={`rounded-xl border p-4 font-semibold ${saveFeedback.type === 'success'
            ? 'border-green-300 bg-green-50 text-green-900'
            : 'border-red-300 bg-red-50 text-red-900'}`}
        >
          {saveFeedback.message}
        </div>
      )}

      {!acceptedServerSnapshot.configured
        && legacyQueryReady
        && hasMeaningfulLegacyPeopleHtml(effectiveLegacyHtml)
        && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <strong>현재 공개 화면은 기존 소개글을 사용 중입니다.</strong>
          <p className="mt-1">첫 저장 전에 현재 기존 내용을 별도로 확인합니다.</p>
        </div>
        )}
      {acceptedServerSnapshot.configured && acceptedServerSnapshot.legacyContentDrift && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <strong>저장된 조직도와 기존 내용이 달라졌습니다.</strong>
          <p className="mt-1">현재 기존 내용을 확인하고 변경 사실을 승인한 뒤 저장해 주세요.</p>
        </div>
      )}
      {legacyDecisionRequired && legacyQuery.isPending && !pendingCutover && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
          기존 함께하는이들 내용을 확인하고 있습니다. 확인이 끝날 때까지 저장할 수 없습니다.
        </div>
      )}
      {legacyDecisionRequired && legacyQuery.isError && !pendingCutover && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <strong>기존 함께하는이들 내용을 확인하지 못했습니다.</strong>
          <p className="mt-1">확인에 성공하기 전에는 저장하지 않습니다.</p>
          <button
            type="button"
            onClick={() => legacyQuery.refetch()}
            disabled={legacyQuery.isFetching}
            className="mt-3 min-h-12 w-full rounded-lg border border-red-700 px-4 font-bold sm:w-auto"
          >
            {legacyQuery.isFetching ? '기존 내용 확인 중…' : '기존 내용 다시 확인'}
          </button>
        </div>
      )}
      {legacyConflictRefresh?.status === 'loading' && !revisionConflictActive && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
          변경된 기존 내용과 최신 조직도 기준을 다시 확인하고 있습니다.
        </div>
      )}
      {legacyConflictRefresh?.status === 'error' && !revisionConflictActive && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <button
            type="button"
            onClick={refreshLegacyConflictState}
            className="min-h-12 w-full rounded-lg border border-red-700 px-4 font-bold sm:w-auto"
          >
            최신 기존 내용 다시 확인
          </button>
        </div>
      )}

      {revisionConflictActive && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <strong>다른 관리자가 먼저 저장했습니다.</strong>
          <p className="mt-1">현재 초안은 유지됩니다. 비교 후 최신 내용을 직접 불러와 주세요.</p>
          <button
            type="button"
            onClick={revisionConflict?.status === 'error'
              ? fetchLatestForRevisionConflict
              : loadLatestServerSnapshot}
            disabled={revisionConflict?.status === 'loading'}
            className="mt-3 min-h-12 w-full rounded-lg bg-red-700 px-4 font-bold text-white disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {revisionConflict?.status === 'loading'
              ? '최신 내용 불러오는 중…'
              : revisionConflict?.status === 'error' ? '최신 내용 다시 확인' : '최신 내용 불러오기'}
          </button>
        </div>
      )}
      {organizationQuery.isError && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          서버 변경 확인에 실패했습니다. 현재 편집 중인 초안은 그대로 유지됩니다.
        </div>
      )}
      {dirty && cutoverStateChanged && !revisionConflictActive && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p>기존 함께하는이들 내용의 전환 상태가 바뀌었습니다. 현재 초안과 승인한 기준은 유지됩니다.</p>
          <button type="button" onClick={loadLatestServerSnapshot} className="mt-3 min-h-12 w-full rounded-lg border border-amber-700 px-4 font-bold sm:w-auto">최신 내용 불러오기</button>
        </div>
      )}
      {!dirty && (revisionChanged || cutoverStateChanged) && !revisionConflict && (
        <div role="status" className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-950">
          <p>서버에 더 최신 내용이 있습니다.</p>
          <button type="button" onClick={loadLatestServerSnapshot} className="mt-3 min-h-12 w-full rounded-lg border border-blue-700 px-4 font-bold sm:w-auto">최신 내용 불러오기</button>
        </div>
      )}

      {panel === 'people' && (
        <OrganizationPeopleDirectory
          people={draft.people}
          memberships={membershipsWithGroupNames}
          errors={peopleErrors}
          onAdd={addPerson}
          onChange={changePerson}
          onDelete={deletePerson}
          onBack={() => setPanel('groups')}
        />
      )}
      <div hidden={panel === 'people'} className="min-w-0 space-y-6">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)]">
          <OrganizationGroupTree
            groups={draft.groups}
            selectedGroupId={selectedGroupId}
            onSelect={setSelectedGroupId}
            onAddRoot={() => addGroup(null)}
            onAddChild={addGroup}
            onMove={(groupId, direction) => setDraft((current) => moveGroup(current, groupId, direction))}
            onToggleEnabled={(groupId) => setDraft((current) => ({
              ...current,
              groups: current.groups.map((group) => (
                group.id === groupId ? { ...group, enabled: !group.enabled } : group
              )),
            }))}
            onDelete={deleteGroup}
          />
          <OrganizationGroupForm
            group={selectedGroup}
            parentOptions={parentOptions}
            errors={selectedErrors}
            onChange={changeSelectedGroup}
          />
        </div>
        <OrganizationMembershipEditor
          key={`${acceptedServerSnapshot.revision}:${acceptedServerSnapshot.legacyContentFingerprint}:${acceptedServerSnapshot.legacyContentDrift}`}
          group={selectedGroup}
          memberships={selectedMemberships}
          people={peopleWithLinks}
          errors={membershipErrors}
          pendingCustomMembershipIds={pendingCustomMembershipIds}
          onPendingCustomChange={changePendingCustomMembership}
          onAddExisting={addExistingMembership}
          onCreateAndAdd={createAndAddMembership}
          onChange={changeMembership}
          onMove={(membershipId, direction) => setDraft((current) => (
            moveMembership(current, selectedGroup.id, membershipId, direction)
          ))}
          onRemove={removeMembership}
        />
      </div>

      {previewOpen && <OrganizationDirectoryPreview draft={draft} onClose={() => setPreviewOpen(false)} />}
      {confirmationOpen && (
        <OrganizationSaveConfirmation
          legacyHtml={effectiveLegacyHtml}
          mode={acceptedServerSnapshot.legacyContentDrift ? 'drift' : 'cutover'}
          onCancel={() => setConfirmationOpen(false)}
          onConfirm={() => {
            setConfirmationOpen(false);
            performSave();
          }}
        />
      )}
    </div>
  );
}
