import { 
  Home, 
  Users, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  UserCircle, 
  LogOut,
  PlusCircle,
  Search
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useFirebase } from '../lib/FirebaseProvider';
import { cn } from '../lib/utils';

export function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: PlusCircle, label: 'Add', path: '/leads/new', center: true },
    { icon: CheckSquare, label: 'Tasks', path: '/leads?filter=today' },
    { icon: UserCircle, label: 'Admin', path: '/admin' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-3 z-50 md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 min-w-[64px]",
            isActive ? "text-blue-600" : "text-gray-400",
            item.center && "text-blue-500 transform -translate-y-4 bg-white rounded-full p-2 shadow-lg border border-gray-50"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon size={item.center ? 32 : 20} strokeWidth={isActive ? 2.5 : 2} />
              {!item.center && <span className="text-[10px] font-medium">{item.label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function DesktopSidebar() {
  const { logout, user } = useFirebase();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: BarChart3, label: 'Stats', path: '/stats' },
    { icon: UserCircle, label: 'Admin', path: '/admin' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">LeadPilot</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              isActive 
                ? "bg-blue-50 text-blue-600 font-semibold" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
            {user?.photoURL ? <img src={user.photoURL} alt="" /> : user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function Header() {
  const { user, logout } = useFirebase();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 z-40 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <BarChart3 size={20} />
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-900">LeadPilot</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
          <p className="text-xs font-medium text-gray-900">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <button 
          onClick={logout}
          className="p-2 text-gray-400 hover:text-gray-900 md:hidden"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
