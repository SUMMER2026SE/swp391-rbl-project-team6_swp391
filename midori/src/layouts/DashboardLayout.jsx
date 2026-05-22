import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import MidoriBrand from '../components/MidoriBrand';
import SidebarToggleButton from '../components/SidebarToggleButton';
import {
  DashboardIcon,
  FlashcardsIcon,
  VocabularyIcon,
  GrammarIcon,
  ShadowingIcon,
  ExamsIcon,
  AIChatIcon,
} from '../components/MidoriIcons';
import '../styles/dashboard-shell.css';

const LEARNING_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { label: 'Flashcards', path: '/flashcards', icon: FlashcardsIcon },
  { label: 'Vocabulary', path: '/vocabulary', icon: VocabularyIcon },
  { label: 'Grammar', path: '/grammar', icon: GrammarIcon },
];

const TOOL_ITEMS = [
  { label: 'Shadowing', path: '/dashboard/shadowing', icon: ShadowingIcon },
  { label: 'Exams', icon: ExamsIcon },
  { label: 'AI Chat', icon: AIChatIcon },
];

const HEADER_NAV = [
  { label: 'Dashboard', path: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Vocabulary', path: '/vocabulary' },
  { label: 'Grammar', path: '/grammar' },
  { label: 'Shadowing', path: '/dashboard/shadowing', match: (p) => p.startsWith('/dashboard/shadowing') },
  { label: 'Exams', path: '/exams' },
  { label: 'AI Chat', path: '/ai-chat' },
];

const MIDORI_GRAY = '#333333';
const INACTIVE_TEXT = '#70757a';
const ACTIVE_BG = '#1a73e8';

const SidebarItem = ({ label, path, icon: Icon, isActive, onNavigate }) => {
  const row = (
    <div
      className="dashboard-sidebar-item d-flex align-items-center"
      style={{
        backgroundColor: isActive ? ACTIVE_BG : 'transparent',
        color: isActive ? '#fff' : INACTIVE_TEXT,
        fontWeight: isActive ? 600 : 400,
        cursor: path ? 'pointer' : 'default',
      }}
    >
      <Icon />
      <span className="dashboard-sidebar-item__label">{label}</span>
    </div>
  );

  if (path) {
    return (
      <Link to={path} className="text-decoration-none" onClick={onNavigate}>
        {row}
      </Link>
    );
  }
  return row;
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1200 : true
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1200) return;
      setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const isNavActive = (item) => {
    if (item.match) return item.match(pathname);
    return pathname === item.path;
  };

  const shellClass = [
    'dashboard-shell',
    'd-flex',
    sidebarOpen ? 'dashboard-shell--sidebar-open' : '',
  ].join(' ');

  return (
    <div className={shellClass}>
      <button
        type="button"
        className={`dashboard-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        aria-label="Đóng menu"
        onClick={closeSidebar}
      />

      <aside className="dashboard-sidebar bg-white border-end d-flex flex-column">
        <div className="dashboard-sidebar__brand px-3 d-flex align-items-center justify-content-between border-bottom">
          <MidoriBrand size={44} gap={10} textSize="1.5rem" to="/dashboard" className="flex-grow-1" />
          <SidebarToggleButton open className="d-xl-none" onClick={closeSidebar} />
        </div>

        <nav className="dashboard-sidebar__nav flex-grow-1 overflow-auto">
          <small className="dashboard-sidebar__section-label text-uppercase fw-bold d-block">
            HỌC TẬP
          </small>
          {LEARNING_ITEMS.map(({ label, path, icon }) => (
            <SidebarItem
              key={label}
              label={label}
              path={path}
              icon={icon}
              isActive={pathname === path}
              onNavigate={closeSidebar}
            />
          ))}

          <hr className="dashboard-sidebar__divider" />

          <small className="dashboard-sidebar__section-label text-uppercase fw-bold d-block">
            CÔNG CỤ
          </small>
          {TOOL_ITEMS.map(({ label, path, icon }) => (
            <SidebarItem
              key={label}
              label={label}
              path={path}
              icon={icon}
              isActive={path && pathname === path}
              onNavigate={closeSidebar}
            />
          ))}
        </nav>
      </aside>

      <div className="dashboard-main-column flex-grow-1 d-flex flex-column">
        <header className="dashboard-header bg-white border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center flex-grow-1 min-w-0 gap-2">
            <SidebarToggleButton open={sidebarOpen} onClick={toggleSidebar} />
            <div className="d-xl-none flex-shrink-0">
              <MidoriBrand size={36} showText={false} to="/dashboard" />
            </div>
            <div className="d-none d-lg-flex align-items-center dashboard-header__nav ms-1">
              {HEADER_NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="dashboard-header__link fw-semibold text-decoration-none"
                  style={{
                    color: isNavActive(item) ? MIDORI_GRAY : INACTIVE_TEXT,
                    borderBottom: isNavActive(item) ? `2px solid ${MIDORI_GRAY}` : '2px solid transparent',
                    paddingBottom: '4px',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <img
            src="https://i.pravatar.cc/150?img=11"
            alt="Avatar"
            className="dashboard-header__avatar border shadow-sm flex-shrink-0"
          />
        </header>

        <main className="dashboard-main">
          <div className="dashboard-main__outlet">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
