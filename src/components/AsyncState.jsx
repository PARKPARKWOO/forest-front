const STATE_DEFAULTS = {
  loading: {
    title: '내용을 불러오고 있습니다',
    description: '잠시만 기다려 주세요.',
  },
  error: {
    title: '내용을 불러오지 못했습니다',
    description: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  },
  empty: {
    title: '등록된 내용이 없습니다',
    description: '새로운 내용이 등록되면 이곳에서 확인하실 수 있습니다.',
  },
};

export default function AsyncState({
  status = 'empty',
  title,
  description,
  onRetry,
  retryLabel = '다시 시도',
  isRetrying = false,
  className = '',
}) {
  const defaults = STATE_DEFAULTS[status] || STATE_DEFAULTS.empty;
  const isError = status === 'error';
  const isLoading = status === 'loading';

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm ${className}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-busy={isLoading || isRetrying}
    >
      <div className="mb-4 flex justify-center" aria-hidden="true">
        {isLoading ? (
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />
        ) : (
          <span className={`text-5xl ${isError ? 'text-red-600' : 'text-gray-400'}`}>
            {isError ? '!' : '—'}
          </span>
        )}
      </div>
      <h3 className={`text-xl font-bold ${isError ? 'text-red-800' : 'text-gray-800'}`}>
        {title || defaults.title}
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-lg leading-relaxed text-gray-600">
        {description || defaults.description}
      </p>
      {isError && onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          disabled={isRetrying}
          className="accessible-touch-target mt-6 inline-flex items-center justify-center rounded-lg bg-green-700 px-6 py-3 text-lg font-semibold text-white hover:bg-green-800 disabled:cursor-wait disabled:bg-gray-500"
        >
          {isRetrying ? '다시 불러오는 중…' : retryLabel}
        </button>
      )}
    </div>
  );
}
