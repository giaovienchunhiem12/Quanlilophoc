import React, { useState, useEffect } from 'react';
import { User, Student, Announcement, TimetableDay, DailyLesson, SubjectGrade, TimetablePeriod } from './types';
import { 
  initialStudents, 
  initialAnnouncements, 
  initialTimetable, 
  initialDailyLessons 
} from './data/mockData';

// Component Imports
import Login from './components/Login';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Announcements from './components/Announcements';
import Tuition from './components/Tuition';
import TimetableComponent from './components/TimetableComponent';
import DailyLessons from './components/DailyLessons';
import ClassList from './components/ClassList';
import Attendance from './components/Attendance';
import GradeTracker from './components/GradeTracker';
import MonthlyStats from './components/MonthlyStats';

// Lucide icons for sidebar
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  Calendar, 
  ClipboardList, 
  ClipboardCheck, 
  DollarSign, 
  BookOpen, 
  Award,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart2,
  FileText
} from 'lucide-react';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('edu_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Core database states with LocalStorage persistence
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('edu_students');
    const parsed: Student[] = saved ? JSON.parse(saved) : initialStudents;
    return parsed.map(s => ({
      ...s,
      lunchAmount: s.lunchAmount !== undefined ? s.lunchAmount : (s.learningMode === 'Bán trú' ? 800000 : 0),
      lunchPaid: s.lunchPaid !== undefined ? s.lunchPaid : (s.learningMode === 'Bán trú' ? s.tuitionPaid : false),
    }));
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('edu_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [timetable, setTimetable] = useState<TimetableDay[]>(() => {
    const saved = localStorage.getItem('edu_timetable');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0 && parsed[0].periods && parsed[0].periods.length < 12) {
          return initialTimetable;
        }
        return parsed;
      } catch (e) {
        return initialTimetable;
      }
    }
    return initialTimetable;
  });

  const [dailyLessons, setDailyLessons] = useState<DailyLesson[]>(() => {
    const saved = localStorage.getItem('edu_daily_lessons');
    return saved ? JSON.parse(saved) : initialDailyLessons;
  });

  // UI state: current selected tab in dashboard
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('edu_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('edu_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('edu_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('edu_daily_lessons', JSON.stringify(dailyLessons));
  }, [dailyLessons]);

  // Auth Callbacks
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('edu_user', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('edu_user');
  };

  const handleRoleSwitch = (role: 'teacher' | 'student' | 'parent', targetStudentId?: string) => {
    if (role === 'teacher') {
      const newUser: User = { id: 'GV001', username: '0902705787', name: 'Thầy Nguyễn Văn Điền', role: 'teacher' };
      setCurrentUser(newUser);
      localStorage.setItem('edu_user', JSON.stringify(newUser));
    } else {
      const studId = targetStudentId || (students.length > 0 ? students[0].id : 'HS001');
      const stud = students.find(s => s.id === studId);
      if (stud) {
        if (role === 'student') {
          const newUser: User = { 
            id: stud.id, 
            username: stud.id.toLowerCase(), 
            name: stud.name, 
            role: 'student', 
            studentId: stud.id 
          };
          setCurrentUser(newUser);
          localStorage.setItem('edu_user', JSON.stringify(newUser));
        } else {
          const newUser: User = { 
            id: `PH_${stud.id}`, 
            username: `ph_${stud.id.toLowerCase()}`, 
            name: `${stud.parentName} (PH em ${stud.name})`, 
            role: 'parent', 
            studentId: stud.id 
          };
          setCurrentUser(newUser);
          localStorage.setItem('edu_user', JSON.stringify(newUser));
        }
      }
    }
  };

  // 1. Announcements Callbacks
  const handleAddAnnouncement = (newAnn: Omit<Announcement, 'id' | 'date' | 'author'>) => {
    const ann: Announcement = {
      ...newAnn,
      id: `TB${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: currentUser?.role === 'teacher' ? currentUser.name : 'Ban Giám Hiệu'
    };
    setAnnouncements([ann, ...announcements]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  // 2. Tuition Callbacks
  const handleToggleTuitionPaid = (studentId: string, paid: boolean) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, tuitionPaid: paid } : s));
  };

  const handleToggleLunchPaid = (studentId: string, paid: boolean) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, lunchPaid: paid } : s));
  };

  const handleUpdatePaymentPromiseDate = (studentId: string, promiseDate: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, paymentPromiseDate: promiseDate } : s));
  };

  const handleUpdateBulkTuition = (bantruAmount: number, haibuoiAmount: number) => {
    setStudents(prev => prev.map(s => {
      if (s.learningMode === 'Bán trú') {
        return { ...s, tuitionAmount: bantruAmount };
      } else if (s.learningMode === 'Ngoại trú') {
        return { ...s, tuitionAmount: haibuoiAmount };
      }
      return s;
    }));
  };

  const handleUpdateIndividualTuition = (studentId: string, newAmount: number) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, tuitionAmount: newAmount } : s));
  };

  const handleUpdateBulkLunch = (lunchAmount: number) => {
    setStudents(prev => prev.map(s => {
      if (s.learningMode === 'Bán trú') {
        return { ...s, lunchAmount: lunchAmount };
      }
      return s;
    }));
  };

  // 3. Timetable Callbacks
  const handleUpdateTimetable = (day: string, periodIndex: number, updatedPeriod: Partial<TimetablePeriod>) => {
    setTimetable(prev => prev.map(d => {
      if (d.day === day) {
        const updatedPeriods = d.periods.map((p, idx) => {
          if (idx === periodIndex) {
            return { ...p, ...updatedPeriod };
          }
          return p;
        });
        return { ...d, periods: updatedPeriods };
      }
      return d;
    }));
  };

  // 4. Daily Lessons (Báo bài) Callbacks
  const handleAddDailyLesson = (newReport: Omit<DailyLesson, 'id'>) => {
    const report: DailyLesson = {
      ...newReport,
      id: `BB${Date.now()}`
    };
    setDailyLessons([report, ...dailyLessons]);
  };

  const handleDeleteDailyLesson = (id: string) => {
    setDailyLessons(dailyLessons.filter(l => l.id !== id));
  };

  // 5. ClassList Student Callbacks
  const handleAddStudent = (newStud: Omit<Student, 'attendance' | 'grades' | 'tuitionPaid'>) => {
    // Standard mock default grades
    const defaultGrades: SubjectGrade[] = [
      { subject: 'Toán', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Ngữ văn', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Tiếng Anh', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Vật lý', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Hóa học', oral: [8], m15: [8], m45: [8], final: 8.0 }
    ];

    const student: Student = {
      ...newStud,
      attendance: {
        '2026-07-11': 'present'
      },
      grades: defaultGrades,
      tuitionPaid: false
    };

    setStudents([...students, student]);
  };

  const handleUpdateStudent = (id: string, updatedFields: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleImportStudents = (newStudentsList: Omit<Student, 'attendance' | 'grades' | 'tuitionPaid'>[]) => {
    const defaultGrades: SubjectGrade[] = [
      { subject: 'Toán', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Ngữ văn', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Tiếng Anh', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Vật lý', oral: [8], m15: [8], m45: [8], final: 8.0 },
      { subject: 'Hóa học', oral: [8], m15: [8], m45: [8], final: 8.0 }
    ];

    const formattedList: Student[] = newStudentsList.map(newStud => ({
      ...newStud,
      attendance: {
        '2026-07-11': 'present'
      },
      grades: defaultGrades,
      tuitionPaid: false
    }));

    setStudents(formattedList);
  };


  // 6. Attendance Callbacks
  const handleUpdateAttendance = (studentId: string, date: string, status: 'present' | 'late' | 'excused' | 'absent' | 'pending') => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          attendance: {
            ...s.attendance,
            [date]: status
          }
        };
      }
      return s;
    }));
  };

  const handleMarkAllPresent = (date: string) => {
    setStudents(prev => prev.map(s => ({
      ...s,
      attendance: {
        ...s.attendance,
        [date]: 'present'
      }
    })));
  };

  // 8. Grade Book Tracker Callbacks
  const handleUpdateGrades = (studentId: string, subject: string, updatedGrades: Partial<SubjectGrade>) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const sem = updatedGrades.semester;
        
        // If semester is specified, find if we already have a record for this subject & semester
        if (sem) {
          const hasSemRecord = s.grades.some(g => g.subject === subject && g.semester === sem);
          let newGradesList;
          if (hasSemRecord) {
            newGradesList = s.grades.map(g => {
              if (g.subject === subject && g.semester === sem) {
                return { ...g, ...updatedGrades };
              }
              return g;
            });
          } else {
            const newRecord: SubjectGrade = {
              subject,
              semester: sem,
              oral: updatedGrades.oral || [],
              m15: updatedGrades.m15 || [],
              m45: updatedGrades.m45 || [],
              final: updatedGrades.final !== undefined ? updatedGrades.final : 10
            };
            newGradesList = [...s.grades, newRecord];
          }
          return {
            ...s,
            grades: newGradesList
          };
        } else {
          // Fallback to legacy behavior
          const updatedGradesList = s.grades.map(g => {
            if (g.subject === subject && !g.semester) {
              return { ...g, ...updatedGrades };
            }
            return g;
          });
          return {
            ...s,
            grades: updatedGradesList
          };
        }
      }
      return s;
    }));
  };

  const handleBulkUpdateGrades = (updates: { studentId: string, subject: string, grades: Partial<SubjectGrade> }[]) => {
    setStudents(prev => {
      return prev.map(s => {
        const studentUpdates = updates.filter(u => u.studentId === s.id);
        if (studentUpdates.length === 0) return s;

        let currentGrades = [...s.grades];

        studentUpdates.forEach(update => {
          const subject = update.subject;
          const updatedGrades = update.grades;
          const sem = updatedGrades.semester;

          if (sem) {
            const index = currentGrades.findIndex(g => g.subject === subject && g.semester === sem);
            if (index !== -1) {
              currentGrades[index] = { ...currentGrades[index], ...updatedGrades };
            } else {
              const newRecord: SubjectGrade = {
                subject,
                semester: sem,
                oral: updatedGrades.oral || [],
                m15: updatedGrades.m15 || [],
                m45: updatedGrades.m45 || [],
                final: updatedGrades.final
              };
              currentGrades.push(newRecord);
            }
          } else {
            const index = currentGrades.findIndex(g => g.subject === subject && !g.semester);
            if (index !== -1) {
              currentGrades[index] = { ...currentGrades[index], ...updatedGrades };
            } else {
              const newRecord: SubjectGrade = {
                subject,
                oral: updatedGrades.oral || [],
                m15: updatedGrades.m15 || [],
                m45: updatedGrades.m45 || [],
                final: updatedGrades.final
              };
              currentGrades.push(newRecord);
            }
          }
        });

        return {
          ...s,
          grades: currentGrades
        };
      });
    });
  };

  const handleClearAllGrades = (subject: string) => {
    setStudents(prev => prev.map(s => ({
      ...s,
      grades: s.grades.filter(g => g.subject !== subject)
    })));
  };


  // Render proper workspace tab
  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            currentUser={currentUser}
            students={students}
            announcements={announcements}
            timetable={timetable}
            dailyLessons={dailyLessons}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'announcements':
        return (
          <Announcements 
            currentUser={currentUser}
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        );
      case 'classList':
        return (
          <ClassList 
            currentUser={currentUser}
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onImportStudents={handleImportStudents}
          />
        );
      case 'timetable':
        return (
          <TimetableComponent 
            currentUser={currentUser}
            timetable={timetable}
            onUpdateTimetable={handleUpdateTimetable}
          />
        );
      case 'dailyLessons':
        return (
          <DailyLessons 
            currentUser={currentUser}
            dailyLessons={dailyLessons}
            onAddDailyLesson={handleAddDailyLesson}
            onDeleteDailyLesson={handleDeleteDailyLesson}
          />
        );
      case 'attendance':
        return (
          <Attendance 
            currentUser={currentUser}
            students={students}
            onUpdateAttendance={handleUpdateAttendance}
            onMarkAllPresent={handleMarkAllPresent}
          />
        );
      case 'tuition':
        return (
          <Tuition 
            currentUser={currentUser}
            students={students}
            onToggleTuitionPaid={handleToggleTuitionPaid}
            onToggleLunchPaid={handleToggleLunchPaid}
            onUpdateBulkTuition={handleUpdateBulkTuition}
            onUpdateBulkLunch={handleUpdateBulkLunch}
            onUpdatePaymentPromiseDate={handleUpdatePaymentPromiseDate}
            onUpdateIndividualTuition={handleUpdateIndividualTuition}
          />
        );
      case 'grades':
        return (
          <GradeTracker 
            currentUser={currentUser}
            students={students}
            onUpdateGrades={handleUpdateGrades}
            onBulkUpdateGrades={handleBulkUpdateGrades}
            onClearAllGrades={handleClearAllGrades}
          />
        );
      case 'monthlyStats':
        return (
          <MonthlyStats 
            currentUser={currentUser}
            students={students}
            onUpdateAttendance={handleUpdateAttendance}
            onToggleTuitionPaid={handleToggleTuitionPaid}
          />
        );
      default:
        return <div className="p-8 text-center text-slate-400 italic">Tính năng đang xây dựng...</div>;
    }
  };

  // If not logged in, render Login page
  if (!currentUser) {
    return (
      <Login 
        students={students}
        onLogin={handleLogin}
      />
    );
  }

  // Sidebar navigation menu options dynamically filtered
  const isStudentOrParent = currentUser.role === 'student' || currentUser.role === 'parent';

  const navItems = [
    { id: 'dashboard', name: 'Trang Chủ', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'announcements', name: 'Thông Báo GVCN', icon: Megaphone, color: 'text-amber-500' },
    ...(!isStudentOrParent ? [{ id: 'classList', name: 'Danh Sách Lớp', icon: Users, color: 'text-teal-500' }] : []),
    { id: 'timetable', name: 'Thời Khóa Biểu', icon: Calendar, color: 'text-purple-500' },
    { id: 'dailyLessons', name: 'Báo Bài', icon: ClipboardList, color: 'text-indigo-500' },
    { id: 'attendance', name: 'Điểm Danh', icon: ClipboardCheck, color: 'text-emerald-500' },
    { id: 'tuition', name: 'Học Phí', icon: DollarSign, color: 'text-orange-500' },
    { id: 'grades', name: 'Kết Quả Học Tập', icon: Award, color: 'text-red-500' },
    { id: 'monthlyStats', name: 'Thống Kê Tháng', icon: BarChart2, color: 'text-pink-500' },
  ];

  return (
    <div className="h-screen w-screen bg-slate-100 flex font-sans antialiased text-slate-800 overflow-hidden" id="main-application-wrapper">
      
      {/* Left hand Sidebar (Dark theme) */}
      <aside 
        id="nav-sidebar"
        className={`bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 z-10 flex flex-col justify-between shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="py-4 space-y-4 flex-1 flex flex-col min-h-0" id="sidebar-upper">
          {/* Quick header toggle */}
          <div className="px-4 flex items-center justify-between" id="sidebar-toggle-section">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mục quản lý</span>
            )}
            <button
              type="button"
              id="toggle-sidebar-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
              title={sidebarCollapsed ? 'Mở rộng' : 'Thu nhỏ'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="px-2 space-y-1 flex-1 overflow-y-auto" id="sidebar-navigation">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Footer inside sidebar */}
        <div className="p-4 border-t border-slate-800" id="sidebar-footer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="text-left text-xs truncate">
                <p className="font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-slate-400 text-[10px] truncate">
                  {currentUser.role === 'teacher' ? 'GVCN Lớp 12A4' : currentUser.role === 'student' ? 'Học sinh' : 'Phụ huynh'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right-hand main content panel with header and status bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden" id="main-content-panel">
        
        {/* Header sits at top of content area */}
        <Header 
          currentUser={currentUser} 
          students={students}
          onLogout={handleLogout}
          onRoleSwitch={handleRoleSwitch}
        />

        {/* Scrollable Canvas area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50" id="workspace-canvas">
          <div className="max-w-7xl mx-auto" id="workspace-container">
            {renderTabContent()}
          </div>
        </main>

        {/* Bottom Status Bar */}
        <footer className="h-8 bg-slate-800 text-[10px] text-slate-400 flex items-center px-6 justify-between shrink-0">
          <div className="flex gap-4">
            <span>Hệ thống: Hoạt động ổn định</span>
            <span>Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>© 2026 EduManage Pro v2.4</div>
        </footer>

      </div>
    </div>
  );
}
