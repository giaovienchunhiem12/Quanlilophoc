import React, { useState, useEffect } from 'react';
import { Student, User } from '../types';
import { exportAttendanceToExcel } from '../utils/excelExport';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Download, 
  ClipboardCheck, 
  FileCheck,
  UserCheck,
  BarChart2,
  Printer
} from 'lucide-react';

interface AttendanceProps {
  currentUser: User;
  students: Student[];
  onUpdateAttendance: (studentId: string, date: string, status: 'present' | 'late' | 'excused' | 'absent' | 'pending') => void;
  onMarkAllPresent?: (date: string) => void;
}

export default function Attendance({ currentUser, students, onUpdateAttendance, onMarkAllPresent }: AttendanceProps) {
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString()); // Default to current date
  const [selectedMonthlyStatsMonth, setSelectedMonthlyStatsMonth] = useState<string>(() => {
    return getTodayString().substring(0, 7); // Default to current month, e.g., '2026-07'
  });

  // When a new date is selected, if no student has attendance for this date yet,
  // automatically mark all as 'present'.
  useEffect(() => {
    if (currentUser.role === 'teacher' && onMarkAllPresent && students.length > 0) {
      const hasAnyAttendance = students.some(s => s.attendance && s.attendance[selectedDate] !== undefined);
      if (!hasAnyAttendance) {
        onMarkAllPresent(selectedDate);
      }
    }
  }, [selectedDate, students, currentUser.role, onMarkAllPresent]);

  // Available dates for log history selection (derived from all students)
  const availableDates = Array.from(new Set(
    students.flatMap(s => Object.keys(s.attendance || {}))
  )).sort((a, b) => b.localeCompare(a));

  const isStudentOrParent = currentUser.role === 'student' || currentUser.role === 'parent';
  const userStudent = currentUser.studentId ? students.find(s => s.id === currentUser.studentId) : null;
  const displayedStudents = isStudentOrParent
    ? (userStudent ? [userStudent] : (students.length > 0 ? [students[0]] : []))
    : students;

  // Stats calculation for the selected date
  const studentsOnDate = displayedStudents.map(s => ({
    id: s.id,
    name: s.name,
    status: s.attendance[selectedDate] || 'pending'
  }));

  const presentCount = studentsOnDate.filter(s => s.status === 'present').length;
  const lateCount = studentsOnDate.filter(s => s.status === 'late').length;
  const excusedCount = studentsOnDate.filter(s => s.status === 'excused').length;
  const absentCount = studentsOnDate.filter(s => s.status === 'absent').length;
  const pendingCount = studentsOnDate.filter(s => s.status === 'pending').length;

  const totalCount = displayedStudents.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount + excusedCount) / totalCount) * 100) : 0;

  const handlePrintMonthly = () => {
    if (!userStudent) return;
    const currentMonthStr = selectedMonthlyStatsMonth;
    const [yearStr, monthStr] = currentMonthStr.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const monthlyDates = availableDates.filter(d => d.startsWith(currentMonthStr));
    const mStats = {
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      total: 0
    };

    monthlyDates.forEach(date => {
      const status = userStudent.attendance[date];
      if (status) {
        mStats.total++;
        if (status === 'present') mStats.present++;
        else if (status === 'late') mStats.late++;
        else if (status === 'excused') mStats.excused++;
        else if (status === 'absent') mStats.absent++;
      }
    });

    const mRate = mStats.total > 0 
      ? Math.round(((mStats.present + mStats.late + mStats.excused) / mStats.total) * 100) 
      : 0;

    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday, 1 is Monday...
    const emptyCellsBefore = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysCount = new Date(year, month, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < emptyCellsBefore; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysCount; d++) {
      cells.push(d);
    }
    const totalCells = Math.ceil(cells.length / 7) * 7;
    while (cells.length < totalCells) {
      cells.push(null);
    }

    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    const todayStr = getTodayString();

    const rowsHtml = rows.map((row) => {
      const cellsHtml = row.map((dayNum, cIdx) => {
        if (dayNum === null) {
          return `<td style="height: 55px; background-color: #f8fafc; border: 1px solid #cbd5e1;"></td>`;
        }
        const dayStr = String(dayNum).padStart(2, '0');
        const dateStr = `${currentMonthStr}-${dayStr}`;
        const status = userStudent.attendance[dateStr];
        const isFuture = dateStr > todayStr;

        let bgStyle = "background-color: #ffffff; color: #334155;";
        let badgeText = "";
        let badgeStyle = "";

        if (isFuture) {
          bgStyle = "background-color: #f8fafc; color: #cbd5e1;";
        } else if (status === 'present') {
          bgStyle = "background-color: #f0fdf4; color: #14532d;";
          badgeText = "Có mặt";
          badgeStyle = "background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; font-weight: bold;";
        } else if (status === 'late') {
          bgStyle = "background-color: #fffbeb; color: #78350f;";
          badgeText = "Đi trễ";
          badgeStyle = "background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: bold;";
        } else if (status === 'excused') {
          bgStyle = "background-color: #eff6ff; color: #1e3a8a;";
          badgeText = "Có phép";
          badgeStyle = "background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; font-weight: bold;";
        } else if (status === 'absent') {
          bgStyle = "background-color: #fff1f2; color: #881337;";
          badgeText = "Vắng KP";
          badgeStyle = "background-color: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; font-weight: bold;";
        } else {
          badgeText = cIdx === 6 ? "Chủ Nhật" : "Không học";
          badgeStyle = "color: #94a3b8; font-style: italic;";
        }

        const isSunday = cIdx === 6;
        const dayNumColor = isSunday && !status && !isFuture ? '#e11d48' : isFuture ? '#94a3b8' : '#475569';

        return `
          <td style="height: 55px; padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; ${bgStyle}">
            <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: bold;">
                <span style="color: ${dayNumColor};">${dayNum}</span>
                ${status ? `<span style="font-size: 8px; color: #94a3b8; font-family: monospace;">${dayStr}/${monthStr}</span>` : ''}
              </div>
              <div style="text-align: center; margin-top: 4px;">
                ${badgeText ? `<span style="display: inline-block; padding: 2px 5px; font-size: 9px; border-radius: 4px; ${badgeStyle}">${badgeText}</span>` : ''}
              </div>
            </div>
          </td>
        `;
      }).join('');
      return `<tr>${cellsHtml}</tr>`;
    }).join('');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <title>Báo Cáo Điểm Danh Tổng Hợp Tháng ${monthStr}/${yearStr} - ${userStudent.name}</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1e293b;
              padding: 24px;
              background: #ffffff;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #cbd5e1;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 20px;
              text-transform: uppercase;
              margin: 0;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .header p {
              font-size: 13px;
              color: #475569;
              margin: 4px 0 0 0;
            }
            .stats-grid {
              display: grid;
              grid-template-cols: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              text-align: center;
            }
            .stat-card.present { background-color: #f0fdf4; border-color: #bbf7d0; }
            .stat-card.late { background-color: #fffbeb; border-color: #fde68a; }
            .stat-card.excused { background-color: #eff6ff; border-color: #bfdbfe; }
            .stat-card.absent { background-color: #fff1f2; border-color: #fecdd3; }
            
            .stat-card span {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stat-card .value {
              font-size: 16px;
              font-weight: bold;
              margin-top: 4px;
            }
            .stat-card.present span { color: #166534; }
            .stat-card.present .value { color: #14532d; }
            .stat-card.late span { color: #92400e; }
            .stat-card.late .value { color: #78350f; }
            .stat-card.excused span { color: #1e40af; }
            .stat-card.excused .value { color: #1e3a8a; }
            .stat-card.absent span { color: #9f1239; }
            .stat-card.absent .value { color: #881337; }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 8px;
              font-size: 11px;
              font-weight: bold;
              text-align: center;
            }
            .footer-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              font-size: 12px;
              margin-bottom: 30px;
            }
            .rate-label { font-weight: bold; }
            .rate-value { font-size: 16px; font-weight: bold; color: #4f46e5; }
            
            .signatures {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 40px;
              text-align: center;
              font-size: 13px;
              margin-top: 40px;
            }
            .signatures .col {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .signatures .date {
              font-style: italic;
              color: #64748b;
              margin-bottom: 6px;
            }
            .signatures .title {
              font-weight: bold;
              color: #334155;
            }
            .signatures .space {
              margin-top: 50px;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sổ Điểm Danh Chuyên Cần Tổng Hợp Tháng ${monthStr}/${yearStr}</h1>
            <p>Học sinh: <strong>${userStudent.name}</strong> &nbsp;•&nbsp; Lớp: <strong>12A4</strong></p>
          </div>

          <div class="stats-grid">
            <div class="stat-card present">
              <span>Đúng giờ</span>
              <div class="value">${mStats.present} ngày</div>
            </div>
            <div class="stat-card late">
              <span>Đi học muộn</span>
              <div class="value">${mStats.late} ngày</div>
            </div>
            <div class="stat-card excused">
              <span>Vắng có phép</span>
              <div class="value">${mStats.excused} ngày</div>
            </div>
            <div class="stat-card absent">
              <span>Vắng không phép</span>
              <div class="value">${mStats.absent} ngày</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 14.28%;">Thứ Hai</th>
                <th style="width: 14.28%;">Thứ Ba</th>
                <th style="width: 14.28%;">Thứ Tư</th>
                <th style="width: 14.28%;">Thứ Năm</th>
                <th style="width: 14.28%;">Thứ Sáu</th>
                <th style="width: 14.28%;">Thứ Bảy</th>
                <th style="width: 14.28%; color: #e11d48;">Chủ Nhật</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-info">
            <div>
              <span class="rate-label">Tỷ lệ chuyên cần tháng:</span>
              <span style="color: #64748b; margin-left: 6px;">(Tính trên tổng số ngày thực tế nhà trường tổ chức học)</span>
            </div>
            <div class="rate-value">${mRate}%</div>
          </div>

          <div class="signatures">
            <div class="col">
              <div class="date">Ngày ..... tháng ..... năm 2026</div>
              <div class="title">Ý kiến Phụ huynh học sinh</div>
              <div class="space">(Ký và ghi rõ họ tên)</div>
            </div>
            <div class="col">
              <div class="date">Ngày ..... tháng ..... năm 2026</div>
              <div class="title">Giáo viên chủ nhiệm</div>
              <div class="space">(Ký và ghi rõ họ tên)</div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 400);
  };

  return (
    <div className="space-y-6" id="attendance-tab">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="attendance-header-section">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-indigo-600" />
            Điểm Danh Hàng Ngày
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận học sinh có mặt, vắng mặt có phép hoặc vắng mặt không phép định kỳ theo ngày học
          </p>
        </div>

        {!isStudentOrParent && (
          <button
            type="button"
            id="export-attendance-btn"
            onClick={() => exportAttendanceToExcel(students, availableDates, '12A4')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <Download className="h-4 w-4 text-indigo-500" />
            Xuất Sổ Điểm Danh Excel
          </button>
        )}
      </div>

      {/* Date Selector and Stat widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="attendance-stats-wrapper">
        
        {/* Date choosing form card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 lg:col-span-1" id="attendance-date-card">
          <label htmlFor="select-date-attendance" className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Ngày điểm danh
          </label>
          <input
            type="date"
            id="select-date-attendance"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm font-semibold text-slate-700 focus:outline-indigo-500"
          />
          <div className="text-[10px] text-slate-400 mt-2 font-medium">
            * Chọn để thay đổi ngày kiểm tra lịch sử điểm danh.
          </div>
        </div>

        {/* Present counts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 lg:col-span-1" id="box-present">
          <div className="p-3 bg-slate-100 text-emerald-600 rounded-lg border border-slate-200">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Có mặt / Đi trễ</p>
            <h3 className="text-2xl font-bold font-display text-slate-950 mt-0.5">
              {presentCount} <span className="text-slate-300">/</span> <span className="text-amber-500 font-extrabold">{lateCount}</span>
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium">Có mặt: {presentCount} • Đi trễ: {lateCount}</p>
          </div>
        </div>

        {/* Excused / Absent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 lg:col-span-1" id="box-excused">
          <div className="p-3 bg-slate-100 text-amber-600 rounded-lg border border-slate-200">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phép / Không phép</p>
            <h3 className="text-2xl font-bold font-display text-slate-950 mt-0.5">
              {excusedCount} <span className="text-slate-300">/</span> {absentCount}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Phép: <span className="text-amber-600 font-bold">{excusedCount}</span> • Không: <span className="text-rose-600 font-bold">{absentCount}</span>
            </p>
          </div>
        </div>

        {/* Rate percent */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 lg:col-span-1" id="box-rate">
          <div className="p-3 bg-slate-100 text-indigo-600 rounded-lg border border-slate-200">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Chuyên Cần</p>
            <h3 className="text-2xl font-bold font-display text-slate-950 mt-0.5">{attendanceRate}%</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Đạt yêu cầu thi đua của trường</p>
          </div>
        </div>

      </div>

      {/* Role view: Individual student/parent checking history */}
      {userStudent && (
        <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100 shadow-sm space-y-3" id="personal-attendance-history">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <UserCheck className="h-4.5 w-4.5 text-indigo-600" />
            Lịch Sử Điểm Danh Cá Nhân ({userStudent.name})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3" id="personal-days-grid">
            {availableDates.map(date => {
              const status = userStudent.attendance[date];
              return (
                <div 
                  key={date} 
                  className={`p-3 rounded-lg border text-center space-y-1 bg-white shadow-sm ${
                    status === 'present' ? 'border-emerald-200' :
                    status === 'late' ? 'border-amber-100 bg-amber-50/20' :
                    status === 'excused' ? 'border-amber-200' :
                    status === 'absent' ? 'border-rose-200 animate-pulse' : 'border-slate-200'
                  }`}
                >
                  <p className="text-[9px] font-mono text-slate-400 font-semibold">{date.substring(5)}</p>
                  <p className="text-xs font-bold">
                    {status === 'present' && <span className="text-emerald-700">Có mặt ✅</span>}
                    {status === 'late' && <span className="text-amber-600">Đi trễ ⏰</span>}
                    {status === 'excused' && <span className="text-amber-700">Xin phép 📝</span>}
                    {status === 'absent' && <span className="text-rose-700">Vắng mặt ❌</span>}
                    {!status && <span className="text-slate-400">N/A</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main checklist table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="attendance-table-container">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50" id="attendance-table-header">
          <h3 className="font-bold text-slate-900 font-display text-sm uppercase tracking-wider">Điểm Danh Lớp Ngày {selectedDate}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.role === 'teacher' 
              ? 'Tích chọn trực tiếp để cập nhật tình trạng điểm danh của học sinh trong ngày.' 
              : 'Phụ huynh và học sinh có thể theo dõi trực quan trạng thái điểm danh.'}
          </p>
        </div>

        <div className="overflow-x-auto" id="attendance-table-wrapper">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">STT</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mã Học Sinh</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Học Sinh</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Có mặt</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Đi trễ</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Vắng có phép</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Vắng KHÔNG phép</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
              {displayedStudents.map((student, idx) => {
                const status = student.attendance[selectedDate] || 'pending';
                
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors" id={`attendance-row-${student.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-500">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{student.name}</td>
                    
                    {/* Check Present */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="radio"
                        id={`attend-pres-${student.id}`}
                        name={`attend-status-${student.id}`}
                        checked={status === 'present'}
                        disabled={currentUser.role !== 'teacher'}
                        onChange={() => onUpdateAttendance(student.id, selectedDate, 'present')}
                        onClick={(e) => {
                          if (status === 'present' && currentUser.role === 'teacher') {
                            e.preventDefault();
                            onUpdateAttendance(student.id, selectedDate, 'pending');
                          }
                        }}
                        className={`h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded-full ${
                          currentUser.role === 'teacher' ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      />
                    </td>

                    {/* Check Late */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="radio"
                        id={`attend-late-${student.id}`}
                        name={`attend-status-${student.id}`}
                        checked={status === 'late'}
                        disabled={currentUser.role !== 'teacher'}
                        onChange={() => onUpdateAttendance(student.id, selectedDate, 'late')}
                        onClick={(e) => {
                          if (status === 'late' && currentUser.role === 'teacher') {
                            e.preventDefault();
                            onUpdateAttendance(student.id, selectedDate, 'pending');
                          }
                        }}
                        className={`h-4.5 w-4.5 text-amber-500 focus:ring-amber-400 border-slate-300 rounded-full ${
                          currentUser.role === 'teacher' ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      />
                    </td>

                    {/* Check Excused */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="radio"
                        id={`attend-excu-${student.id}`}
                        name={`attend-status-${student.id}`}
                        checked={status === 'excused'}
                        disabled={currentUser.role !== 'teacher'}
                        onChange={() => onUpdateAttendance(student.id, selectedDate, 'excused')}
                        onClick={(e) => {
                          if (status === 'excused' && currentUser.role === 'teacher') {
                            e.preventDefault();
                            onUpdateAttendance(student.id, selectedDate, 'pending');
                          }
                        }}
                        className={`h-4.5 w-4.5 text-amber-600 focus:ring-amber-500 border-slate-300 rounded-full ${
                          currentUser.role === 'teacher' ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      />
                    </td>

                    {/* Check Absent */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="radio"
                        id={`attend-abse-${student.id}`}
                        name={`attend-status-${student.id}`}
                        checked={status === 'absent'}
                        disabled={currentUser.role !== 'teacher'}
                        onChange={() => onUpdateAttendance(student.id, selectedDate, 'absent')}
                        onClick={(e) => {
                          if (status === 'absent' && currentUser.role === 'teacher') {
                            e.preventDefault();
                            onUpdateAttendance(student.id, selectedDate, 'pending');
                          }
                        }}
                        className={`h-4.5 w-4.5 text-rose-600 focus:ring-rose-500 border-slate-300 rounded-full ${
                          currentUser.role === 'teacher' ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      />
                    </td>

                    {/* Badge Status */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {status === 'present' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold border border-emerald-100">
                          <CheckCircle className="h-3 w-3" /> Có mặt
                        </span>
                      )}
                      {status === 'late' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg font-semibold border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Đi trễ
                        </span>
                      )}
                      {status === 'excused' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-semibold border border-amber-100">
                          <AlertCircle className="h-3 w-3" /> Vắng có phép
                        </span>
                      )}
                      {status === 'absent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-semibold border border-rose-100">
                          <XCircle className="h-3 w-3" /> Vắng không phép
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg font-medium border border-slate-200 italic">
                          Chưa điểm danh
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary Statistics (Only for Student/Parent View) */}
      {isStudentOrParent && userStudent && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="monthly-attendance-summary">
          <div className="p-5 border-b border-slate-200 bg-indigo-50/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 font-display text-sm uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
                Thống Kê Chuyên Cần Tổng Hợp (Tháng {selectedMonthlyStatsMonth.substring(5, 7)}/{selectedMonthlyStatsMonth.substring(0, 4)})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dữ liệu điểm danh chi tiết theo tuần (từ Thứ 2 đến Chủ nhật) của học sinh {userStudent.name} trong tháng.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-sm">
                <span className="text-xs font-bold text-slate-500">Tháng:</span>
                <select
                  value={selectedMonthlyStatsMonth}
                  onChange={(e) => setSelectedMonthlyStatsMonth(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="2026-07">Tháng 07/2026</option>
                  <option value="2026-08">Tháng 08/2026</option>
                  <option value="2026-09">Tháng 09/2026</option>
                  <option value="2026-10">Tháng 10/2026</option>
                  <option value="2026-11">Tháng 11/2026</option>
                  <option value="2026-12">Tháng 12/2026</option>
                  <option value="2027-01">Tháng 01/2027</option>
                  <option value="2027-02">Tháng 02/2027</option>
                  <option value="2027-03">Tháng 03/2027</option>
                  <option value="2027-04">Tháng 04/2027</option>
                  <option value="2027-05">Tháng 05/2027</option>
                  <option value="2027-06">Tháng 06/2027</option>
                </select>
              </div>
              <button
                onClick={handlePrintMonthly}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all duration-150 active:scale-95 shrink-0"
                title="In báo cáo chi tiết tháng mẫu chuẩn"
              >
                <Printer className="h-4 w-4" />
                <span>In Báo Cáo Chuyên Cần</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {(() => {
              const currentMonthStr = selectedMonthlyStatsMonth;
              const [yearStr, monthStr] = currentMonthStr.split('-');
              const year = parseInt(yearStr);
              const month = parseInt(monthStr);

              // Calculate monthly stats
              const monthlyDates = availableDates.filter(d => d.startsWith(currentMonthStr));
              const mStats = {
                present: 0,
                late: 0,
                excused: 0,
                absent: 0,
                total: 0
              };

              monthlyDates.forEach(date => {
                const status = userStudent.attendance[date];
                if (status) {
                  mStats.total++;
                  if (status === 'present') mStats.present++;
                  else if (status === 'late') mStats.late++;
                  else if (status === 'excused') mStats.excused++;
                  else if (status === 'absent') mStats.absent++;
                }
              });

              const mRate = mStats.total > 0 
                ? Math.round(((mStats.present + mStats.late + mStats.excused) / mStats.total) * 100) 
                : 0;

              // Generate calendar cells (Monday to Sunday)
              const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday, 1 is Monday...
              const emptyCellsBefore = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
              const daysCount = new Date(year, month, 0).getDate();

              const cells: (number | null)[] = [];
              for (let i = 0; i < emptyCellsBefore; i++) {
                cells.push(null);
              }
              for (let d = 1; d <= daysCount; d++) {
                cells.push(d);
              }
              const totalCells = Math.ceil(cells.length / 7) * 7;
              while (cells.length < totalCells) {
                cells.push(null);
              }

              const rows: (number | null)[][] = [];
              for (let i = 0; i < cells.length; i += 7) {
                rows.push(cells.slice(i, i + 7));
              }

              return (
                <div className="space-y-6">
                  {/* Summary Badges Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đi học đúng giờ</span>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-xl font-black text-emerald-700">{mStats.present}</span>
                        <span className="text-xs text-emerald-600 font-bold mb-0.5">ngày</span>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Đi học muộn</span>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-xl font-black text-amber-700">{mStats.late}</span>
                        <span className="text-xs text-amber-600 font-bold mb-0.5">ngày</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Vắng có phép</span>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-xl font-black text-blue-700">{mStats.excused}</span>
                        <span className="text-xs text-blue-600 font-bold mb-0.5">ngày</span>
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex flex-col justify-between shadow-sm">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Vắng không phép</span>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-xl font-black text-rose-700">{mStats.absent}</span>
                        <span className="text-xs text-rose-600 font-bold mb-0.5">ngày</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Grid Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse table-fixed min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-100/85 border-b border-slate-200">
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-slate-700 border-r border-slate-200 select-none">Thứ Hai</th>
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-slate-700 border-r border-slate-200 select-none">Thứ Ba</th>
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-slate-700 border-r border-slate-200 select-none">Thứ Tư</th>
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-slate-700 border-r border-slate-200 select-none">Thứ Năm</th>
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-slate-700 border-r border-slate-200 select-none">Thứ Sáu</th>
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-slate-700 border-r border-slate-200 select-none">Thứ Bảy</th>
                            <th className="py-2.5 px-2 text-center text-xs font-bold text-rose-600 select-none">Chủ Nhật</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, rIdx) => (
                            <tr key={`row-${rIdx}`} className="border-b border-slate-200 last:border-b-0">
                              {row.map((dayNum, cIdx) => {
                                if (dayNum === null) {
                                  return (
                                    <td 
                                      key={`empty-${rIdx}-${cIdx}`} 
                                      className="h-20 bg-slate-50/40 border-r border-slate-200 last:border-r-0"
                                    />
                                  );
                                }

                                const dayStr = String(dayNum).padStart(2, '0');
                                const dateStr = `${currentMonthStr}-${dayStr}`;
                                const status = userStudent.attendance[dateStr];

                                const todayStr = getTodayString();
                                const isFuture = dateStr > todayStr;

                                let bgClass = "bg-white hover:bg-slate-50 text-slate-700";
                                let statusBadge = null;

                                if (isFuture) {
                                  bgClass = "bg-slate-50/20 text-slate-300";
                                } else if (status === 'present') {
                                  bgClass = "bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-950 border border-emerald-100";
                                  statusBadge = (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700">
                                      <CheckCircle className="h-3 w-3" />
                                      Có mặt
                                    </span>
                                  );
                                } else if (status === 'late') {
                                  bgClass = "bg-amber-50/80 hover:bg-amber-100/80 text-amber-950 border border-amber-100";
                                  statusBadge = (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700">
                                      ⏰ Đi trễ
                                    </span>
                                  );
                                } else if (status === 'excused') {
                                  bgClass = "bg-blue-50/80 hover:bg-blue-100/80 text-blue-950 border border-blue-100";
                                  statusBadge = (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700">
                                      📝 Có phép
                                    </span>
                                  );
                                } else if (status === 'absent') {
                                  bgClass = "bg-rose-50/80 hover:bg-rose-100/80 text-rose-950 border border-rose-100";
                                  statusBadge = (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700">
                                      <XCircle className="h-3 w-3" />
                                      Vắng KP
                                    </span>
                                  );
                                }

                                const isSunday = cIdx === 6;

                                return (
                                  <td 
                                    key={`day-${dayNum}`} 
                                    className={`h-20 p-2 border-r border-slate-200 last:border-r-0 transition-colors duration-150 align-top ${bgClass}`}
                                  >
                                    <div className="flex flex-col h-full justify-between">
                                      <div className="flex justify-between items-center">
                                        <span className={`text-xs font-extrabold ${isSunday && !status && !isFuture ? 'text-rose-500' : isFuture ? 'text-slate-300' : 'text-slate-500'}`}>
                                          {dayNum}
                                        </span>
                                        {status && (
                                          <span className="text-[8px] font-mono font-bold text-slate-400">
                                            {dayStr}/{monthStr}
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-2 text-center">
                                        {isFuture ? null : (statusBadge ? statusBadge : (
                                          <span className="text-[10px] font-semibold text-slate-350 italic">
                                            {isSunday ? "Chủ Nhật" : "Không học"}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Progress & Info footer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="flex flex-col justify-center space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wide">Tỷ lệ chuyên cần thực tế</span>
                        <span className={`text-base font-black ${mRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {mRate}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-200/60 rounded-full overflow-hidden border border-slate-300/50">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            mRate >= 90 ? 'bg-emerald-500' : mRate >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${mRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100">
                      <AlertCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-0.5">Chú thích lịch chuyên cần</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Tỷ lệ (%) tính trên số ngày đã điểm danh thực tế. Đi trễ hoặc vắng có phép không ảnh hưởng tiêu cực nếu có lý do chính đáng được duyệt bởi nhà trường.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
