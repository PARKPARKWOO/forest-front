import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useFocusTrap from '../../hooks/useFocusTrap';
import { isNavigationItemActive } from '../../navigation/publicNavigation';

function MobileNavigationItem({ item, pathname, expandedItems, onToggle, onNavigate }) {
  const hasChildren = item.children?.length > 0;
  const isExpanded = Boolean(expandedItems[item.id]);
  const panelId = `mobile-navigation-${item.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <li>
      <div className={`flex items-stretch rounded-lg ${isNavigationItemActive(item, pathname) ? 'bg-green-50' : ''}`}>
        <Link
          to={item.path}
          aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
          className="flex min-h-12 flex-1 items-center px-4 text-lg font-medium text-gray-800 transition-colors duration-200 hover:bg-gray-50 hover:text-green-800"
          onClick={onNavigate}
        >
          {item.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={`${item.name} 하위 메뉴 ${isExpanded ? '접기' : '펼치기'}`}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-800"
            onClick={() => onToggle(item.id)}
          >
            <svg aria-hidden="true" className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul id={panelId} className="ml-4 border-l-2 border-green-100 pl-2">
          {item.children.map((child) => (
            <MobileNavigationItem
              key={child.id}
              item={child}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function MobileNav({
  isOpen,
  items,
  pathname,
  isLoading,
  auth,
  onClose,
  onLogin,
  onLogout,
  triggerRef,
}) {
  const [expandedItems, setExpandedItems] = useState({});
  const containerRef = useRef(null);
  const closeRef = useRef(null);

  useFocusTrap({
    containerRef,
    initialFocusRef: closeRef,
    isActive: isOpen,
    onEscape: onClose,
    triggerRef,
  });

  useEffect(() => {
    if (!isOpen) {
      setExpandedItems({});
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');
    const closeForDesktop = (event) => {
      if (event.matches) onClose();
    };

    document.body.style.overflow = 'hidden';
    desktopMediaQuery.addEventListener('change', closeForDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopMediaQuery.removeEventListener('change', closeForDesktop);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleItem = (id) => {
    setExpandedItems((current) => ({ ...current, [id]: !current[id] }));
  };

  const closeAfterNavigation = () => {
    onClose();
  };

  const { isAuthenticated, isAdmin, user } = auth;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full cursor-default bg-black/40"
        onClick={onClose}
      />

      <nav
        id="mobile-navigation"
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        className="absolute inset-y-0 right-0 z-10 w-full max-w-md overflow-y-auto overscroll-contain bg-white shadow-2xl focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          <p className="text-lg font-bold text-green-900">전체 메뉴</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="모바일 메뉴 닫기"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-2xl text-gray-700 hover:bg-gray-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="border-b border-gray-200 bg-green-50 p-4">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-gray-900">{user.name}님</p>
              <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button type="button" className="min-h-12 rounded-lg bg-red-600 px-4 text-lg font-semibold text-white hover:bg-red-700" onClick={onLogout}>
                  로그아웃
                </button>
                {isAdmin && (
                  <Link to="/admin" aria-current={pathname.startsWith('/admin') ? 'page' : undefined} className="flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-4 text-lg font-semibold text-white hover:bg-green-800" onClick={closeAfterNavigation}>
                    관리자
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <button type="button" className="min-h-12 w-full rounded-lg bg-green-700 px-4 text-lg font-semibold text-white hover:bg-green-800" onClick={onLogin}>
              로그인
            </button>
          )}
        </div>

        <h2 className="sr-only">전체 메뉴</h2>
        <ul className="space-y-1 p-3">
          {isLoading && (
            <li className="flex min-h-12 items-center px-4 text-lg text-gray-600" aria-live="polite">
              카테고리를 불러오는 중입니다.
            </li>
          )}
          {items.map((item) => (
            <MobileNavigationItem
              key={item.id}
              item={item}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggle={toggleItem}
              onNavigate={closeAfterNavigation}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default MobileNav;
