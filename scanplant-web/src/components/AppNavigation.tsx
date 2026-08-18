import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bot,
  Camera,
  CircleHelp,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldAlert,
  Sprout,
} from 'lucide-react';
import { auth, isAdminSession } from '../api';
import BrandLogo from './BrandLogo';

const primaryItems = [
  { to: '/', label: 'Início', Icon: Home },
  { to: '/photo', label: 'Identificar', Icon: Camera, primary: true },
  { to: '/gallery?mode=personal', label: 'Coleção', Icon: Sprout },
  { to: '/plant-assistant', label: 'Assistente', Icon: Bot },
  { to: '/profile', label: 'Perfil', Icon: Settings },
];

const desktopItems = [
  ...primaryItems.slice(0, 2),
  { to: '/search', label: 'Explorar', Icon: Search },
  primaryItems[2],
  { to: '/chats', label: 'Conversas', Icon: MessageCircle },
  primaryItems[3],
  { to: '/instructions', label: 'Como usar', Icon: CircleHelp },
  primaryItems[4],
];

const AppNavigation = () => {
  const navigate = useNavigate();
  const isAdmin = isAdminSession();
  const visibleDesktopItems = isAdmin
    ? [...desktopItems, { to: '/admin', label: 'Administração', Icon: ShieldAlert, primary: false }]
    : desktopItems;
  const visiblePrimaryItems = isAdmin
    ? [...primaryItems, { to: '/admin', label: 'Admin', Icon: ShieldAlert, primary: false }]
    : primaryItems;

  const signOut = async () => {
    await auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <aside className="app-sidebar" aria-label="Navegação principal">
        <button onClick={() => navigate('/')} className="sidebar-brand" aria-label="Ir para o início">
          <BrandLogo />
        </button>

        <nav className="sidebar-nav">
          {visibleDesktopItems.map(({ to, label, Icon }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-nav-link ${
                isActive
                  ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-800)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-primary-700)]'
              }`}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={signOut} className="sidebar-logout">
            <LogOut size={18} /> <span>Sair com segurança</span>
          </button>
        </div>
      </aside>

      <nav
        className="mobile-nav"
        aria-label="Navegação principal móvel"
        style={{ gridTemplateColumns: `repeat(${visiblePrimaryItems.length}, minmax(0, 1fr))` }}
      >
        {visiblePrimaryItems.map(({ to, label, Icon, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${primary ? 'nav-item--primary' : ''} ${isActive ? 'active' : ''}`}
          >
            <Icon size={primary ? 22 : 20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default AppNavigation;
