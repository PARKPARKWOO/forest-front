const DRAFT_KEY_PREFIX = 'forest:program-application-draft:';
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;
const expirationTimers = new Map();

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getDraftKey = (programId, userId) => {
  if (programId == null || userId == null) return null;
  return `${DRAFT_KEY_PREFIX}${encodeURIComponent(String(programId))}:${encodeURIComponent(String(userId))}`;
};

const cancelExpiration = (key) => {
  const timer = expirationTimers.get(key);
  if (timer != null) window.clearTimeout(timer);
  expirationTimers.delete(key);
};

const removeDraftByKey = (storage, key) => {
  cancelExpiration(key);
  try {
    storage.removeItem(key);
  } catch {
    // 저장소 정책으로 정리할 수 없는 경우 앱 흐름은 계속한다.
  }
};

const scheduleExpiration = (storage, key, savedAt) => {
  cancelExpiration(key);
  const remainingMs = DRAFT_TTL_MS - (Date.now() - savedAt);
  if (remainingMs <= 0) {
    removeDraftByKey(storage, key);
    return;
  }

  const timer = window.setTimeout(() => {
    removeDraftByKey(storage, key);
  }, remainingMs);
  expirationTimers.set(key, timer);
};

export const isFileValue = (value) => (
  typeof File !== 'undefined' && value instanceof File
);

export const readProgramApplicationDraft = (programId, userId) => {
  const storage = getStorage();
  const key = getDraftKey(programId, userId);
  if (!storage || !key) return null;

  try {
    const rawDraft = storage.getItem(key);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft);
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      removeDraftByKey(storage, key);
      return null;
    }

    scheduleExpiration(storage, key, draft.savedAt);
    return draft;
  } catch {
    removeDraftByKey(storage, key);
    return null;
  }
};

export const writeProgramApplicationDraft = (
  programId,
  userId,
  formResponses,
  agreements,
  pendingFileFieldIds = [],
) => {
  const storage = getStorage();
  const key = getDraftKey(programId, userId);
  if (!storage || !key) return;

  const serializableResponses = {};
  const fileFieldIds = new Set(pendingFileFieldIds.map(String));
  Object.entries(formResponses).forEach(([fieldId, value]) => {
    if (isFileValue(value)) {
      fileFieldIds.add(fieldId);
    } else {
      serializableResponses[fieldId] = value;
    }
  });

  const savedAt = Date.now();
  try {
    storage.setItem(key, JSON.stringify({
      formResponses: serializableResponses,
      agreements,
      fileFieldIds: Array.from(fileFieldIds),
      savedAt,
    }));
    scheduleExpiration(storage, key, savedAt);
  } catch {
    // 저장 공간 부족/브라우저 정책으로 초안 저장이 불가능해도 신청은 계속한다.
  }
};

export const clearProgramApplicationDraft = (programId, userId) => {
  const storage = getStorage();
  const key = getDraftKey(programId, userId);
  if (storage && key) removeDraftByKey(storage, key);
};

export const clearExpiredProgramApplicationDrafts = () => {
  const storage = getStorage();
  if (!storage) return;

  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key) => key?.startsWith(DRAFT_KEY_PREFIX));

  keys.forEach((key) => {
    try {
      const draft = JSON.parse(storage.getItem(key));
      if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
        removeDraftByKey(storage, key);
      } else {
        scheduleExpiration(storage, key, draft.savedAt);
      }
    } catch {
      removeDraftByKey(storage, key);
    }
  });
};

export const clearAllProgramApplicationDrafts = () => {
  const storage = getStorage();
  if (!storage) return;

  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key) => key?.startsWith(DRAFT_KEY_PREFIX));
  keys.forEach((key) => removeDraftByKey(storage, key));
};
