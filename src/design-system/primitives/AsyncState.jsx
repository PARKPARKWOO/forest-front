import Button from './Button';
import Surface from '../patterns/Surface';

const STATE_DEFAULTS = {
  loading: {
    title: '내용을 불러오고 있습니다',
    description: '잠시만 기다려 주세요.',
  },
  error: {
    title: '내용을 불러오지 못했습니다',
    description: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  },
  forbidden: {
    title: '접근 권한이 없습니다',
    description: '이 내용을 볼 수 있는 계정인지 확인해 주세요.',
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
  const isForbidden = status === 'forbidden';
  const isAlert = isError || isForbidden;
  const isLoading = status === 'loading';
  const stateTextClassName = isError
    ? 'text-forest-danger-text'
    : isForbidden
      ? 'text-forest-warning-text'
      : 'text-forest-text-muted';

  return (
    <Surface
      as="div"
      className={`px-forest-6 py-forest-8 text-center ${className}`.trim()}
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      aria-busy={isLoading || isRetrying}
    >
      <div className="mb-forest-4 flex justify-center" aria-hidden="true">
        {isLoading ? (
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-forest-border-subtle border-t-forest-primary" />
        ) : (
          <span className={`text-forest-heading-1 ${stateTextClassName}`}>
            {isAlert ? '!' : '—'}
          </span>
        )}
      </div>
      <h3 className={`text-forest-heading-3 font-bold ${isAlert ? stateTextClassName : 'text-forest-text-primary'}`}>
        {title || defaults.title}
      </h3>
      <p className="mx-auto mt-forest-2 max-w-2xl text-forest-body text-forest-text-muted">
        {description || defaults.description}
      </p>
      {isError && onRetry && (
        <Button
          className="mt-forest-6"
          onClick={() => onRetry()}
          isPending={isRetrying}
          pendingLabel="다시 불러오는 중…"
        >
          {retryLabel}
        </Button>
      )}
    </Surface>
  );
}
