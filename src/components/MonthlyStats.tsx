import React, { useState, useMemo } from 'react';
import { Student, User, SubjectGrade } from '../types';
import { 
  Users, 
  ClipboardCheck, 
  Award, 
  DollarSign, 
  Calendar, 
  User as UserIcon, 
  Printer, 
  Search, 
  TrendingUp, 
  Percent, 
  AlertCircle, 
  Sparkles, 
  Check, 
  X,
  FileText,
  PieChart as PieIcon,
  BarChart2,
  ChevronRight,
  BookOpen,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface MonthlyStatsProps {
  currentUser: User;
  students: Student[];
  onUpdateAttendance?: (studentId: string, date: string, status: 'present' | 'late' | 'excused' | 'absent') => void;
  onToggleTuitionPaid?: (studentId: string, paid: boolean) => void;
}

const MONTHS_CONFIG = [
  { value: '2026-07', label: 'Tháng 07/2026' },
  { value: '2026-08', label: 'Tháng 08/2026' },
  { value: '2026-09', label: 'Tháng 09/2026' },
  { value: '2026-10', label: 'Tháng 10/2026' },
  { value: '2026-11', label: 'Tháng 11/2026' },
  { value: '2026-12', label: 'Tháng 12/2026' },
  { value: '2027-01', label: 'Tháng 01/2027' },
  { value: '2027-02', label: 'Tháng 02/2027' },
  { value: '2027-03', label: 'Tháng 03/2027' },
  { value: '2027-04', label: 'Tháng 04/2027' },
  { value: '2027-05', label: 'Tháng 05/2027' },
  { value: '2027-06', label: 'Tháng 06/2027' },
];

export default function MonthlyStats({ currentUser, students, onUpdateAttendance, onToggleTuitionPaid }: MonthlyStatsProps) {
  // Check if teacher
  const isTeacher = currentUser.role === 'teacher';
  
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [activeSubTab, setActiveSubTab] = useState<'class' | 'student'>(isTeacher ? 'class' : 'student');
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  
  // For individual view
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    // If student or parent, lock to their studentId, otherwise default to first student
    if (currentUser.role !== 'teacher' && currentUser.studentId) {
      return currentUser.studentId;
    }
    return students[0]?.id || '';
  });
  
  // Search state for class report
  const [classSearch, setClassSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'high' | 'low'>('all'); // high: >90%, low: <=90%

  // Helper: compute subject average (returns null if no grades are entered)
  const getSubjectAverage = (g: SubjectGrade): number | null => {
    const hasOral = g.oral && g.oral.length > 0;
    const hasM15 = g.m15 && g.m15.length > 0;
    const hasM45 = g.m45 && g.m45.length > 0;
    const hasFinal = g.final !== undefined && g.final !== null;

    if (!hasOral && !hasM15 && !hasM45 && !hasFinal) {
      return null;
    }

    const oralAvg = hasOral ? g.oral.reduce((a, b) => a + b, 0) / g.oral.length : 0;
    const m15Avg = hasM15 ? g.m15.reduce((a, b) => a + b, 0) / g.m15.length : 0;
    const m45Avg = hasM45 ? g.m45.reduce((a, b) => a + b, 0) / g.m45.length : 0;
    
    let totalWeight = 0;
    let weightedSum = 0;

    if (hasOral) { weightedSum += oralAvg * 1; totalWeight += 1; }
    if (hasM15) { weightedSum += m15Avg * 1; totalWeight += 1; }
    if (hasM45) { weightedSum += m45Avg * 2; totalWeight += 2; }
    if (hasFinal) { weightedSum += g.final * 3; totalWeight += 3; }

    return totalWeight > 0 ? weightedSum / totalWeight : null;
  };

  // Helper: compute overall GPA for a student (returns null if no grades are entered)
  const getStudentGPA = (student: Student): number | null => {
    if (!student.grades || student.grades.length === 0) return null;
    const averages = student.grades
      .map(g => getSubjectAverage(g))
      .filter((avg): avg is number => avg !== null);
    
    if (averages.length === 0) return null;
    return averages.reduce((a, b) => a + b, 0) / averages.length;
  };

  // Get classification
  const getClassification = (gpa: number | null): { text: string; bg: string; textClass: string } => {
    if (gpa === null) return { text: '—', bg: 'bg-slate-50 text-slate-400 border border-slate-100', textClass: 'text-slate-400' };
    if (gpa >= 8.0) return { text: 'Giỏi', bg: 'bg-blue-100 text-blue-800 border border-blue-200', textClass: 'text-blue-600' };
    if (gpa >= 6.5) return { text: 'Khá', bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200', textClass: 'text-emerald-600' };
    if (gpa >= 5.0) return { text: 'Trung bình', bg: 'bg-amber-100 text-amber-800 border border-amber-200', textClass: 'text-amber-600' };
    return { text: 'Yếu', bg: 'bg-rose-100 text-rose-800 border border-rose-200', textClass: 'text-rose-600' };
  };

  // Generate all calendar days of the month
  const calendarDaysOfMonth = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    
    const days: { dateStr: string; dayNum: string; weekday: string }[] = [];
    const date = new Date(year, month, 1);
    const weekdaysVietnamese = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    while (date.getMonth() === month) {
      const dayNum = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayNum}`;
      const weekday = weekdaysVietnamese[date.getDay()];
      days.push({ dateStr, dayNum, weekday });
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  // Extract month and year labels for header
  const { ledgerMonthLabel, ledgerYearLabel } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    return {
      ledgerMonthLabel: parseInt(monthStr).toString(),
      ledgerYearLabel: yearStr
    };
  }, [selectedMonth]);

  // Calculate monthly attendance statistics for each student
  const studentMonthlyStats = useMemo(() => {
    return students.map(student => {
      let present = 0;
      let late = 0;
      let excused = 0;
      let absent = 0;
      let totalDays = 0;

      // Filter attendance records falling within selectedMonth (YYYY-MM)
      Object.entries(student.attendance || {}).forEach(([dateStr, status]) => {
        if (dateStr.startsWith(selectedMonth)) {
          totalDays++;
          if (status === 'present') present++;
          else if (status === 'late') late++;
          else if (status === 'excused') excused++;
          else if (status === 'absent') absent++;
        }
      });

      // Attendance rate (%) (present + late counts positively as attending)
      const rate = totalDays > 0 ? ((present + late) / totalDays) * 100 : 100;
      const gpa = getStudentGPA(student);
      const classification = getClassification(gpa);

      return {
        student,
        id: student.id,
        name: student.name,
        present,
        late,
        excused,
        absent,
        totalDays,
        rate,
        gpa,
        classification,
        tuitionPaid: student.tuitionPaid,
        tuitionAmount: student.tuitionAmount,
      };
    });
  }, [students, selectedMonth]);

  // Generate mock attendance data for selectedMonth if no data exists
  const handleAutoGenerateData = () => {
    if (!isTeacher) return;
    if (!window.confirm(`Bạn có chắc chắn muốn tạo tự động dữ liệu điểm danh mẫu cho toàn bộ lớp trong ${MONTHS_CONFIG.find(m => m.value === selectedMonth)?.label}? Việc này giúp xem biểu đồ phân tích trực quan hơn.`)) {
      return;
    }

    // Generate dates for chosen month (e.g., 20 working days)
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    
    const generatedDates: string[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Monday to Friday
        const dayStr = String(date.getDate()).padStart(2, '0');
        generatedDates.push(`${yearStr}-${monthStr}-${dayStr}`);
      }
      date.setDate(date.getDate() + 1);
    }

    if (onUpdateAttendance) {
      students.forEach(s => {
        generatedDates.forEach(dateStr => {
          // 88% present, 6% late, 4% excused, 2% absent
          const rand = Math.random();
          let status: 'present' | 'late' | 'excused' | 'absent' = 'present';
          if (rand > 0.98) status = 'absent';
          else if (rand > 0.94) status = 'excused';
          else if (rand > 0.88) status = 'late';

          onUpdateAttendance(s.id, dateStr, status);
        });
      });
      alert(`Đã khởi tạo thành công dữ liệu điểm danh ${generatedDates.length} ngày học của ${students.length} học sinh trong tháng!`);
    }
  };

  // Class-wide summary metrics
  const classSummary = useMemo(() => {
    let totalPresent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalAbsent = 0;
    let totalRateSum = 0;
    let validRateCount = 0;
    let paidCount = 0;
    let totalTuitionAmount = 0;
    let collectedTuitionAmount = 0;

    let gioicount = 0;
    let khacount = 0;
    let tbcount = 0;
    let yeucount = 0;
    let gpaSum = 0;
    let gpaCount = 0;

    studentMonthlyStats.forEach(stat => {
      totalPresent += stat.present;
      totalLate += stat.late;
      totalExcused += stat.excused;
      totalAbsent += stat.absent;
      
      if (stat.totalDays > 0) {
        totalRateSum += stat.rate;
        validRateCount++;
      }

      if (stat.tuitionPaid) {
        paidCount++;
        collectedTuitionAmount += stat.tuitionAmount;
      }
      totalTuitionAmount += stat.tuitionAmount;

      if (stat.gpa !== null) {
        gpaSum += stat.gpa;
        gpaCount++;
        if (stat.gpa >= 8.0) gioicount++;
        else if (stat.gpa >= 6.5) khacount++;
        else if (stat.gpa >= 5.0) tbcount++;
        else yeucount++;
      }
    });

    const averageAttendanceRate = validRateCount > 0 ? (totalRateSum / validRateCount) : 100;
    const averageClassGPA = gpaCount > 0 ? (gpaSum / gpaCount) : 0;
    const tuitionPaidRate = studentMonthlyStats.length > 0 ? (paidCount / studentMonthlyStats.length) * 100 : 0;

    return {
      averageAttendanceRate,
      averageClassGPA,
      totalPresent,
      totalLate,
      totalExcused,
      totalAbsent,
      paidCount,
      tuitionPaidRate,
      totalTuitionAmount,
      collectedTuitionAmount,
      gioicount,
      khacount,
      tbcount,
      yeucount
    };
  }, [studentMonthlyStats]);

  // Recharts Attendance Pie Data
  const attendancePieData = [
    { name: 'Đúng giờ', value: classSummary.totalPresent, color: '#10b981' },
    { name: 'Đi trễ', value: classSummary.totalLate, color: '#f59e0b' },
    { name: 'Có phép', value: classSummary.totalExcused, color: '#3b82f6' },
    { name: 'Không phép', value: classSummary.totalAbsent, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Recharts Grade Dist Bar Data
  const gradeBarData = [
    { name: 'Giỏi (>=8.0)', count: classSummary.gioicount, color: '#3b82f6' },
    { name: 'Khá (6.5-7.9)', count: classSummary.khacount, color: '#10b981' },
    { name: 'T.Bình (5.0-6.4)', count: classSummary.tbcount, color: '#f59e0b' },
    { name: 'Yếu (<5.0)', count: classSummary.yeucount, color: '#ef4444' }
  ];

  // Recharts Tuition Pie Data
  const tuitionPieData = [
    { name: 'Đã hoàn thành', value: classSummary.paidCount, color: '#10b981' },
    { name: 'Chưa đóng', value: students.length - classSummary.paidCount, color: '#f97316' }
  ];

  // Filter student table list
  const filteredStudentStats = useMemo(() => {
    return studentMonthlyStats.filter(stat => {
      const matchSearch = stat.name.toLowerCase().includes(classSearch.toLowerCase()) || stat.id.toLowerCase().includes(classSearch.toLowerCase());
      
      if (attendanceFilter === 'high') {
        return matchSearch && stat.rate >= 90;
      }
      if (attendanceFilter === 'low') {
        return matchSearch && stat.rate < 90;
      }
      return matchSearch;
    });
  }, [studentMonthlyStats, classSearch, attendanceFilter]);

  // Selected Student for Deep Dive Profile
  const selectedStudentStat = useMemo(() => {
    return studentMonthlyStats.find(stat => stat.id === selectedStudentId) || studentMonthlyStats[0];
  }, [studentMonthlyStats, selectedStudentId]);

  // Radar chart data for selected student's grades
  const studentSubjectGradesData = useMemo(() => {
    if (!selectedStudentStat || !selectedStudentStat.student.grades) return [];
    return selectedStudentStat.student.grades
      .map(g => {
        const avg = getSubjectAverage(g);
        return {
          subject: g.subject,
          score: avg === null ? null : parseFloat(avg.toFixed(2)),
          final: g.final
        };
      })
      .filter((item): item is { subject: string; score: number; final: number | undefined } => item.score !== null);
  }, [selectedStudentStat]);

  // List of all attendance logs for selected student in selectedMonth
  const selectedStudentAttendanceLogs = useMemo(() => {
    if (!selectedStudentStat) return [];
    
    return Object.entries(selectedStudentStat.student.attendance || {})
      .filter(([dateStr]) => dateStr.startsWith(selectedMonth))
      .sort((a, b) => b[0].localeCompare(a[0])) // Newest first
      .map(([dateStr, status]) => ({
        date: dateStr,
        status,
        statusLabel: status === 'present' ? 'Đi học đúng giờ' : status === 'late' ? 'Đi trễ' : status === 'excused' ? 'Nghỉ có phép' : 'Nghỉ không phép',
        colorClass: status === 'present' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : status === 'late' ? 'text-amber-700 bg-amber-50 border-amber-200 bg-amber-50/20' : status === 'excused' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-rose-700 bg-rose-50 border-rose-200'
      }));
  }, [selectedStudentStat, selectedMonth]);

  // Trigger browser print flow with customized standalone printable designs
  const handlePrint = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

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

    if (activeSubTab === 'class') {
      // 1. CLASS-WIDE SUMMARY REPORT PRINT LAYOUT
      const studentRows = studentMonthlyStats.map((stat, idx) => {
        const rateColor = stat.rate >= 95 ? '#166534' : stat.rate >= 90 ? '#854d0e' : '#9f1239';
        const gpaColor = stat.gpa === null ? '#94a3b8' : stat.gpa >= 8.0 ? '#1e40af' : stat.gpa >= 6.5 ? '#0f172a' : '#9f1239';
        const tuitionText = stat.tuitionPaid ? 'Đã đóng' : 'Chưa đóng';
        const tuitionStyle = stat.tuitionPaid 
          ? 'color: #166534; font-weight: bold; background-color: #dcfce7; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0;' 
          : 'color: #9f1239; font-weight: bold; background-color: #ffe4e6; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecdd3;';

        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="text-align: center; font-family: monospace; font-size: 11px;">${stat.id}</td>
            <td style="font-weight: bold;">${stat.name}</td>
            <td style="text-align: center; color: #166534; font-weight: 500;">${stat.present}</td>
            <td style="text-align: center; color: #b45309; font-weight: 500;">${stat.late}</td>
            <td style="text-align: center; color: #1d4ed8; font-weight: 500;">${stat.excused}</td>
            <td style="text-align: center; color: #be123c; font-weight: 500;">${stat.absent}</td>
            <td style="text-align: center; font-weight: bold; color: ${rateColor};">${stat.rate.toFixed(1)}%</td>
            <td style="text-align: center; font-weight: bold; color: ${gpaColor};">${stat.gpa === null ? '—' : stat.gpa.toFixed(2)}</td>
            <td style="text-align: center; font-size: 11px;">
              <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-weight: bold; background-color: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;">
                ${stat.classification.text}
              </span>
            </td>
            <td style="text-align: center;">
              <span style="${tuitionStyle}">${tuitionText}</span>
            </td>
          </tr>
        `;
      }).join('');

      doc.write(`
        <html>
          <head>
            <title>Bảng Báo Cáo Thống Kê Tổng Hợp Lớp 12A4 - Tháng ${monthStr}/${yearStr}</title>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { size: landscape; margin: 15mm; }
              }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #0f172a;
                padding: 10px;
                background: #ffffff;
                font-size: 12px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }
              .school-info {
                text-align: left;
              }
              .school-name {
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #475569;
              }
              .class-name {
                font-size: 14px;
                font-weight: 800;
                color: #0f172a;
                margin-top: 2px;
              }
              .title-area {
                text-align: right;
              }
              .title-area h1 {
                font-size: 18px;
                text-transform: uppercase;
                margin: 0;
                color: #0f172a;
                font-weight: 900;
                letter-spacing: 0.5px;
              }
              .title-area p {
                font-size: 11px;
                color: #64748b;
                margin: 4px 0 0 0;
                font-style: italic;
              }
              .kpi-grid {
                display: grid;
                grid-template-cols: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 20px;
              }
              .kpi-card {
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 10px;
                background-color: #f8fafc;
                box-shadow: 0 1px 2px rgba(0,0,0,0.02);
              }
              .kpi-card .kpi-label {
                font-size: 9px;
                font-weight: 850;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #64748b;
                margin-bottom: 4px;
              }
              .kpi-card .kpi-value {
                font-size: 16px;
                font-weight: bold;
                color: #0f172a;
              }
              .kpi-card .kpi-desc {
                font-size: 9px;
                color: #94a3b8;
                margin-top: 2px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
              }
              th {
                background-color: #f1f5f9;
                border: 1px solid #94a3b8;
                padding: 6px 4px;
                font-size: 10.5px;
                font-weight: bold;
                text-transform: uppercase;
                text-align: center;
                color: #1e293b;
              }
              td {
                border: 1px solid #cbd5e1;
                padding: 6px 8px;
                font-size: 11px;
                color: #334155;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .signatures {
                display: grid;
                grid-template-cols: repeat(3, 1fr);
                gap: 30px;
                text-align: center;
                font-size: 12px;
                margin-top: 35px;
                page-break-inside: avoid;
              }
              .signatures .col {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .signatures .date {
                font-style: italic;
                color: #64748b;
                margin-bottom: 4px;
              }
              .signatures .title {
                font-weight: bold;
                color: #1e293b;
              }
              .signatures .space {
                margin-top: 50px;
                font-size: 10px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-info">
                <div class="school-name">Hệ thống Giáo dục Quốc tế</div>
                <div class="class-name">LỚP CHỦ NHIỆM: 12A4</div>
              </div>
              <div class="title-area">
                <h1>Báo Cáo Thống Kê Tổng Hợp Toàn Lớp</h1>
                <p>Tháng ${monthStr}/${yearStr} &nbsp;•&nbsp; Xuất ngày ${new Date().toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card" style="border-left: 4px solid #10b981;">
                <div class="kpi-label">Chuyên Cần Lớp</div>
                <div class="kpi-value">${classSummary.averageAttendanceRate.toFixed(1)}%</div>
                <div class="kpi-desc">Trung bình tỉ lệ hiện diện của cả lớp</div>
              </div>
              <div class="kpi-card" style="border-left: 4px solid #3b82f6;">
                <div class="kpi-label">Học Lực GPA</div>
                <div class="kpi-value">${classSummary.averageClassGPA.toFixed(2)} / 10</div>
                <div class="kpi-desc">Điểm trung bình học thuật tháng</div>
              </div>
              <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
                <div class="kpi-label">Tiến Độ Học Phí</div>
                <div class="kpi-value">${classSummary.paidCount} / ${students.length} HS</div>
                <div class="kpi-desc">Đã đóng hoàn tất (${classSummary.tuitionPaidRate.toFixed(1)}%)</div>
              </div>
              <div class="kpi-card" style="border-left: 4px solid #6366f1;">
                <div class="kpi-label">Phân Phối Học Lực</div>
                <div class="kpi-value" style="font-size: 13px; font-weight: bold; margin-top: 2px;">
                  Giỏi: ${classSummary.gioicount} | Khá: ${classSummary.khacount} | TB: ${classSummary.tbcount} | Yếu: ${classSummary.yeucount}
                </div>
                <div class="kpi-desc">Theo xếp hạng điểm số tháng</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 4%;">STT</th>
                  <th style="width: 10%;">Mã HS</th>
                  <th style="width: 18%;">Họ và tên</th>
                  <th style="width: 8%;">Đúng giờ</th>
                  <th style="width: 8%;">Đi trễ</th>
                  <th style="width: 8%;">Có phép</th>
                  <th style="width: 8%;">Không phép</th>
                  <th style="width: 11%;">Chuyên cần</th>
                  <th style="width: 8%;">GPA</th>
                  <th style="width: 10%;">Xếp loại</th>
                  <th style="width: 12%;">Học phí</th>
                </tr>
              </thead>
              <tbody>
                ${studentRows}
              </tbody>
            </table>

            <div class="signatures">
              <div class="col">
                <div class="title">Đại diện Ban phụ huynh</div>
                <div class="space">(Ký và ghi rõ họ tên)</div>
              </div>
              <div class="col">
                <div class="title">Người lập báo cáo</div>
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
    } else {
      // 2. INDIVIDUAL STUDENT REPORT PRINT LAYOUT
      if (!selectedStudentStat) return;
      const student = selectedStudentStat.student;

      const logRows = selectedStudentAttendanceLogs.length > 0 
        ? selectedStudentAttendanceLogs.map((log, idx) => {
            let badgeStyle = "";
            if (log.status === 'present') badgeStyle = "color: #166534; font-weight: bold;";
            else if (log.status === 'late') badgeStyle = "color: #b45309; font-weight: bold;";
            else if (log.status === 'excused') badgeStyle = "color: #1d4ed8; font-weight: bold;";
            else if (log.status === 'absent') badgeStyle = "color: #be123c; font-weight: bold;";

            return `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold;">${log.date.substring(8, 10)}/${log.date.substring(5, 7)}/${log.date.substring(0, 4)}</td>
                <td style="${badgeStyle}">${log.statusLabel}</td>
                <td style="font-style: italic; color: #64748b;">
                  ${log.status === 'present' ? 'Đi học đúng giờ, nghiêm túc' : log.status === 'late' ? 'Muộn giờ sinh hoạt đầu giờ' : log.status === 'excused' ? 'Nghỉ học có giấy phép hợp lệ' : 'Tự ý nghỉ học không lý do'}
                </td>
              </tr>
            `;
          }).join('')
        : `<tr><td colspan="4" style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">Không có ghi nhận điểm danh nào trong tháng này</td></tr>`;

      const tuitionStatusHtml = selectedStudentStat.tuitionPaid
        ? '<span style="color: #166534; font-weight: bold; background-color: #dcfce7; padding: 3px 8px; border-radius: 6px; border: 1px solid #bbf7d0;">Đã hoàn thành</span>'
        : '<span style="color: #9f1239; font-weight: bold; background-color: #ffe4e6; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecdd3;">Chưa hoàn thành</span>';

      doc.write(`
        <html>
          <head>
            <title>Phiếu Báo Cáo Kết Quả Tháng ${monthStr}/${yearStr} - ${selectedStudentStat.name}</title>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { size: portrait; margin: 20mm; }
              }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #0f172a;
                padding: 10px;
                background: #ffffff;
                font-size: 13px;
                line-height: 1.5;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #0f172a;
                padding-bottom: 12px;
                margin-bottom: 25px;
              }
              .header h2 {
                font-size: 12px;
                text-transform: uppercase;
                margin: 0 0 6px 0;
                color: #475569;
                letter-spacing: 1px;
              }
              .header h1 {
                font-size: 18px;
                text-transform: uppercase;
                margin: 0;
                color: #0f172a;
                font-weight: 900;
              }
              .header p {
                font-size: 12px;
                color: #64748b;
                margin: 6px 0 0 0;
                font-style: italic;
              }
              .student-info-grid {
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 12px;
                margin-bottom: 25px;
                padding: 15px;
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
              }
              .info-item {
                font-size: 12.5px;
              }
              .info-item strong {
                color: #0f172a;
              }
              .metrics-grid {
                display: grid;
                grid-template-cols: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 25px;
              }
              .metric-card {
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
              }
              .metric-card.attendance { border-left: 4px solid #10b981; background-color: #f0fdf4; }
              .metric-card.gpa { border-left: 4px solid #3b82f6; background-color: #eff6ff; }
              .metric-card.tuition { border-left: 4px solid #f59e0b; background-color: #fffbeb; }
              
              .metric-card .label {
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 0.5px;
              }
              .metric-card .value {
                font-size: 18px;
                font-weight: 800;
                margin-top: 4px;
                color: #0f172a;
              }
              .metric-card .desc {
                font-size: 10px;
                color: #64748b;
                margin-top: 2px;
              }
              h3.section-title {
                font-size: 13px;
                text-transform: uppercase;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 6px;
                margin-bottom: 12px;
                color: #1e293b;
                letter-spacing: 0.5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th {
                background-color: #f1f5f9;
                border: 1px solid #cbd5e1;
                padding: 8px;
                font-size: 11.5px;
                font-weight: bold;
                text-align: center;
              }
              td {
                border: 1px solid #cbd5e1;
                padding: 8px;
                font-size: 12px;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .signatures {
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 40px;
                text-align: center;
                font-size: 13px;
                margin-top: 40px;
                page-break-inside: avoid;
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
                margin-top: 55px;
                font-size: 11px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Trường THPT Chuyên Quốc Tế</h2>
              <h1>Phiếu Báo Cáo Kết Quả Học Tập & Chuyên Cần</h1>
              <p>Tháng ${monthStr}/${yearStr} &nbsp;•&nbsp; Niên khóa: 2026 - 2027</p>
            </div>

            <div class="student-info-grid">
              <div class="info-item">Họ và tên: <strong>${selectedStudentStat.name}</strong></div>
              <div class="info-item">Mã học sinh: <strong>${selectedStudentStat.id}</strong></div>
              <div class="info-item">Lớp học: <strong>12A4</strong></div>
              <div class="info-item">Giới tính: <strong>${student.gender}</strong></div>
              <div class="info-item">Ngày sinh: <strong>${student.dob}</strong></div>
              <div class="info-item">Hình thức học: <strong>${student.learningMode}</strong></div>
              <div class="info-item">Phụ huynh: <strong>${student.parentName}</strong></div>
              <div class="info-item">SĐT liên hệ: <strong>${student.parentPhone}</strong></div>
            </div>

            <div class="metrics-grid">
              <div class="metric-card attendance">
                <div class="label">Chuyên Cần</div>
                <div class="value">${selectedStudentStat.rate.toFixed(1)}%</div>
                <div class="desc">Đi học: ${selectedStudentStat.present} | Muộn: ${selectedStudentStat.late} | Phép: ${selectedStudentStat.excused}</div>
              </div>
              <div class="metric-card gpa">
                <div class="label">Học Thuật GPA</div>
                <div class="value">${selectedStudentStat.gpa === null ? '—' : selectedStudentStat.gpa.toFixed(2)}</div>
                <div class="desc">Xếp loại học lực: <strong>${selectedStudentStat.classification.text}</strong></div>
              </div>
              <div class="metric-card tuition">
                <div class="label">Học Phí</div>
                <div class="value" style="font-size: 14px; margin-top: 8px;">${tuitionStatusHtml}</div>
                <div class="desc" style="margin-top: 6px;">Định mức: ${selectedStudentStat.tuitionAmount.toLocaleString('vi-VN')} đ</div>
              </div>
            </div>

            <h3 class="section-title">Nhật ký chuyên cần chi tiết trong tháng</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">STT</th>
                  <th style="width: 25%;">Ngày Điểm Danh</th>
                  <th style="width: 25%;">Trạng Thái</th>
                  <th style="width: 42%;">Nhận Xét Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                ${logRows}
              </tbody>
            </table>

            <div class="signatures">
              <div class="col">
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
    }

    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 450);
  };

  const handlePrintLedger = () => {
    const printContent = document.getElementById('attendance-ledger-print-area')?.innerHTML;
    if (!printContent) return;

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
          <title>Sổ Điểm Danh Lớp 12A4 - Tháng ${selectedMonth}</title>
          <style>
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              @page { 
                size: A4 landscape !important; 
                margin: 4mm 6mm !important; 
              }
              #attendance-ledger-print-area {
                width: 100% !important;
                transform: none !important;
                position: relative !important;
              }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #000000;
              background: #ffffff;
              padding: 0;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; margin: 0 auto; padding: 4px;">
            ${printContent}
          </div>
        </body>
      </html>
    `);

    // Copy all styles from the parent document to render colors and layouts correctly in print view
    const parentStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
    parentStyles.forEach((styleNode) => {
      doc.head.appendChild(styleNode.cloneNode(true));
    });

    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 450);
  };


  // Helper to trigger download of a CSV file with UTF-8 BOM
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export class-wide summary data for selectedMonth
  const handleExportClassData = () => {
    const headers = [
      'Mã học sinh',
      'Họ và tên',
      'Giới tính',
      'Ngày sinh',
      'Đi học đúng giờ (ngày)',
      'Đi trễ (ngày)',
      'Nghỉ có phép (ngày)',
      'Nghỉ không phép (ngày)',
      'Tỷ lệ chuyên cần (%)',
      'GPA Tháng',
      'Xếp loại học lực',
      'Trạng thái Học Phí',
      'Định mức Học Phí (đ)'
    ];

    const rows = studentMonthlyStats.map(stat => [
      stat.id,
      stat.name,
      stat.student.gender,
      stat.student.dob,
      stat.present,
      stat.late,
      stat.excused,
      stat.absent,
      stat.totalDays > 0 ? stat.rate.toFixed(1) : '100',
      stat.gpa === null ? '—' : stat.gpa.toFixed(2),
      stat.classification.text,
      stat.tuitionPaid ? 'Đã hoàn thành' : 'Chưa đóng',
      stat.tuitionAmount
    ]);

    const monthLabel = MONTHS_CONFIG.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const csvContent = [
      `BẢNG BÁO CÁO THỐNG KÊ TOÀN LỚP - ${monthLabel.toUpperCase()}`,
      `Thời điểm xuất dữ liệu: ${new Date().toLocaleString('vi-VN')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    downloadCSV(csvContent, `bao_cao_thang_ca_lop_${selectedMonth}.csv`);
  };

  // Export selected student's individual monthly data
  const handleExportStudentData = () => {
    if (!selectedStudentStat) return;
    const student = selectedStudentStat.student;
    const monthLabel = MONTHS_CONFIG.find(m => m.value === selectedMonth)?.label || selectedMonth;

    const infoRows = [
      ['THÔNG TIN HỌC SINH', ''],
      ['Mã học sinh', selectedStudentStat.id],
      ['Họ và tên', selectedStudentStat.name],
      ['Giới tính', student.gender],
      ['Ngày sinh', student.dob],
      ['Lớp học', '12A4'],
      ['Hình thức học', student.learningMode],
      ['Phương tiện di chuyển', student.busStatus],
      ['Tuyến xe buýt', student.busRoute || 'N/A'],
      ['Tên phụ huynh', student.parentName],
      ['Số điện thoại phụ huynh', student.parentPhone],
      ['Địa chỉ liên hệ', student.address],
      ['Tỷ lệ chuyên cần', selectedStudentStat.totalDays > 0 ? `${selectedStudentStat.rate.toFixed(1)}%` : '100%'],
      ['Số ngày có mặt đúng giờ', `${selectedStudentStat.present} ngày`],
      ['Số ngày đi trễ', `${selectedStudentStat.late} ngày`],
      ['Số ngày nghỉ có phép', `${selectedStudentStat.excused} ngày`],
      ['Số ngày nghỉ không phép', `${selectedStudentStat.absent} ngày`],
      ['Điểm GPA học lực', selectedStudentStat.gpa === null ? '—' : selectedStudentStat.gpa.toFixed(2)],
      ['Xếp loại học lực', selectedStudentStat.classification.text],
      ['Tình trạng học phí', selectedStudentStat.tuitionPaid ? 'Đã đóng' : 'Chưa đóng'],
      ['Học phí định mức', `${selectedStudentStat.tuitionAmount} VNĐ`],
      [],
    ];

    const gradeHeaders = ['Môn học', 'Điểm Miệng', 'Điểm 15 Phút', 'Điểm 45 Phút', 'Điểm Cuối Kỳ', 'Điểm Trung Bình Môn'];
    const gradeRows = student.grades.map(g => {
      const oral = g.oral.join('; ') || '-';
      const m15 = g.m15.join('; ') || '-';
      const m45 = g.m45.join('; ') || '-';
      const subjectAvg = getSubjectAverage(g);
      const avg = subjectAvg === null ? '—' : subjectAvg.toFixed(2);
      return [
        g.subject,
        oral,
        m15,
        m45,
        g.final,
        avg
      ];
    });

    const attendanceHeaders = ['Ngày', 'Trạng thái điểm danh', 'Ghi chú'];
    const attendanceRows = selectedStudentAttendanceLogs.map(log => [
      log.date,
      log.status === 'present' ? 'Có mặt đúng giờ' : log.status === 'late' ? 'Đi trễ' : log.status === 'excused' ? 'Nghỉ có phép' : 'Nghỉ không phép',
      ''
    ]);

    const csvContent = [
      `BÁO CÁO HỌC TẬP & CHUYÊN CẦN CÁ NHÂN - ${monthLabel.toUpperCase()}`,
      `Thời điểm xuất dữ liệu: ${new Date().toLocaleString('vi-VN')}`,
      '',
      ...infoRows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(',')),
      'CHI TIẾT ĐIỂM SỐ CÁC MÔN HỌC',
      gradeHeaders.join(','),
      ...gradeRows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(',')),
      '',
      'CHI TIẾT LỊCH SỬ ĐIỂM DANH',
      attendanceHeaders.join(','),
      ...attendanceRows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    downloadCSV(csvContent, `bao_cao_ca_nhan_${selectedStudentStat.id}_${selectedMonth}.csv`);
  };

  return (
    <div className="space-y-6" id="monthly-stats-view">
      
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm" id="stats-banner">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            Bảng Thống Kê Học Tập & Chuyên Cần Tháng
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp thông số chuyên cần, kết quả xếp loại học tập GPA, và quản lý học phí của toàn bộ lớp học và cá nhân học sinh theo từng tháng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto" id="stats-toolbar-actions">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5" id="month-dropdown-wrapper">
            <Calendar className="h-4 w-4 text-slate-500" />
            <select
              id="select-stats-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
            >
              {MONTHS_CONFIG.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {isTeacher && (
            <button
              type="button"
              id="btn-generate-mock-attendance"
              onClick={handleAutoGenerateData}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
              title="Khởi tạo dữ liệu điểm danh ngẫu nhiên cho tháng chưa có dữ liệu"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tạo mẫu điểm danh
            </button>
          )}

          {activeSubTab === 'class' ? (
            <button
              type="button"
              id="btn-export-class-stats"
              onClick={handleExportClassData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Xuất dữ liệu lớp
            </button>
          ) : (
            <button
              type="button"
              id="btn-export-student-stats"
              onClick={handleExportStudentData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Xuất dữ liệu cá nhân
            </button>
          )}

          <button
            type="button"
            id="btn-print-ledger-template"
            onClick={() => setIsLedgerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            title="In Sổ Điểm Danh Tổng Hợp Theo Tháng mẫu Excel chuẩn đã gửi, tinh chỉnh gọn gàng trong 1 trang A4 landscape"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 animate-pulse" />
            In Sổ Điểm Danh Tổng Hợp Theo Tháng
          </button>

          <button
            type="button"
            id="btn-print-stats"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            In thống kê
          </button>
        </div>
      </div>

      {/* Main Stats Tabs Navigation */}
      <div className="flex border-b border-slate-200" id="stats-tab-bar">
        <button
          type="button"
          id="tab-class-stats"
          onClick={() => setActiveSubTab('class')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'class'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Tổng Quan Cả Lớp
        </button>
        <button
          type="button"
          id="tab-student-stats"
          onClick={() => setActiveSubTab('student')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'student'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="h-4.5 w-4.5" />
          {currentUser.role === 'teacher' ? 'Báo Cáo Từng Học Sinh' : 'Báo Cáo Cá Nhân'}
        </button>
      </div>

      {/* Tab Content 1: CLASS-WIDE REPORT */}
      {activeSubTab === 'class' && (
        <div className="space-y-6" id="class-stats-tab-content">
          
          {/* Quick Stats Bento Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="class-stats-cards">
            {/* 1. Attendance Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all" id="card-attendance-rate">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tỷ lệ Chuyên Cần</span>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {classSummary.averageAttendanceRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-medium text-slate-500">
                    Trực quan chuyên cần tháng
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Average GPA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all" id="card-class-gpa">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Xếp Loại Học Lực GPA</span>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {classSummary.averageClassGPA.toFixed(2)} / 10
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                    {getClassification(classSummary.averageClassGPA).text}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">Điểm trung bình cả lớp</span>
                </div>
              </div>
            </div>

            {/* 3. Tuition Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all" id="card-tuition-rate">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tiến độ Học Phí</span>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {classSummary.tuitionPaidRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-slate-500">
                  <span className="text-emerald-600 font-bold">{classSummary.paidCount} HS</span> đã đóng • {students.length - classSummary.paidCount} chưa đóng
                </div>
              </div>
            </div>

            {/* 4. Total Collected */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all" id="card-collected-tuition">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Học phí thu về</span>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {classSummary.collectedTuitionAmount.toLocaleString('vi-VN')} đ
                </p>
                <div className="text-[10px] font-medium text-slate-500 mt-1">
                  Tổng chỉ tiêu: {classSummary.totalTuitionAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </div>

          {/* Charts Visualization Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="class-charts-grid">
            
            {/* Chart 1: Chuyên cần */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[320px]" id="chart-attendance-pie-container">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <PieIcon className="h-4 w-4 text-emerald-600" />
                Cơ cấu điểm danh cả lớp ({classSummary.totalPresent + classSummary.totalExcused + classSummary.totalAbsent} lượt)
              </h3>
              <div className="flex-1 min-h-0 relative">
                {attendancePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {attendancePieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} ngày`, 'Số lượng']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                    <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                    Chưa có dữ liệu điểm danh tháng này
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4 text-xs font-semibold mt-2" id="attendance-pie-legend">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>Đi học</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>Có phép</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Không phép</span>
              </div>
            </div>

            {/* Chart 2: Học lực */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[320px] lg:col-span-2" id="chart-grades-bar-container">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-blue-600" />
                Biểu đồ phân loại học lực lớp học (GPA Tháng)
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [`${value} học sinh`, 'Xếp loại']} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {gradeBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Student Stats Spreadsheet Table View - Only for Teachers */}
          {isTeacher && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="class-stats-table-card">
              
              {/* Table Filter Actions Bar */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50" id="table-filter-bar">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-wide flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  BẢNG BÁO CÁO THÁNG CHI TIẾT TỪNG HỌC SINH
                </h3>

                <div className="flex flex-wrap items-center gap-2.5" id="table-controls">
                  {/* Search */}
                  <div className="relative" id="table-search-wrapper">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      id="input-stats-search"
                      placeholder="Tìm tên hoặc mã học sinh..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-xl w-[220px] focus:outline-indigo-600 text-slate-800 font-medium bg-white"
                    />
                  </div>

                  {/* Chuyên cần filter */}
                  <select
                    id="select-stats-attendance-filter"
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value as any)}
                    className="text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-indigo-500"
                  >
                    <option value="all">Tất cả chuyên cần</option>
                    <option value="high">Chuyên cần xuất sắc (≥ 90%)</option>
                    <option value="low">Chuyên cần yếu (&lt; 90%)</option>
                  </select>
                </div>
              </div>

              {/* Main Table */}
              <div className="overflow-x-auto" id="stats-table-wrapper">
                <table className="w-full border-collapse" id="stats-students-table">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 select-none">
                      <th className="text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-5 w-[10%]">Mã HS</th>
                      <th className="text-left text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-4 w-[25%]">Họ và Tên</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-2 w-[8%]">Đi học</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-2 w-[8%]">Đi trễ</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-2 w-[8%]">Có phép</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-2 w-[8%]">Không phép</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-3 w-[12%]">Tỷ lệ Chuyên Cần</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-3 w-[10%]">GPA Tháng</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-3 w-[12%]">Xếp Loại</th>
                      <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-3 w-[12%]">Học Phí</th>
                      {isTeacher && <th className="text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wide py-3.5 px-4 w-[8%]">Hành động</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filteredStudentStats.length > 0 ? (
                      filteredStudentStats.map((stat) => (
                        <tr 
                          key={stat.id} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (isTeacher) {
                              setSelectedStudentId(stat.id);
                              setActiveSubTab('student');
                            }
                          }}
                        >
                          <td className="py-3.5 px-5 text-xs font-mono font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                            {stat.id}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-extrabold text-slate-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                              {stat.name.charAt(stat.name.lastIndexOf(' ') + 1)}
                            </div>
                            <span className="group-hover:text-indigo-600 transition-colors">{stat.name}</span>
                          </td>
                          <td className="py-3.5 px-2 text-center text-xs font-bold text-emerald-600">
                            {stat.present}d
                          </td>
                          <td className="py-3.5 px-2 text-center text-xs font-bold text-amber-500">
                            {stat.late}d
                          </td>
                          <td className="py-3.5 px-2 text-center text-xs font-bold text-amber-600">
                            {stat.excused}d
                          </td>
                          <td className="py-3.5 px-2 text-center text-xs font-bold text-rose-600">
                            {stat.absent}d
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {stat.totalDays > 0 ? (
                              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                                stat.rate >= 90 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                              }`}>
                                {stat.rate.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center text-xs font-black text-slate-800">
                            {stat.gpa === null ? '—' : stat.gpa.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.classification.bg}`}>
                              {stat.classification.text}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              stat.tuitionPaid 
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                                : 'text-orange-700 bg-orange-50 border border-orange-200'
                            }`}>
                              {stat.tuitionPaid ? 'Đã hoàn thành' : 'Chưa đóng'}
                            </span>
                          </td>
                          {isTeacher && (
                            <td 
                              className="py-3.5 px-4 text-center"
                              onClick={(e) => e.stopPropagation()} // Prevent clicking to switch tabs
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (onToggleTuitionPaid) {
                                    onToggleTuitionPaid(stat.id, !stat.tuitionPaid);
                                  }
                                }}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                                  stat.tuitionPaid 
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {stat.tuitionPaid ? 'Hủy thu phí' : 'Đóng học phí'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                          Không tìm thấy học sinh phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Summary Info */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium flex flex-col sm:flex-row justify-between gap-2" id="stats-table-footer">
                <div>Hiển thị {filteredStudentStats.length} trên tổng số {students.length} học sinh.</div>
                <div>Bảng xếp loại cập nhật trực tiếp theo dữ liệu hệ thống.</div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Tab Content 2: INDIVIDUAL STUDENT REPORT */}
      {activeSubTab === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="student-stats-tab-content">
          
          {/* Left panel: student information card & switcher */}
          <div className="space-y-6 lg:col-span-1" id="student-profile-left-col">
            
            {/* Student Switcher box (Only visible for teachers) */}
            {isTeacher && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3" id="student-switcher-card">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Chọn học sinh để xem báo cáo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    id="select-individual-student"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl outline-none cursor-pointer transition-all"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Individual Profile Summary Card */}
            {selectedStudentStat ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="student-main-profile-card">
                {/* Header Banner */}
                <div className="bg-slate-900 text-white p-5 relative overflow-hidden" id="student-card-top-bg">
                  <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10">
                    <UserIcon className="h-40 w-40" />
                  </div>
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-extrabold text-lg border border-indigo-500/30">
                      {selectedStudentStat.name.charAt(selectedStudentStat.name.lastIndexOf(' ') + 1)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                        {selectedStudentStat.id}
                      </span>
                      <h4 className="text-base font-extrabold tracking-tight truncate mt-1 text-white">
                        {selectedStudentStat.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        Lớp 12A4 • GVCN Nguyễn Văn Điền
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Details List */}
                <div className="p-5 space-y-3.5 divide-y divide-slate-100" id="student-card-details">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Giới tính</span>
                    <span className="font-extrabold text-slate-800">{selectedStudentStat.student.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-3">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ngày sinh</span>
                    <span className="font-extrabold text-slate-800">{selectedStudentStat.student.dob}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-3">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hình thức đi học</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedStudentStat.student.learningMode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-3">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phương tiện di chuyển</span>
                    <span className="font-extrabold text-indigo-600">
                      {selectedStudentStat.student.busStatus}
                    </span>
                  </div>
                  {selectedStudentStat.student.busRoute && (
                    <div className="text-xs pt-3 flex flex-col gap-1">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tuyến xe buýt</span>
                      <span className="font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {selectedStudentStat.student.busRoute}
                      </span>
                    </div>
                  )}
                  <div className="text-xs pt-3 flex flex-col gap-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Thông tin phụ huynh</span>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[11px] space-y-1">
                      <p className="font-bold text-slate-800">Họ tên: {selectedStudentStat.student.parentName}</p>
                      <p className="font-semibold text-slate-600">SĐT liên hệ: {selectedStudentStat.student.parentPhone}</p>
                      <p className="text-slate-500">ĐC: {selectedStudentStat.student.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

          </div>

          {/* Right panel: dynamic detailed student metrics (Chuyên cần & Học tập) */}
          <div className="space-y-6 lg:col-span-2" id="student-profile-right-col">
            {selectedStudentStat ? (
              <>
                {/* 1. Scorecard grid specifically for this student */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="individual-scorecards">
                  
                  {/* Chuyên cần */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between" id="indiv-att-card">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Điểm chuyên cần</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <p className="text-2xl font-black text-slate-900">
                        {selectedStudentStat.totalDays > 0 ? `${selectedStudentStat.rate.toFixed(1)}%` : '100%'}
                      </p>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 mt-2 flex flex-col gap-1">
                      <span>Đi học đúng giờ: <strong className="text-emerald-600">{selectedStudentStat.present}</strong>/{selectedStudentStat.totalDays} ngày</span>
                      <span>Đi trễ: <strong className="text-amber-500">{selectedStudentStat.late}</strong> ngày</span>
                    </p>
                  </div>

                  {/* GPA */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between" id="indiv-gpa-card">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">GPA học lực</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <p className="text-2xl font-black text-slate-900">
                        {selectedStudentStat.gpa === null ? '—' : selectedStudentStat.gpa.toFixed(2)}
                      </p>
                      <span className="text-xs text-slate-400">/ 10</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedStudentStat.classification.bg}`}>
                        {selectedStudentStat.classification.text}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">Xếp hạng tháng</span>
                    </div>
                  </div>

                  {/* Học phí */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between" id="indiv-tuition-card">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tình trạng học phí</span>
                    <div className="mt-2">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full inline-block ${
                        selectedStudentStat.tuitionPaid 
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                          : 'text-orange-700 bg-orange-50 border border-orange-200'
                      }`}>
                        {selectedStudentStat.tuitionPaid ? 'ĐÃ HOÀN THÀNH' : 'CHƯA THANH TOÁN'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 mt-2.5">
                      Định mức: {selectedStudentStat.tuitionAmount.toLocaleString('vi-VN')} đ
                    </p>
                  </div>

                </div>

                {/* 2. Detailed Grades Performance Chart & Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs" id="individual-grades-card">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-600" />
                    KẾT QUẢ ĐIỂM SỐ CÁC MÔN HỌC CHI TIẾT
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center" id="indiv-grades-comparison">
                    {/* Recharts Radar Chart */}
                    <div className="h-[240px] w-full" id="radar-chart-container">
                      {studentSubjectGradesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={studentSubjectGradesData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                            <Radar name="Điểm TB môn" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
                            <Tooltip formatter={(value) => [`${value} đ`, 'Trung bình']} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                          Chưa nhập điểm số
                        </div>
                      )}
                    </div>

                    {/* Simple grade listing table */}
                    <div className="space-y-3" id="grades-summary-list">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Điểm tổng kết môn học</span>
                      <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1" id="grades-scroll-box">
                        {selectedStudentStat.student.grades.map(g => {
                          const avg = getSubjectAverage(g);
                          const finalDisplay = (g.final !== undefined && g.final !== null) ? g.final : '—';
                          return (
                            <div key={g.subject} className="flex justify-between items-center py-2 text-xs">
                              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                {g.subject}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 text-[11px]">Thi cuối kỳ: <strong className="text-slate-800">{finalDisplay}</strong></span>
                                <span className={`font-black text-xs px-2 py-0.5 rounded ${
                                  avg === null ? 'bg-slate-50 text-slate-400' :
                                  avg >= 8.0 ? 'bg-blue-50 text-blue-700' : avg >= 6.5 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  TB: {avg === null ? '—' : avg.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Attendance logs and Calendar for the student */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs" id="individual-attendance-card">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    LỊCH SỬ ĐIỂM DANH TRONG THÁNG ({selectedStudentAttendanceLogs.length} ngày đã điểm danh)
                  </h3>

                  {selectedStudentAttendanceLogs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1" id="attendance-logs-grid">
                      {selectedStudentAttendanceLogs.map((log) => (
                        <div 
                          key={log.date}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${log.colorClass}`}
                        >
                          <div className="font-bold flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 opacity-70" />
                            {new Date(log.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                          <span className="font-black tracking-wide text-[10px] uppercase">
                            {log.status === 'present' ? 'Có mặt' : log.status === 'late' ? 'Đi trễ' : log.status === 'excused' ? 'Phép' : 'Vắng'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic text-xs flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <AlertCircle className="h-6 w-6 text-slate-300" />
                      <span>Không có dữ liệu điểm danh nào trong {MONTHS_CONFIG.find(m => m.value === selectedMonth)?.label} cho học sinh này.</span>
                      {isTeacher && (
                        <button
                          type="button"
                          onClick={handleAutoGenerateData}
                          className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Tạo dữ liệu điểm danh tháng tự động
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 italic text-xs">
                Vui lòng chọn học sinh hợp lệ để xem báo cáo thống kê.
              </div>
            )}
          </div>

        </div>
      )}

      {/* LEDGER PRINT MODAL (Vietnamese School Attendance Book Style) */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:static" id="ledger-modal-backdrop">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:h-auto print:rounded-none" id="ledger-modal">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl print:hidden">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Xem Trước & In Sổ Điểm Danh Lớp 12A4</h3>
                  <p className="text-xs text-slate-500">Mẫu sổ điểm danh chính thức chuẩn chỉnh của nhà trường - Tự động tối ưu hóa trong 1 trang A4 Landscape</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Month dropdown inside modal */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs mr-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                  >
                    {MONTHS_CONFIG.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handlePrintLedger}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  In ngay (Ctrl+P)
                </button>
                <button
                  type="button"
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable container for preview */}
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
              {/* Screen Preview Card (styled to look like physical A4 page) */}
              <div 
                className="bg-white p-6 shadow-xl rounded-md overflow-hidden flex flex-col justify-between border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0"
                style={{
                  width: '1120px',
                  minWidth: '1120px',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Printable Area with exact id */}
                <div id="attendance-ledger-print-area" className="w-full text-black bg-white font-sans leading-tight">
                  <style>{`
                    @media print {
                      body * {
                        visibility: hidden !important;
                      }
                      #attendance-ledger-print-area, #attendance-ledger-print-area * {
                        visibility: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                      }
                      #attendance-ledger-print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 285mm !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        transform: scale(0.94);
                        transform-origin: top left;
                      }
                      @page {
                        size: A4 landscape;
                        margin: 4mm 6mm;
                      }
                    }
                  `}</style>

                  {/* Header Title Block */}
                  <div className="text-center mb-4">
                    <h1 className="text-[#ff0000] font-black text-lg uppercase tracking-wider">
                      DANH SÁCH ĐIỂM DANH HỌC SINH
                    </h1>
                    <h2 className="text-[#ff0000] font-bold text-sm mt-0.5">
                      Lớp 12A4 _ Năm học: 2026 - 2027
                    </h2>
                  </div>

                  {/* Metadata & Legend row */}
                  <div className="flex justify-between items-center mb-1 px-1">
                    <span className="text-blue-700 font-extrabold text-xs">
                      Tháng {ledgerMonthLabel} năm {ledgerYearLabel}
                    </span>
                    <span className="text-blue-700 font-extrabold text-xs">
                      Ghi chú: vắng có phép: P, Vắng không phép: K, Đi học trễ: T
                    </span>
                  </div>

                  {/* Excel Ledger Grid Table */}
                  <div className="w-full overflow-hidden">
                    <table className="w-full border-collapse border border-[#00e1ff] text-center text-[8.5px] font-sans">
                      <thead>
                        <tr className="h-7">
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-white font-bold px-1 text-center text-[9px] w-[30px] select-none">
                            STT
                          </th>
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-white font-bold px-2 text-left text-[9px] w-[180px] select-none">
                            Họ và tên
                          </th>
                          {calendarDaysOfMonth.map(day => (
                            <th key={`day-h-${day.dayNum}`} className="border border-[#00e1ff] bg-[#0070c0] text-[#ffff00] font-extrabold text-[8px] w-[20px] p-0 select-none">
                              {day.dayNum}
                            </th>
                          ))}
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-[#ffff00] font-bold px-0.5 text-center text-[7.5px] w-[35px] select-none leading-none">
                            Vắng<br/>CP
                          </th>
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-[#ffff00] font-bold px-0.5 text-center text-[7.5px] w-[35px] select-none leading-none">
                            Vắng<br/>KP
                          </th>
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-[#ffff00] font-bold px-0.5 text-center text-[7.5px] w-[30px] select-none leading-none">
                            TRỄ
                          </th>
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-white font-bold px-0.5 text-center text-[7.5px] w-[45px] select-none leading-none">
                            Tổng buổi<br/>vắng
                          </th>
                          <th rowSpan={2} className="border border-[#00e1ff] bg-[#0070c0] text-white font-bold px-0.5 text-center text-[7.5px] w-[45px] select-none leading-none">
                            Tổng buổi<br/>Trễ
                          </th>
                        </tr>
                        <tr className="h-5">
                          {calendarDaysOfMonth.map(day => (
                            <th 
                              key={`wkday-h-${day.dayNum}`} 
                              className={`border border-[#00e1ff] bg-[#0070c0] text-white font-extrabold text-[7px] p-0 select-none ${
                                day.weekday === 'CN' ? 'bg-red-700 text-white' : ''
                              }`}
                            >
                              {day.weekday}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {studentMonthlyStats.map((stat, idx) => {
                          const totalAbsences = stat.excused + stat.absent;
                          return (
                            <tr key={stat.id} className="hover:bg-slate-50 h-[17px]">
                              {/* STT */}
                              <td className="border border-[#00e1ff] text-[#ff0000] font-black text-center text-[9px] select-none">
                                {idx + 1}
                              </td>
                              {/* Họ và tên */}
                              <td className="border border-[#00e1ff] text-slate-900 font-semibold text-left px-1.5 text-[8.5px] truncate">
                                {stat.name}
                              </td>
                              {/* Attendance values for each calendar day */}
                              {calendarDaysOfMonth.map(day => {
                                const status = stat.student.attendance[day.dateStr];
                                let displayChar = '';
                                let colorClass = '';
                                if (status === 'absent') {
                                  displayChar = 'K';
                                  colorClass = 'text-red-600 font-black text-[9px] bg-red-50/30';
                                } else if (status === 'excused') {
                                  displayChar = 'P';
                                  colorClass = 'text-blue-600 font-black text-[9px] bg-blue-50/30';
                                } else if (status === 'late') {
                                  displayChar = 'T';
                                  colorClass = 'text-amber-500 font-black text-[9px] bg-amber-50/20';
                                } else if (day.weekday === 'CN' || day.weekday === 'T7') {
                                  colorClass = 'bg-slate-50/50';
                                }
                                return (
                                  <td key={`cell-${stat.id}-${day.dayNum}`} className={`border border-[#00e1ff] text-center p-0 ${colorClass}`}>
                                    {displayChar}
                                  </td>
                                );
                              })}
                              {/* Summary columns */}
                              <td className="border border-[#00e1ff] text-[#ff0000] font-bold text-center text-[8.5px] bg-[#fdfaf2]">
                                {stat.excused > 0 ? stat.excused : ''}
                              </td>
                              <td className="border border-[#00e1ff] text-[#ff0000] font-bold text-center text-[8.5px] bg-[#fdfaf2]">
                                {stat.absent > 0 ? stat.absent : ''}
                              </td>
                              <td className="border border-[#00e1ff] text-[#ff0000] font-bold text-center text-[8.5px] bg-[#fdfaf2]">
                                {stat.late > 0 ? stat.late : ''}
                              </td>
                              <td className="border border-[#00e1ff] text-[#ff0000] font-extrabold text-center text-[8.5px] bg-[#f5f8fc]">
                                {totalAbsences > 0 ? totalAbsences : ''}
                              </td>
                              <td className="border border-[#00e1ff] text-[#ff0000] font-extrabold text-center text-[8.5px] bg-[#f5f8fc]">
                                {stat.late > 0 ? stat.late : ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footnote / Signature row */}
                  <div className="flex justify-between items-center mt-3 text-[9px] text-slate-500 px-2 italic">
                    <span>Mẫu in xuất ngày {new Date().toLocaleDateString('vi-VN')}</span>
                    <span>Học viên đạt tỷ lệ chuyên cần cao đóng góp vào điểm thi đua của lớp 12A4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl print:hidden">
              <span className="text-xs text-slate-500 font-medium">💡 Gợi ý: Khi in, chọn thiết lập <strong>Khổ ngang (Landscape)</strong> và bật <strong>In màu nền (Background graphics)</strong> để hiển thị chính xác các ô màu của bảng.</span>
              <button
                type="button"
                onClick={() => setIsLedgerModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
