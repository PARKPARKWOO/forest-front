import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isNavigationItemActive } from '../../navigation/publicNavigation';

function DesktopSubmenu({ items, pathname, depth = 0 }) {
  return (
    <ul className={depth === 0 ? 'py-2' : 'border-l border-green-100 py-1 pl-3'}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.path}
            aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
            className="flex min-h-12 items-center px-4 text-lg text-gray-700 transition-colors duration-200 hover:bg-green-50 hover:text-green-800"
          >
            {item.name}
          </Link>
          {item.children?.length > 0 && (
            <DesktopSubmenu items={item.children} pathname={pathname} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function DesktopNav({ items, pathname }) {
  const [openId, setOpenId] = useState(null);

  return (
    <nav aria-label="주요 메뉴" className="hidden border-b border-gray-200/80 bg-white/70 lg:block">
      <ul className="container mx-auto flex justify-center space-x-2 px-6">
        {items.map((item) => {
          const hasChildren = item.children?.length > 0;
          const isOpen = openId === item.id;

          return (
            <li
              key={item.id}
              className="group relative"
              onMouseEnter={() => setOpenId(item.id)}
              onMouseLeave={() => setOpenId(null)}
              onFocus={() => setOpenId(item.id)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setOpenId(null);
                }
              }}
            >
              <Link
                to={item.path}
                aria-current={isNavigationItemActive(item, pathname) ? 'page' : undefined}
                className="relative flex min-h-12 items-center px-4 text-lg text-gray-700 transition-colors duration-200 hover:bg-green-50 hover:text-green-800"
              >
                {item.name}
                {hasChildren && (
                  <svg aria-hidden="true" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                )}
              </Link>

              {hasChildren && isOpen && (
                <div className="absolute left-1/2 top-full z-50 min-w-[220px] -translate-x-1/2 border border-gray-200 bg-white shadow-lg">
                  <DesktopSubmenu items={item.children} pathname={pathname} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default DesktopNav;
