import { User, Student } from '../types';
import { LogOut, GraduationCap, UserCheck, ShieldAlert, Users, CalendarCheck2 } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  students: Student[];
  onLogout: () => void;
  onRoleSwitch: (role: 'teacher' | 'student' | 'parent', targetStudentId?: string) => void;
}

export default function Header({ currentUser, students, onLogout, onRoleSwitch }: HeaderProps) {
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert className="h-3 w-3" />
            Giáo Viên Chủ Nhiệm
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="h-3 w-3" />
            Học Sinh
          </span>
        );
      case 'parent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Users className="h-3 w-3" />
            Phụ Huynh Học Sinh
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0" id="main-header">
      <div className="w-full px-6 sm:px-8" id="header-container">
        <div className="flex justify-between h-16 items-center" id="header-flex">
          {/* Logo */}
          <div className="flex items-center gap-2.5" id="header-logo-section">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm" id="header-logo-badge">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-center gap-2" id="header-app-title">
                Bảng điều khiển Lớp 12A4
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded tracking-wide uppercase">
                  Học Trực Tiếp
                </span>
              </h1>
              <p className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider" id="header-app-subtitle">
                Hệ thống quản lý học đường EduManage
              </p>
            </div>
          </div>

          {/* User Status / Actions */}
          <div className="flex items-center gap-4" id="header-user-section">
            {/* Quick switcher for easy previewing */}
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200" id="header-role-switcher-container">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2" id="header-switcher-label">
                Chuyển vai nhanh:
              </span>
              <button
                type="button"
                id="switch-btn-teacher"
                onClick={() => onRoleSwitch('teacher')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentUser.role === 'teacher' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giáo Viên
              </button>
              <button
                type="button"
                id="switch-btn-student"
                onClick={() => onRoleSwitch('student', 'HS001')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentUser.role === 'student' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học Sinh (An)
              </button>
              <button
                type="button"
                id="switch-btn-parent"
                onClick={() => onRoleSwitch('parent', 'HS001')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentUser.role === 'parent' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Phụ Huynh (Bình)
              </button>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200" id="header-profile-block">
              <div className="text-right hidden sm:block" id="header-profile-text">
                <p className="text-sm font-bold text-slate-800" id="header-username">
                  {currentUser.name}
                </p>
                <div className="mt-0.5" id="header-badge-wrapper">
                  {getRoleBadge()}
                </div>
              </div>
              
              <button
                type="button"
                id="header-logout-btn"
                onClick={onLogout}
                className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
