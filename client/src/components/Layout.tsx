import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  HomeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    ...(user?.role === 'admin'
      ? [{ name: 'Admin Panel', href: '/admin', icon: Cog6ToothIcon }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-clarity-900 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none">
              <path d="M50 0 L58 42 L50 35 L42 42 Z" fill="white"/>
              <path d="M100 50 L58 58 L65 50 L58 42 Z" fill="white"/>
              <path d="M50 100 L42 58 L50 65 L58 58 Z" fill="white"/>
              <path d="M0 50 L42 42 L35 50 L42 58 Z" fill="white"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-clarity-900">Clarity</h1>
            <p className="text-xs text-clarity-500">Customer Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-clarity-100 text-clarity-900'
                      : 'text-clarity-900 hover:bg-clarity-50 hover:text-clarity-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-clarity-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
