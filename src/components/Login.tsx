import React, { useState, useEffect } from 'react';
import { User, UserRole, Student } from '../types';
import { LogIn, GraduationCap, Users, UserCheck, ShieldAlert } from 'lucide-react';

interface LoginProps {
  students: Student[];
  onLogin: (user: User) => void;
}

export default function Login({ students, onLogin }: LoginProps) {
  const [role, setRole] = useState<UserRole>('teacher');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const [username, setUsername] = useState<string>('0902705787');
  const [password, setPassword] = useState<string>('admin124');

  useEffect(() => {
    if (role === 'teacher') {
      setUsername('0902705787');
      setPassword('admin124');
    } else if (role === 'student') {
      const studentId = selectedStudentId || (students.length > 0 ? students[0].id : '');
      setUsername(studentId.toLowerCase());
      setPassword('123456');
    } else if (role === 'parent') {
      const student = students.find(s => s.id === selectedStudentId) || students[0];
      setUsername(student ? student.parentPhone : '');
      setPassword('123456');
    }
  }, [role, selectedStudentId, students]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'teacher') {
      if (username !== '0902705787' || password !== 'admin124') {
        setError('Tên đăng nhập (SĐT) hoặc mật khẩu giáo viên không chính xác.');
        return;
      }
      onLogin({
        id: 'GV001',
        username: '0902705787',
        name: 'Thầy Nguyễn Văn Điền',
        role: 'teacher'
      });
    } else if (role === 'student') {
      const matchedStudent = students.find(s => s.id.toLowerCase() === username.toLowerCase());
      if (!matchedStudent) {
        setError('Không tìm thấy thông tin học sinh với mã đăng nhập này.');
        return;
      }
      onLogin({
        id: matchedStudent.id,
        username: matchedStudent.id.toLowerCase(),
        name: matchedStudent.name,
        role: 'student',
        studentId: matchedStudent.id
      });
    } else if (role === 'parent') {
      const matchedStudent = students.find(s => s.parentPhone === username);
      if (!matchedStudent) {
        setError('Không tìm thấy số điện thoại phụ huynh phù hợp.');
        return;
      }
      onLogin({
        id: `PH_${matchedStudent.id}`,
        username: `ph_${matchedStudent.id.toLowerCase()}`,
        name: `${matchedStudent.parentName} (PH em ${matchedStudent.name})`,
        role: 'parent',
        studentId: matchedStudent.id
      });
    }
  };

  const handleQuickLogin = (quickRole: UserRole, studentId?: string) => {
    if (quickRole === 'teacher') {
      onLogin({
        id: 'GV001',
        username: '0902705787',
        name: 'Thầy Nguyễn Văn Điền (GVCN)',
        role: 'teacher'
      });
    } else if (quickRole === 'student' && studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        onLogin({
          id: student.id,
          username: student.id.toLowerCase(),
          name: student.name,
          role: 'student',
          studentId: student.id
        });
      }
    } else if (quickRole === 'parent' && studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        onLogin({
          id: `PH_${student.id}`,
          username: `ph_${student.id.toLowerCase()}`,
          name: `${student.parentName} (PH em ${student.name})`,
          role: 'parent',
          studentId: student.id
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12" id="login-container">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm" id="login-card">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4" id="logo-icon-container">
            <GraduationCap className="h-10 w-10" id="login-logo-icon" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight uppercase" id="login-title">
            EduClass 12A4
          </h2>
          <p className="mt-2 text-xs text-slate-500" id="login-subtitle">
            Hệ thống quản lý lớp học toàn diện & tương tác
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider" id="role-selector">
          <button
            type="button"
            id="role-btn-teacher"
            onClick={() => { setRole('teacher'); setError(''); }}
            className={`py-2.5 px-2 rounded transition-all flex flex-col items-center gap-1 cursor-pointer ${
              role === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Giáo Viên
          </button>
          <button
            type="button"
            id="role-btn-student"
            onClick={() => { setRole('student'); setError(''); if (students.length > 0 && !selectedStudentId) setSelectedStudentId(students[0].id); }}
            className={`py-2.5 px-2 rounded transition-all flex flex-col items-center gap-1 cursor-pointer ${
              role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Học Sinh
          </button>
          <button
            type="button"
            id="role-btn-parent"
            onClick={() => { setRole('parent'); setError(''); if (students.length > 0 && !selectedStudentId) setSelectedStudentId(students[0].id); }}
            className={`py-2.5 px-2 rounded transition-all flex flex-col items-center gap-1 cursor-pointer ${
              role === 'parent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Phụ Huynh
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs flex items-center gap-2" id="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit} id="login-form">
          <div className="space-y-4 rounded-md" id="form-fields">
            {role !== 'teacher' && (
              <div id="student-selector-field">
                <label htmlFor="student-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {role === 'student' ? 'Chọn Học Sinh' : 'Chọn Phụ Huynh của học sinh'}
                </label>
                <select
                  id="student-select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs shadow-sm focus:outline-indigo-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) {role === 'parent' ? `- PH: ${s.parentName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div id="username-field">
              <label htmlFor="username-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tên đăng nhập / Số điện thoại
              </label>
              <input
                id="username-input"
                type="text"
                required
                placeholder={
                  role === 'teacher' ? 'Số điện thoại giáo viên' : 
                  role === 'student' ? 'Mã số học sinh (VD: hs001)' : 'Số điện thoại phụ huynh'
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-slate-250 text-slate-800 rounded-lg text-xs focus:outline-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * Có thể chỉnh sửa hoặc giữ nguyên giá trị được liên kết để trải nghiệm nhanh.
              </p>
            </div>

            <div id="password-field">
              <label htmlFor="password-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mật khẩu
              </label>
              <input
                id="password-input"
                type="password"
                required
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-slate-250 text-slate-800 rounded-lg text-xs focus:outline-indigo-500"
              />
            </div>
          </div>

          <div id="submit-btn-container">
            <button
              type="submit"
              id="login-submit-btn"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-xs font-bold uppercase tracking-wider rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-4 w-4 text-indigo-300 group-hover:text-indigo-200 transition-all" />
              </span>
              Đăng Nhập Ngay
            </button>
          </div>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="relative my-6" id="divider-section">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-white px-3 text-slate-400 font-bold">Trải nghiệm nhanh (Một Chạm)</span>
          </div>
        </div>

        <div className="space-y-2.5" id="quick-logins">
          <button
            type="button"
            id="quick-login-teacher"
            onClick={() => handleQuickLogin('teacher')}
            className="w-full flex items-center justify-between p-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 bg-indigo-50 border border-indigo-100 rounded text-indigo-600 font-bold text-[10px]">GVCN</span>
              <span>Đăng nhập với vai Giáo Viên</span>
            </div>
            <span className="text-[11px] font-bold text-indigo-600">Thầy Văn Điền →</span>
          </button>

          <button
            type="button"
            id="quick-login-student"
            onClick={() => handleQuickLogin('student', 'HS001')}
            className="w-full flex items-center justify-between p-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-50 border border-emerald-100 rounded text-emerald-600 font-bold text-[10px]">HS</span>
              <span>Đăng nhập với vai Học Sinh</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Nguyễn Văn An →</span>
          </button>

          <button
            type="button"
            id="quick-login-parent"
            onClick={() => handleQuickLogin('parent', 'HS001')}
            className="w-full flex items-center justify-between p-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-50 border border-amber-100 rounded text-amber-600 font-bold text-[10px]">PH</span>
              <span>Đăng nhập với vai Phụ Huynh</span>
            </div>
            <span className="text-[11px] font-bold text-amber-600">Nguyễn Bình (PH An) →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
