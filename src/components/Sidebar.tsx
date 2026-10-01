import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menu = [
  { path: '/', label: 'Tổng quan', icon: '📊', roles: ['admin', 'staff', 'teacher', 'student'] },
  { path: '/labs', label: 'Phòng máy', icon: '🏫', roles: ['admin', 'staff', 'teacher', 'student'] },
  { path: '/devices', label: 'Thiết bị', icon: '💻', roles: ['admin', 'staff', 'teacher', 'student'] },
  { path: '/incidents', label: 'Sự cố thiết bị', icon: '⚠️', roles: ['admin', 'staff', 'teacher', 'student'] },
  { path: '/bookings', label: 'Đặt lịch', icon: '📅', roles: ['admin', 'staff', 'teacher', 'student'] },
  { path: '/maintenance', label: 'Bảo trì', icon: '🔧', roles: ['admin', 'staff'] },
  { path: '/stats', label: 'Thống kê', icon: '📈', roles: ['admin'] },
  { path: '/users', label: 'Quản lý người dùng', icon: '👥', roles: ['admin'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const allowedMenu = menu.filter((m) => user && m.roles.includes(user.role));

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed top-3 left-3 z-50 p-2 bg-white rounded-lg shadow border border-gray-200 lg:hidden">
        ☰
      </button>

      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-60'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                <img src="/logobachkhoa.png" alt="BK" className="h-8 w-auto object-contain" />
              </span>
              <div>
                <span className="block font-bold text-slate-800 leading-tight">QL phòng máy</span>
                <span className="block text-[10px] text-slate-400 leading-tight">Sự cố thiết bị</span>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-gray-100 rounded-lg hidden lg:block">
            {collapsed ? '→' : '←'}
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg lg:hidden">✕</button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {allowedMenu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive(item.path) ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={collapsed ? item.label : ''}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          {user && (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
              )}
              {!collapsed && (
                <button onClick={logout} className="text-gray-400 hover:text-red-500 text-sm px-2 py-1" title="Đăng xuất">⏻</button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
