import { Student, Announcement, TimetableDay, DailyLesson, User } from '../types';
import { 
  Users, 
  Megaphone, 
  DollarSign, 
  Calendar, 
  ClipboardList, 
  BookmarkCheck, 
  Bus, 
  GraduationCap, 
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Award,
  BarChart2
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  students: Student[];
  announcements: Announcement[];
  timetable: TimetableDay[];
  dailyLessons: DailyLesson[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ 
  currentUser, 
  students, 
  announcements, 
  timetable, 
  dailyLessons,
  onNavigate 
}: DashboardProps) {
  
  // Basic stats
  const totalStudents = students.length;
  
  const boardingStudents = students.filter(s => s.learningMode === 'Bán trú');
  const boardingCount = boardingStudents.length;
  const boardingMale = boardingStudents.filter(s => s.gender?.toLowerCase() === 'nam').length;
  const boardingFemale = boardingStudents.filter(s => s.gender?.toLowerCase() === 'nữ').length;
  
  const twoSessionStudents = students.filter(s => s.learningMode === 'Ngoại trú');
  const twoSessionCount = twoSessionStudents.length;
  const twoSessionMale = twoSessionStudents.filter(s => s.gender?.toLowerCase() === 'nam').length;
  const twoSessionFemale = twoSessionStudents.filter(s => s.gender?.toLowerCase() === 'nữ').length;

  const busRegCount = students.filter(s => s.busStatus === 'Đăng ký xe bus').length;
  const carRegCount = students.filter(s => s.busStatus === 'Đăng ký xe').length;
  const totalVehicleCount = busRegCount + carRegCount;
  
  // Tuition paid stats
  const paidCount = students.filter(s => s.tuitionPaid).length;
  const tuitionPaidPercent = totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;
  
  // Today's attendance stats (using 2026-07-11 or fallback to the latest date)
  const todayDate = '2026-07-11'; // Fixed simulated date matching ADDITIONAL_METADATA and mockData
  const todayAttendance = students.map(s => s.attendance[todayDate] || 'pending');
  const presentCount = todayAttendance.filter(a => a === 'present').length;
  const excusedCount = todayAttendance.filter(a => a === 'excused').length;
  const absentCount = todayAttendance.filter(a => a === 'absent').length;
  const pendingCount = todayAttendance.filter(a => a === 'pending').length;

  // Get current day of week to highlight timetable
  const getDayNameVietnamese = () => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const d = new Date();
    // For demo, if today is Sunday, we can fallback to Monday to show interesting schedules
    const dayIndex = d.getDay();
    return dayIndex === 0 ? 'Thứ Hai' : days[dayIndex];
  };

  const currentDayOfWeek = getDayNameVietnamese();
  const todaySchedule = timetable.find(t => t.day === currentDayOfWeek) || timetable[0];

  // Pin announcements
  const pinnedAnnouncements = announcements.filter(a => a.isPinned);
  const regularAnnouncements = announcements.filter(a => !a.isPinned);
  const displayAnnouncements = [...pinnedAnnouncements, ...regularAnnouncements].slice(0, 3);

  // Helpers for student GPA display (returns null if no grades are entered)
  const getSubjectAverage = (g: any): number | null => {
    const hasOral = g.oral && g.oral.length > 0;
    const hasM15 = g.m15 && g.m15.length > 0;
    const hasM45 = g.m45 && g.m45.length > 0;
    const hasFinal = g.final !== undefined && g.final !== null;

    if (!hasOral && !hasM15 && !hasM45 && !hasFinal) {
      return null;
    }

    const oralAvg = hasOral ? g.oral.reduce((a: number, b: number) => a + b, 0) / g.oral.length : 0;
    const m15Avg = hasM15 ? g.m15.reduce((a: number, b: number) => a + b, 0) / g.m15.length : 0;
    const m45Avg = hasM45 ? g.m45.reduce((a: number, b: number) => a + b, 0) / g.m45.length : 0;
    
    let totalWeight = 0;
    let weightedSum = 0;

    if (hasOral) { weightedSum += oralAvg * 1; totalWeight += 1; }
    if (hasM15) { weightedSum += m15Avg * 1; totalWeight += 1; }
    if (hasM45) { weightedSum += m45Avg * 2; totalWeight += 2; }
    if (hasFinal) { weightedSum += g.final * 3; totalWeight += 3; }

    return totalWeight > 0 ? weightedSum / totalWeight : null;
  };

  const getStudentGPA = (student: any): number | null => {
    if (!student || !student.grades || student.grades.length === 0) return null;
    const averages = student.grades
      .map((g: any) => getSubjectAverage(g))
      .filter((avg: any): avg is number => avg !== null);
    
    if (averages.length === 0) return null;
    return averages.reduce((a: number, b: number) => a + b, 0) / averages.length;
  };

  const isStudentOrParent = currentUser.role === 'student' || currentUser.role === 'parent';

  if (isStudentOrParent) {
    const userStudent = currentUser.studentId ? students.find(s => s.id === currentUser.studentId) : null;
    const studentObj = userStudent || students[0];
    const attendanceStatus = studentObj?.attendance[todayDate] || 'pending';
    const studentGPA = studentObj ? getStudentGPA(studentObj) : null;
    const classification = studentGPA === null ? '—' : studentGPA >= 8.0 ? 'Giỏi' : studentGPA >= 6.5 ? 'Khá' : studentGPA >= 5.0 ? 'Trung bình' : 'Yếu';

    const latestAnn = displayAnnouncements[0];
    const latestLesson = dailyLessons[0];

    const studentCards = [
      {
        id: 'announcements',
        name: 'Thông Báo GVCN',
        icon: Megaphone,
        colorClass: 'text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-300 hover:bg-amber-100/50',
        content: latestAnn ? (
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm truncate">{latestAnn.title}</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">{latestAnn.content}</p>
          </div>
        ) : "Không có thông báo mới",
        badge: latestAnn?.isPinned ? "Ghim" : undefined,
        badgeColor: "bg-amber-100 text-amber-800"
      },
      {
        id: 'timetable',
        name: 'Thời Khóa Biểu',
        icon: Calendar,
        colorClass: 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-300 hover:bg-purple-100/50',
        content: (
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm">Lịch học {currentDayOfWeek}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {todaySchedule?.periods.map(p => p.subject).filter(s => s !== 'Nghỉ').join(' • ') || 'Nghỉ học'}
            </p>
          </div>
        )
      },
      {
        id: 'dailyLessons',
        name: 'Báo Bài',
        icon: ClipboardList,
        colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100/50',
        content: latestLesson ? (
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm">Bài vở ngày {latestLesson.date}</p>
            <p className="text-[11px] text-slate-500 truncate">
              Dặn dò: {latestLesson.lessons.map(l => l.homework).join(' • ')}
            </p>
          </div>
        ) : "Chưa có dặn dò mới"
      },
      {
        id: 'attendance',
        name: 'Điểm Danh',
        icon: CheckCircle,
        colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/50',
        content: (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Trạng thái:</span>
            {attendanceStatus === 'present' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Có mặt</span>
            )}
            {attendanceStatus === 'excused' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Nghỉ phép</span>
            )}
            {attendanceStatus === 'absent' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Vắng không phép</span>
            )}
            {attendanceStatus === 'pending' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Chưa cập nhật</span>
            )}
          </div>
        )
      },
      {
        id: 'grades',
        name: 'Kết Quả Học Tập',
        icon: Award,
        colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-100/50',
        content: (
          <div className="flex justify-between items-center mt-1 border-indigo-100">
            <span className="text-[11px] text-slate-500">GPA của em:</span>
            <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
              studentGPA === null 
                ? 'bg-slate-100 text-slate-500' 
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              {studentGPA === null ? '—' : studentGPA.toFixed(2)} ({classification})
            </span>
          </div>
        )
      },
      {
        id: 'monthlyStats',
        name: 'Thống Kê Tổng Hợp',
        icon: BarChart2,
        colorClass: 'text-pink-600 bg-pink-50 border-pink-100 hover:border-pink-300 hover:bg-pink-100/50',
        content: (
          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm">Thống kê Tháng</p>
            <p className="text-[11px] text-slate-500">Biểu đồ chuyên cần & học lực</p>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-6" id="dashboard-tab-student">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden" id="welcome-banner">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none" id="welcome-banner-bg">
            <GraduationCap className="w-64 h-64" />
          </div>
          <div className="relative z-10 space-y-2" id="welcome-banner-content">
            <span className="bg-indigo-500/40 text-indigo-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-400" id="welcome-class-badge">
              Niên khóa 2025 - 2026
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display" id="welcome-title">
              Chào mừng quay lại, {currentUser.name}!
            </h2>
            <p className="text-sm text-indigo-100 max-w-xl" id="welcome-description">
              Dưới đây là các cổng thông tin học tập của em. Hãy chọn một thẻ tiện ích để bắt đầu truy cập chi tiết.
            </p>
          </div>
        </div>

        {/* 6 Grid Cards */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pl-1">Cổng dịch vụ học sinh 12A4</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="student-cards-grid">
            {studentCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => onNavigate(card.id)}
                  className={`p-5 rounded-2xl border bg-white shadow-xs cursor-pointer flex flex-col justify-between min-h-[140px] transition-all duration-300 group ${card.colorClass}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white shadow-xs group-hover:scale-105 transition-transform duration-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-800 group-hover:text-slate-900 transition-colors">{card.name}</span>
                    </div>
                    {card.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100/60 text-xs text-slate-500 flex-1 flex flex-col justify-end">
                    {typeof card.content === 'string' ? (
                      <p className="italic text-slate-400 font-medium">{card.content}</p>
                    ) : (
                      card.content
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Helpful Tips Block */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-slate-700">
            <BookmarkCheck className="h-4 w-4 text-indigo-600" />
            Lưu ý dành cho Học sinh lớp 12A4:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Xem lại dặn dò, ghi nhớ và nộp bài trong phần <b>Báo bài</b> thường xuyên.</li>
            <li>Kiểm tra thông tin điểm số môn thi thử học kỳ trực tiếp trong phần <b>Kết quả học tập</b>.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden" id="welcome-banner">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none" id="welcome-banner-bg">
          <GraduationCap className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2" id="welcome-banner-content">
          <span className="bg-blue-500/40 text-blue-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border" style={{ borderColor: '#fef9db' }} id="welcome-class-badge">
            Niên khóa 2025 - 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display" id="welcome-title">
            Chào mừng quay lại, {currentUser.name}!
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl" id="welcome-description">
            {currentUser.role === 'teacher' && 'Đây là bảng điều khiển quản lý lớp 12A4 của bạn. Bạn có thể điểm danh, chấm điểm, nộp thông báo hoặc duyệt đóng học phí.'}
            {currentUser.role === 'student' && 'Dưới đây là thông tin học tập, bài tập trực tuyến, thời khóa biểu và học phí của bạn.'}
            {currentUser.role === 'parent' && 'Xem lịch trình học tập, trạng thái điểm danh hôm nay, báo bài và học phí của con em mình.'}
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {/* Stat 1: Sĩ số */}
        <div 
          onClick={() => onNavigate('classList')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-all group"
          id="stat-total-students"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sĩ số lớp 12A4</span>
            <div className="p-2 bg-slate-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <h3 className="text-3xl font-extrabold font-display text-slate-900">{totalStudents} <span className="text-xs font-semibold text-slate-400">học sinh</span></h3>
            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold text-slate-700">Bán trú ({boardingCount}):</span>
                <span className="text-slate-500 font-medium">{boardingMale} Nam • {boardingFemale} Nữ</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold text-slate-700">Hai buổi ({twoSessionCount}):</span>
                <span className="text-slate-500 font-medium">{twoSessionMale} Nam • {twoSessionFemale} Nữ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat 2: Điểm danh hôm nay (Themed Dark Indigo Card with Circular Progress SVG) */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-indigo-950 text-white p-5 rounded-xl border border-indigo-900 shadow-sm flex flex-col justify-between cursor-pointer hover:bg-indigo-900 transition-all group"
          id="stat-attendance"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Điểm danh (11/07)</span>
            <div className="p-2 bg-indigo-900 text-indigo-300 rounded-lg group-hover:bg-indigo-800 transition-all">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-3xl font-extrabold font-display text-white">
                {presentCount + excusedCount}/{totalStudents}
              </h3>
              <p className="text-[10px] text-indigo-300 font-medium mt-1">
                Có mặt: {presentCount} • Phép: {excusedCount} • Vắng: {absentCount}
              </p>
            </div>
            {/* Beautiful circle SVG */}
            <div className="relative flex items-center justify-center w-12 h-12 shrink-0" id="attendance-circular-progress">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.15)" strokeWidth="3" fill="transparent" />
                <circle cx="24" cy="24" r="20" stroke="#818cf8" strokeWidth="3" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - (totalStudents > 0 ? (presentCount + excusedCount) / totalStudents : 0))} fill="transparent" />
              </svg>
              <span className="absolute text-[9px] font-bold text-white">
                {totalStudents > 0 ? Math.round(((presentCount + excusedCount) / totalStudents) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Học phí */}
        <div 
          onClick={() => onNavigate('tuition')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-all group"
          id="stat-tuition"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học phí tháng 7</span>
            <div className="p-2 bg-slate-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-display text-slate-900">{tuitionPaidPercent}%</h3>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${tuitionPaidPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Đã nộp: {paidCount} em • Chưa nộp: {totalStudents - paidCount} em
            </p>
          </div>
        </div>

        {/* Stat 4: Đăng kí xe */}
        <div 
          onClick={() => onNavigate('classList')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-all group"
          id="stat-bus"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đăng kí xe</span>
            <div className="p-2 bg-slate-100 text-indigo-500 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold font-display text-slate-900">{totalVehicleCount} <span className="text-xs font-semibold text-slate-400">em</span></h3>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
              Xe bus: <span className="font-bold text-indigo-600">{busRegCount}</span> • Xe cá nhân: <span className="font-bold text-teal-600">{carRegCount}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Tự túc: {totalStudents - totalVehicleCount} em
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-main-sections">
        
        {/* Left Column (2 cols wide on large screens) */}
        <div className="lg:col-span-2 space-y-6" id="dashboard-left-col">
          
          {/* Announcements block */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="dashboard-announcements-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Megaphone className="text-indigo-600 h-5 w-5 shrink-0" />
                Thông Báo Mới Nhất Từ Giáo Viên
              </h3>
              <button 
                type="button" 
                onClick={() => onNavigate('announcements')} 
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Xem tất cả &rarr;
              </button>
            </div>
            <div className="space-y-4" id="dashboard-announcements-list">
              {displayAnnouncements.map((ann) => (
                <div 
                  key={ann.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    ann.isPinned 
                      ? 'bg-amber-50/60 border-amber-200 shadow-sm' 
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-400">{ann.date}</span>
                    {ann.isPinned && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase">
                        Ghim
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base">{ann.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">Đăng bởi: {ann.author}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily lessons (Báo bài) preview */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="dashboard-daily-lessons-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <ClipboardList className="text-indigo-600 h-5 w-5 shrink-0" />
                Báo Bài Hôm Nay & Ngày Mai
              </h3>
              <button 
                type="button" 
                onClick={() => onNavigate('dailyLessons')} 
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Xem chi tiết &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="dashboard-lessons-preview-grid">
              {dailyLessons.slice(0, 2).map((lesson) => (
                <div key={lesson.id} className="p-4 bg-slate-50/50 rounded-lg border border-slate-200" id={`lesson-card-${lesson.id}`}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">Ngày học: {lesson.date}</span>
                  </div>
                  <div className="space-y-3">
                    {lesson.lessons.map((l, index) => (
                      <div key={index} className="border-l-2 border-indigo-200 pl-2.5">
                        <p className="text-xs font-bold text-slate-800">{l.subject}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">Bài học: {l.content}</p>
                        <p className="text-[11px] text-indigo-600 font-semibold line-clamp-1">Dặn dò: {l.homework}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {dailyLessons.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center col-span-2 py-4">Chưa có báo bài đăng nào.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1 col wide on large screens) */}
        <div className="space-y-6" id="dashboard-right-col">
          
          {/* Schedule of the Day */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id="dashboard-schedule-box">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Calendar className="text-indigo-600 h-5 w-5 shrink-0" />
                Thời Khóa Biểu ({currentDayOfWeek})
              </h3>
              <button 
                type="button" 
                onClick={() => onNavigate('timetable')} 
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Cả tuần &rarr;
              </button>
            </div>
            
            <div className="space-y-3" id="dashboard-schedule-periods">
              {todaySchedule?.periods.map((p, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                    p.subject === 'Nghỉ' 
                      ? 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400' 
                      : 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-200 transition-colors'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                      {p.period}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800">{p.subject}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 inline" /> {p.time}
                      </p>
                    </div>
                  </div>
                  {p.teacher && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {p.teacher}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Tips based on Role */}
          <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200" id="dashboard-roles-tips">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <BookmarkCheck className="text-indigo-600 h-4 w-4" />
              Góc thông tin tiện ích
            </h3>
            {currentUser.role === 'teacher' && (
              <div className="text-xs text-slate-600 space-y-2">
                <p>💡 <b>Lưu ý dành cho Giáo viên chủ nhiệm:</b></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Sử dụng chức năng <b>Điểm danh</b> hàng ngày để phụ huynh nắm bắt thông tin chuyên cần.</li>
                  <li>Cập nhật điểm trong <b>Kết quả học tập</b> để tự động tính điểm trung bình cả lớp.</li>
                  <li>Bấm nút <b>Xuất file Excel</b> ở các mục dữ liệu để tải báo cáo trực tiếp về máy.</li>
                </ul>
              </div>
            )}
            {currentUser.role === 'student' && (
              <div className="text-xs text-slate-600 space-y-2">
                <p>💡 <b>Lưu ý dành cho Học sinh:</b></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Kiểm tra phần <b>Báo bài</b> thường xuyên để cập nhật dặn dò và bài tập tự học.</li>
                  <li>Nếu có <b>Đăng kí xe</b> hoặc đi xe bus trường, hãy lưu ý tuân thủ đúng nội quy giao thông và ra đúng giờ đưa đón.</li>
                  <li>Xem kết quả học tập của cá nhân được GVCN nhập trực tiếp trong mục kết quả học tập.</li>
                </ul>
              </div>
            )}
            {currentUser.role === 'parent' && (
              <div className="text-xs text-slate-600 space-y-2">
                <p>💡 <b>Lưu ý dành cho Phụ huynh:</b></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Trực tiếp kiểm tra tình trạng <b>Điểm danh</b> của con mỗi ngày để an tâm khi gửi con đến trường.</li>
                  <li>Xem trạng thái <b>Học phí</b> của con và thực hiện mô phỏng thanh toán trực tuyến nhanh chóng.</li>
                  <li>Theo sát kết quả thi thử và điểm số định kỳ của con tại mục <b>Kết quả học tập</b>.</li>
                </ul>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
