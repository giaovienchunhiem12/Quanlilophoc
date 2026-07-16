import React, { useState, useRef } from 'react';
import { Student, User, SubjectGrade } from '../types';
import { exportGradesToExcel, downloadGradesTemplate } from '../utils/excelExport';
import * as XLSX from 'xlsx';
import { 
  GraduationCap, 
  Download, 
  Plus, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Save, 
  X, 
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Upload,
  Trash2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface GradeTrackerProps {
  currentUser: User;
  students: Student[];
  onUpdateGrades: (studentId: string, subject: string, updatedGrades: Partial<SubjectGrade>) => void;
  onBulkUpdateGrades?: (updates: { studentId: string, subject: string, grades: Partial<SubjectGrade> }[]) => void;
  onClearAllGrades?: (subject: string) => void;
}

export default function GradeTracker({ 
  currentUser, 
  students, 
  onUpdateGrades,
  onBulkUpdateGrades,
  onClearAllGrades
}: GradeTrackerProps) {
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán');
  const [selectedSemester, setSelectedSemester] = useState<'HK1' | 'HK2'>('HK1');

  // File import & clear states
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Grade edit states
  const [oralInput, setOralInput] = useState('');
  const [m15Input1, setM15Input1] = useState('');
  const [m15Input2, setM15Input2] = useState('');
  const [m15Input3, setM15Input3] = useState('');
  const [m45Input, setM45Input] = useState('');
  const [finalInput, setFinalInput] = useState<number | ''>('');

  // Helper: compute single subject average (returns null if no grades are entered)
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

  // Class statistics
  const gpas = students.map(s => getStudentGPA(s));
  const activeGpas = gpas.filter((gpa): gpa is number => gpa !== null);
  const classAverageGPA = activeGpas.length > 0 ? (activeGpas.reduce((a, b) => a + b, 0) / activeGpas.length) : 0;

  // Grade classification counts
  let gioicount = 0; // >= 8.0
  let khacount = 0;  // 6.5 - 8.0
  let tbcount = 0;   // 5.0 - 6.5
  let yeucount = 0;  // < 5.0

  activeGpas.forEach(gpa => {
    if (gpa >= 8.0) gioicount++;
    else if (gpa >= 6.5) khacount++;
    else if (gpa >= 5.0) tbcount++;
    else yeucount++;
  });

  // Recharts Pie Chart Data
  const chartData = [
    { name: 'Học sinh Giỏi (>= 8.0)', value: gioicount, color: '#3b82f6' },
    { name: 'Học sinh Khá (6.5 - 8.0)', value: khacount, color: '#10b981' },
    { name: 'Học sinh Trung Bình (5.0 - 6.5)', value: tbcount, color: '#f59e0b' },
    { name: 'Học sinh Yếu (< 5.0)', value: yeucount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Subject options expanded to include all core academic ones from the standard table
  const availableSubjects = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Lịch sử', 'Địa lý', 'GDKT&PL'];

  const getStudentSubjectGrade = (student: Student, subject: string, sem: 'HK1' | 'HK2'): SubjectGrade => {
    let matchedSubject = subject;
    if (subject === 'Ngữ Văn') matchedSubject = 'Ngữ văn';
    if (subject === 'Ngoại ngữ 1') matchedSubject = 'Tiếng Anh';
    if (subject === 'Vật lí') matchedSubject = 'Vật lý';
    if (subject === 'Sinh học') matchedSubject = 'Hóa học';
    if (subject === 'Địa lí') matchedSubject = 'Địa lý';

    // 1. Try to find semester-specific grade
    const semGrade = student.grades.find(g => g.subject === matchedSubject && g.semester === sem);
    if (semGrade) return semGrade;

    // 2. Fall back to baseline grade (which is currently inside initialStudents)
    const baselineGrade = student.grades.find(g => g.subject === matchedSubject && !g.semester);
    if (baselineGrade) {
      const baseAvg = getSubjectAverage(baselineGrade) || 0;
      let adjustedFinal = baselineGrade.final;
      if (sem === 'HK1') {
        adjustedFinal = Math.max(3.0, Math.min(10.0, Math.round((baseAvg - 0.4) * 10) / 10));
      } else {
        adjustedFinal = Math.max(3.0, Math.min(10.0, Math.round((baseAvg + 0.2) * 10) / 10));
      }
      return {
        ...baselineGrade,
        semester: sem,
        final: adjustedFinal
      };
    }

    // 3. If neither exists, return empty grades
    return {
      subject: matchedSubject,
      semester: sem,
      oral: [],
      m15: [],
      m45: []
    };
  };

  const handleStartEdit = (student: Student) => {
    setEditingStudentId(student.id);
    const gradeObj = getStudentSubjectGrade(student, selectedSubject, selectedSemester);
    setOralInput(gradeObj.oral.join(', '));
    setM15Input1(gradeObj.m15[0] !== undefined ? gradeObj.m15[0].toString() : '');
    setM15Input2(gradeObj.m15[1] !== undefined ? gradeObj.m15[1].toString() : '');
    setM15Input3(gradeObj.m15[2] !== undefined ? gradeObj.m15[2].toString() : '');
    setM45Input(gradeObj.m45.join(', '));
    setFinalInput(gradeObj.final !== undefined ? gradeObj.final : '');
  };

  const handleSaveGrades = (studentId: string) => {
    // Parse inputs
    const oralArr = oralInput.split(',').map(s => parseFloat(s.trim())).filter(num => !isNaN(num) && num >= 0 && num <= 10);
    
    const m15Arr: number[] = [];
    const val1 = parseFloat(m15Input1.trim());
    const val2 = parseFloat(m15Input2.trim());
    const val3 = parseFloat(m15Input3.trim());
    if (!isNaN(val1) && val1 >= 0 && val1 <= 10) m15Arr.push(val1);
    if (!isNaN(val2) && val2 >= 0 && val2 <= 10) m15Arr.push(val2);
    if (!isNaN(val3) && val3 >= 0 && val3 <= 10) m15Arr.push(val3);

    const m45Arr = m45Input.split(',').map(s => parseFloat(s.trim())).filter(num => !isNaN(num) && num >= 0 && num <= 10);
    const finalVal = typeof finalInput === 'number' && finalInput >= 0 && finalInput <= 10 ? finalInput : undefined;

    let matchedSubject = selectedSubject;
    if (selectedSubject === 'Ngữ Văn') matchedSubject = 'Ngữ văn';
    if (selectedSubject === 'Ngoại ngữ 1') matchedSubject = 'Tiếng Anh';
    if (selectedSubject === 'Vật lí') matchedSubject = 'Vật lý';
    if (selectedSubject === 'Sinh học') matchedSubject = 'Hóa học';
    if (selectedSubject === 'Địa lí') matchedSubject = 'Địa lý';

    onUpdateGrades(studentId, matchedSubject, {
      semester: selectedSemester,
      oral: oralArr,
      m15: m15Arr,
      m45: m45Arr,
      final: finalVal
    });

    setEditingStudentId(null);
  };

  const handleImportGradesFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'File Excel không có dữ liệu điểm!'
          });
          return;
        }

        // Validate structure
        const headers = Object.keys(jsonData[0]);
        const hasId = headers.includes('Mã Học Sinh') || headers.includes('Mã HS');

        if (!hasId) {
          setImportStatus({
            type: 'error',
            message: 'File mẫu sai định dạng hoặc thiếu cột bắt buộc: Mã Học Sinh'
          });
          return;
        }

        const updates: { studentId: string, subject: string, grades: Partial<SubjectGrade> }[] = [];

        for (let row of jsonData) {
          const studentId = (row['Mã Học Sinh'] || row['Mã HS'])?.toString().trim();
          if (!studentId) continue;

          // Resolve subject & semester
          const rawSubject = (row['Môn Học'] || row['Môn'] || selectedSubject)?.toString().trim();
          let parsedSubject = rawSubject;
          if (rawSubject === 'Ngữ Văn') parsedSubject = 'Ngữ văn';
          if (rawSubject === 'Ngoại ngữ 1') parsedSubject = 'Tiếng Anh';
          if (rawSubject === 'Vật lí') parsedSubject = 'Vật lý';
          if (rawSubject === 'Sinh học') parsedSubject = 'Hóa học';
          if (rawSubject === 'Địa lí') parsedSubject = 'Địa lý';

          const rawSem = (row['Học Kỳ'] || row['Học kỳ'] || selectedSemester)?.toString().trim();
          const parsedSemester: 'HK1' | 'HK2' = (rawSem === 'HK2' || rawSem === 'Học kỳ II' || rawSem === 'Học Kỳ II') ? 'HK2' : 'HK1';

          // Helper to parse comma separated grades
          const parseGradesString = (val: any): number[] => {
            if (val === undefined || val === null) return [];
            if (typeof val === 'number') return [val];
            return val.toString().split(/[,;-]/)
              .map((s: string) => parseFloat(s.trim()))
              .filter((num: number) => !isNaN(num) && num >= 0 && num <= 10);
          };

          const oralKey = headers.find(h => h.includes('Điểm Miệng') || h.toLowerCase() === 'miệng');
          const m45Key = headers.find(h => h.includes('Điểm 1 Tiết') || h.toLowerCase().includes('1 tiết') || h.toLowerCase().includes('45 phút') || h.toLowerCase().includes('45p'));
          const finalKey = headers.find(h => h.includes('Điểm Thi HK') || h.toLowerCase().includes('thi hk') || h.toLowerCase().includes('cuối kỳ') || h.toLowerCase().includes('cuối kì'));

          const oral = oralKey ? parseGradesString(row[oralKey]) : [];
          
          let m15: number[] = [];
          const m15_1_Key = headers.find(h => (h.includes('15 Phút') || h.includes('15phút') || h.includes('15p')) && (h.includes('lần 1') || h.includes('Lần 1') || h.includes('1') || h.includes('cột 1') || h.includes('Cột 1')));
          const m15_2_Key = headers.find(h => (h.includes('15 Phút') || h.includes('15phút') || h.includes('15p')) && (h.includes('lần 2') || h.includes('Lần 2') || h.includes('2') || h.includes('cột 2') || h.includes('Cột 2')));
          const m15_3_Key = headers.find(h => (h.includes('15 Phút') || h.includes('15phút') || h.includes('15p')) && (h.includes('lần 3') || h.includes('Lần 3') || h.includes('3') || h.includes('cột 3') || h.includes('Cột 3')));

          if (m15_1_Key || m15_2_Key || m15_3_Key) {
            if (m15_1_Key) {
              const val1 = parseGradesString(row[m15_1_Key]);
              if (val1.length > 0) m15.push(val1[0]);
            }
            if (m15_2_Key) {
              const val2 = parseGradesString(row[m15_2_Key]);
              if (val2.length > 0) m15.push(val2[0]);
            }
            if (m15_3_Key) {
              const val3 = parseGradesString(row[m15_3_Key]);
              if (val3.length > 0) m15.push(val3[0]);
            }
          } else {
            const m15Key = headers.find(h => h.includes('Điểm 15 Phút') || h.toLowerCase().includes('15phút') || h.toLowerCase().includes('15p'));
            m15 = m15Key ? parseGradesString(row[m15Key]) : [];
          }

          const m45 = m45Key ? parseGradesString(row[m45Key]) : [];
          
          let final: number | undefined = undefined;
          if (finalKey) {
            const rawVal = row[finalKey];
            if (rawVal !== undefined && rawVal !== null && rawVal.toString().trim() !== '') {
              const parsedFinal = parseFloat(rawVal);
              if (!isNaN(parsedFinal) && parsedFinal >= 0 && parsedFinal <= 10) {
                final = parsedFinal;
              }
            }
          }

          updates.push({
            studentId,
            subject: parsedSubject,
            grades: {
              semester: parsedSemester,
              oral,
              m15,
              m45,
              final
            }
          });
        }

        if (updates.length > 0 && onBulkUpdateGrades) {
          onBulkUpdateGrades(updates);
          setImportStatus({
            type: 'success',
            message: `Cập nhật thành công điểm số cho ${updates.length} học sinh!`
          });
        } else {
          setImportStatus({
            type: 'error',
            message: 'Không tìm thấy dòng dữ liệu hợp lệ nào để cập nhật!'
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: 'Có lỗi xảy ra khi đọc file Excel: ' + err.message
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleClearGradesConfirm = () => {
    setShowClearConfirm(true);
  };

  const executeClearGrades = () => {
    if (onClearAllGrades) {
      onClearAllGrades(selectedSubject);
      setImportStatus({
        type: 'success',
        message: `Đã xóa toàn bộ điểm môn ${selectedSubject} thành công!`
      });
    }
    setShowClearConfirm(false);
  };

  // Find logged in student results (for student/parent view)
  const userStudent = currentUser.studentId ? students.find(s => s.id === currentUser.studentId) : null;
  const isStudentOrParent = currentUser.role === 'student' || currentUser.role === 'parent';
  const displayedStudents = isStudentOrParent
    ? (userStudent ? [userStudent] : (students.length > 0 ? [students[0]] : []))
    : students;

  const [viewMode, setViewMode] = useState<'comprehensive' | 'detailed'>('comprehensive');

  // Helper to calculate semester grade deterministically or using saved component grades
  const getSemGrade = (student: Student, subject: string, sem: 'HK1' | 'HK2' | 'CN'): { val: number | string, type: 'grade' | 'evaluation' } => {
    const isEval = ['Giáo dục thể chất', 'GDQP-AN', 'HĐTN', 'GDĐP'].includes(subject);
    if (isEval) {
      return { val: 'Đ', type: 'evaluation' };
    }

    let matchedSubject = subject;
    if (subject === 'Ngữ Văn') matchedSubject = 'Ngữ văn';
    if (subject === 'Ngoại ngữ 1') matchedSubject = 'Tiếng Anh';
    if (subject === 'Vật lí') matchedSubject = 'Vật lý';
    if (subject === 'Sinh học') matchedSubject = 'Hóa học';
    if (subject === 'Địa lí') matchedSubject = 'Địa lý';

    const getSemValueSingle = (s: 'HK1' | 'HK2'): number => {
      const semGradeObj = student.grades.find(g => g.subject === matchedSubject && g.semester === s);
      if (semGradeObj) {
        const avg = getSubjectAverage(semGradeObj);
        return avg === null ? 0 : Math.round(avg * 10) / 10;
      }
      return 0;
    };

    if (sem === 'HK1') {
      return { val: getSemValueSingle('HK1'), type: 'grade' };
    } else if (sem === 'HK2') {
      return { val: getSemValueSingle('HK2'), type: 'grade' };
    } else {
      const hk1 = getSemValueSingle('HK1');
      const hk2 = getSemValueSingle('HK2');
      if (hk1 === 0 || hk2 === 0) return { val: 0, type: 'grade' };
      const semVal = Math.round(((hk1 + hk2 * 2) / 3) * 10) / 10;
      return { val: semVal, type: 'grade' };
    }
  };

  const getAbsences = (student: Student, sem: 'HK1' | 'HK2' | 'CN') => {
    const cpTotal = Object.values(student.attendance || {}).filter(status => status === 'excused').length;
    const kpTotal = Object.values(student.attendance || {}).filter(status => status === 'absent').length;

    if (sem === 'HK1') {
      return { cp: Math.floor(cpTotal * 0.4), kp: Math.floor(kpTotal * 0.4) };
    } else if (sem === 'HK2') {
      return { cp: Math.ceil(cpTotal * 0.6), kp: Math.ceil(kpTotal * 0.6) };
    } else {
      return { cp: cpTotal, kp: kpTotal };
    }
  };

  const getSemesterGPAAndRank = (student: Student, sem: 'HK1' | 'HK2' | 'CN') => {
    const numericalSubjects = ['Ngữ Văn', 'Toán', 'Ngoại ngữ 1', 'Vật lí', 'Sinh học', 'Lịch sử', 'Địa lí', 'GDKT&PL'];
    const grades = numericalSubjects.map(sub => getSemGrade(student, sub, sem).val as number).filter(v => v > 0);
    const gpa = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    
    const minGrade = grades.length > 0 ? Math.min(...grades) : 0;
    
    let rank = 'Chưa đạt';
    if (grades.length < numericalSubjects.length) {
      rank = 'Chưa xét';
    } else if (gpa >= 8.0 && minGrade >= 6.5) {
      rank = 'Tốt';
    } else if (gpa >= 6.5 && minGrade >= 5.0) {
      rank = 'Khá';
    } else if (gpa >= 5.0 && minGrade >= 3.5) {
      rank = 'Đạt';
    } else {
      rank = 'Chưa đạt';
    }

    return { gpa, rank };
  };

  const getConduct = (student: Student, sem: 'HK1' | 'HK2' | 'CN') => {
    const kp = getAbsences(student, sem).kp;
    if (kp > 3) return 'Đạt';
    if (kp > 1) return 'Khá';
    return 'Tốt';
  };

  const getAwardTitle = (student: Student, sem: 'HK1' | 'HK2' | 'CN') => {
    const { gpa, rank } = getSemesterGPAAndRank(student, sem);
    const conduct = getConduct(student, sem);
    
    if (rank === 'Tốt' && conduct === 'Tốt') {
      if (gpa >= 9.0) return 'Học sinh Xuất sắc';
      return 'Học sinh Giỏi';
    }
    return 'Chưa xét';
  };

  const getPromotionStatus = (student: Student, sem: 'HK1' | 'HK2' | 'CN') => {
    if (sem !== 'CN') return '—';
    const { rank } = getSemesterGPAAndRank(student, 'CN');
    if (rank === 'Chưa đạt') return 'Rèn luyện hè';
    return 'Được lên lớp';
  };

  const comprehensiveSubjects = [
    { id: 'Ngữ Văn', name: 'Ngữ Văn' },
    { id: 'Toán', name: 'Toán' },
    { id: 'Ngoại ngữ 1', name: 'Ngoại ngữ 1' },
    { id: 'Giáo dục thể chất', name: 'GDTC', tooltip: 'Giáo dục thể chất' },
    { id: 'GDQP-AN', name: 'GDQP', tooltip: 'Giáo dục quốc phòng - an ninh' },
    { id: 'HĐTN', name: 'HĐTN', tooltip: 'Hoạt động trải nghiệm, hướng nghiệp' },
    { id: 'GDĐP', name: 'GDĐP', tooltip: 'Giáo dục địa phương' },
    { id: 'Vật lí', name: 'Vật lí' },
    { id: 'Sinh học', name: 'Sinh học' },
    { id: 'Lịch sử', name: 'Lịch sử' },
    { id: 'Địa lí', name: 'Địa lí' },
    { id: 'GDKT&PL', name: 'GDKT&PL', tooltip: 'Giáo dục Kinh tế & Pháp luật' }
  ];

  return (
    <div className="space-y-6" id="grades-tab">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="grades-header">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-600" />
            Kết Quả Học Tập Lớp 12A4
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp kết quả học tập định kỳ môn Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học
          </p>
        </div>

        <button
          type="button"
          id="export-grades-btn"
          onClick={() => exportGradesToExcel(students, '12A4')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Xuất Bảng Điểm Excel
        </button>
      </div>

      {/* Role specific view: STUDENT / PARENT PROFILE SUMMARY */}
      {userStudent && (
        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-sm space-y-4 border-[2px] border-[#8df2f0]" id="student-gpa-summary">
          <div className="flex justify-between items-center border-b border-indigo-500 pb-3">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider opacity-90">Kết quả học tập cá nhân</p>
              <h3 className="text-lg font-bold font-display mt-0.5">{userStudent.name} ({userStudent.id})</h3>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90 font-bold">Điểm trung bình (GPA)</p>
              <p className="text-3xl font-black font-display mt-0.5">
                {(() => {
                  const gpa = getStudentGPA(userStudent);
                  return gpa === null ? '—' : gpa.toFixed(2);
                })()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3" id="student-gpa-grid">
            {userStudent.grades.map((g, idx) => {
              const avg = getSubjectAverage(g);
              const avgDisplay = avg === null ? '—' : avg.toFixed(1);
              return (
                <div key={idx} className="bg-white/10 p-3.5 rounded-lg border border-white/10 text-center space-y-1">
                  <p className="text-xs font-bold opacity-90">{g.subject}</p>
                  <p className="text-xl font-extrabold font-display">{avgDisplay}</p>
                  <p className="text-[10px] opacity-80">Thi HK: {g.final !== undefined && g.final !== null ? g.final : '—'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics distribution dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="grades-analytics">
        
        {/* Left: Academic cards */}
        <div className="space-y-4 lg:col-span-1" id="grades-cards-box">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4" id="grades-gpa-card">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Trung Bình Cả Lớp</p>
              <h3 className="text-2xl font-black text-indigo-600 font-display mt-0.5">{classAverageGPA.toFixed(2)}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Xếp loại học tập bình quân: <span className="font-bold text-emerald-600">Khá</span></p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm" id="grades-breakdown-card">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Xếp loại thi đua lớp học</p>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-indigo-600">
                  <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Giỏi (GPA &ge; 8.0)
                </span>
                <span className="font-bold text-slate-700">{gioicount} học sinh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Khá (6.5 - 8.0)
                </span>
                <span className="font-bold text-slate-700">{khacount} học sinh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Trung bình (5.0 - 6.5)
                </span>
                <span className="font-bold text-slate-700">{tbcount} học sinh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold text-rose-600">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Yếu (&lt; 5.0)
                </span>
                <span className="font-bold text-slate-700">{yeucount} học sinh</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Pie distribution chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between" id="grades-chart-box">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Biểu đồ phân loại học tập (%)</p>
          
          <div className="h-44 w-full" id="pie-chart-responsive">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">Chưa có dữ liệu biểu diễn</div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium border-t border-slate-200 pt-3" id="pie-chart-legends">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500"></span> Giỏi</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Khá</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Trung bình</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Yếu</span>
          </div>
        </div>

      </div>

      {/* View Mode Switcher */}
      <div className="flex border-b border-slate-200" id="grade-view-mode-tabs">
        <button
          type="button"
          onClick={() => setViewMode('comprehensive')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            viewMode === 'comprehensive'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Bảng Điểm Tổng Hợp (HK1, HK2, Cả năm)
        </button>
        <button
          type="button"
          onClick={() => setViewMode('detailed')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            viewMode === 'detailed'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Sổ Điểm Thành Phần Chi Tiết (Môn học)
        </button>
      </div>

      {viewMode === 'comprehensive' ? (
        /* Comprehensive Transcript Table (Matches Uploaded Model Template) */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="gradebook-comprehensive">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50" id="comprehensive-controls">
            <div>
              <h3 className="font-bold text-slate-900 font-display text-sm uppercase tracking-wider">Bảng Kết Quả Học Tập Học Kỳ & Cả Năm</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bảng điểm tổng hợp tất cả các môn học, chuyên cần, xếp loại học lực, rèn luyện và danh hiệu thi đua lớp 12A4
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto" id="comprehensive-table-wrapper">
            <table className="min-w-full divide-y divide-slate-300 text-xs border-collapse">
              <thead className="bg-slate-100 font-bold text-slate-700 text-center uppercase tracking-wider border-b border-slate-300">
                {/* Row 1 Headers */}
                <tr className="divide-x divide-slate-300">
                  <th rowSpan={2} className="px-3 py-4 text-left sticky left-0 bg-slate-100 z-10 w-40 min-w-[150px] border-r border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-black">Họ và tên</th>
                  <th rowSpan={2} className="px-2 py-4 border-r border-slate-300 w-16 font-black">HK</th>
                  {comprehensiveSubjects.map((sub) => (
                    <th 
                      key={sub.id} 
                      rowSpan={2} 
                      title={sub.tooltip || sub.name}
                      className="px-1 py-4 border-r border-slate-300 min-w-[65px] font-black hover:bg-slate-200/50 transition-colors cursor-help"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-indigo-700">{sub.name}</span>
                        {sub.tooltip && <span className="text-[8px] text-slate-400 capitalize normal-case font-normal block mt-0.5">{sub.tooltip.substring(0, 8)}...</span>}
                      </div>
                    </th>
                  ))}
                  <th colSpan={2} className="px-1 py-1.5 border-b border-slate-300 text-center border-r border-slate-300 font-black text-[9px] bg-amber-50 text-amber-800">Nghỉ</th>
                  <th rowSpan={2} className="px-2 py-4 border-r border-slate-300 min-w-[65px] font-black">KQHT</th>
                  <th rowSpan={2} className="px-2 py-4 border-r border-slate-300 min-w-[85px] font-black">KQ rèn luyện</th>
                  <th rowSpan={2} className="px-2 py-4 border-r border-slate-300 min-w-[110px] font-black">Danh hiệu</th>
                  <th rowSpan={2} className="px-2 py-4 min-w-[110px] font-black">Trạng thái lên lớp</th>
                </tr>
                {/* Row 2 Sub-headers */}
                <tr className="divide-x divide-slate-300 bg-amber-50/50 text-amber-900 border-b border-slate-300 text-[9px]">
                  <th className="px-1 py-1 border-r border-slate-300 text-center font-bold">CP</th>
                  <th className="px-1 py-1 border-r border-slate-300 text-center font-bold">KP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 bg-white text-slate-600 text-center">
                {displayedStudents.map((student, idx) => {
                  const semesters: ('HK1' | 'HK2' | 'CN')[] = ['HK1', 'HK2', 'CN'];
                  
                  return semesters.map((sem, sIdx) => {
                    const absences = getAbsences(student, sem);
                    const { gpa, rank } = getSemesterGPAAndRank(student, sem);
                    const conduct = getConduct(student, sem);
                    const award = getAwardTitle(student, sem);
                    const promotion = getPromotionStatus(student, sem);

                    return (
                      <tr 
                        key={`${student.id}-${sem}`} 
                        className={`hover:bg-slate-50/70 border-b border-slate-200 transition-colors divide-x divide-slate-200 ${
                          sem === 'CN' ? 'bg-indigo-50/30 font-bold text-slate-900' : ''
                        }`}
                      >
                        {/* Student name, spans 3 rows */}
                        {sIdx === 0 && (
                          <td 
                            rowSpan={3} 
                            className="px-3 py-4 text-left sticky left-0 bg-white font-bold text-slate-800 z-10 shadow-[3px_0_6px_rgba(0,0,0,0.03)] border-r border-slate-300 align-middle w-40 min-w-[150px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono font-medium">{idx + 1}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900">{student.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-medium">{student.id}</span>
                              </div>
                            </div>
                          </td>
                        )}
                        
                        {/* Semester column */}
                        <td className={`px-2 py-3 font-bold border-r border-slate-300 align-middle text-[11px] ${
                          sem === 'HK1' ? 'text-blue-600 bg-blue-50/20' :
                          sem === 'HK2' ? 'text-purple-600 bg-purple-50/20' : 'text-emerald-700 bg-emerald-50/40 font-black'
                        }`}>
                          {sem}
                        </td>

                        {/* Subject Grades */}
                        {comprehensiveSubjects.map((sub) => {
                          const gradeInfo = getSemGrade(student, sub.id, sem);
                          const isEvaluation = gradeInfo.type === 'evaluation';
                          const score = gradeInfo.val;

                          if (isEvaluation) {
                            return (
                              <td key={sub.id} className="px-1 py-3 border-r border-slate-200 font-bold text-slate-700 align-middle">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  score === 'Đ' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {score}
                                </span>
                              </td>
                            );
                          } else {
                            const numScore = score as number;
                            return (
                              <td key={sub.id} className="px-1 py-3 border-r border-slate-200 align-middle">
                                <span className={`${
                                  sem === 'CN' ? 'font-black text-slate-900 text-[12px]' : 'font-medium text-slate-700'
                                } ${numScore >= 8.0 ? 'text-indigo-600' : numScore < 5.0 ? 'text-rose-600' : ''}`}>
                                  {numScore > 0 ? numScore.toFixed(1) : '-'}
                                </span>
                              </td>
                            );
                          }
                        })}

                        {/* Absences CP & KP */}
                        <td className="px-1 py-3 border-r border-slate-200 text-slate-500 font-bold align-middle bg-amber-50/10">
                          {absences.cp > 0 ? (
                            <span className="text-amber-600">{absences.cp}</span>
                          ) : '0'}
                        </td>
                        <td className="px-1 py-3 border-r border-slate-200 text-slate-500 font-bold align-middle bg-amber-50/10">
                          {absences.kp > 0 ? (
                            <span className="text-rose-600 font-black">{absences.kp}</span>
                          ) : '0'}
                        </td>

                        {/* Academic Rank (KQHT) */}
                        <td className="px-2 py-3 border-r border-slate-200 align-middle">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider block text-center ${
                            rank === 'Chưa xét' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                            rank === 'Tốt' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            rank === 'Khá' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            rank === 'Đạt' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {rank}
                          </span>
                        </td>

                        {/* Conduct (KQ rèn luyện) */}
                        <td className="px-2 py-3 border-r border-slate-200 align-middle">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider block text-center ${
                            conduct === 'Tốt' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            conduct === 'Khá' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {conduct}
                          </span>
                        </td>

                        {/* Award Title (Danh hiệu) */}
                        <td className="px-2 py-3 border-r border-slate-200 align-middle font-bold text-[10px]">
                          {award !== 'Chưa xét' ? (
                            <span className={`px-2 py-1 rounded block text-center ${
                              award === 'Học sinh Xuất sắc' 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-black shadow-xs' 
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {award}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Promotion Status (Trạng thái lên lớp) */}
                        <td className="px-2 py-3 align-middle font-bold text-[10px]">
                          {promotion !== '—' ? (
                            <span className={`px-2 py-1 rounded block text-center ${
                              promotion === 'Được lên lớp' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-black' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {promotion}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Component Detailed Subject Ledger Spreadsheet */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="gradebook-spreadsheet">
          
          {/* Tab-like Subject & Semester selector controls */}
          <div className="p-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50" id="gradebook-controls">
            <div id="gradebook-title-block">
              <h3 className="font-bold text-slate-900 font-display text-sm uppercase tracking-wider">Sổ Điểm Điện Tử Chi Tiết</h3>
              <p className="text-xs text-slate-500 mt-1">Xem điểm thi, điểm kiểm tra thường xuyên và tính toán điểm trung bình môn tự động</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 xl:justify-end" id="gradebook-selectors-wrapper">
              {/* Semester Selector */}
              <div className="flex items-center gap-2" id="gradebook-semester-switch">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Học kỳ:</span>
                <div className="inline-flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setSelectedSemester('HK1'); setEditingStudentId(null); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedSemester === 'HK1'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học kỳ I
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedSemester('HK2'); setEditingStudentId(null); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedSemester === 'HK2'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học kỳ II
                  </button>
                </div>
              </div>

              {/* Subject Selector */}
              <div className="flex flex-wrap items-center gap-2" id="gradebook-subject-switch">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Môn học:</span>
                {availableSubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    id={`btn-sub-g-${sub}`}
                    onClick={() => { setSelectedSubject(sub); setEditingStudentId(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedSubject === sub 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar for File Import & Clear Data */}
          {currentUser.role === 'teacher' && (
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs" id="gradebook-action-bar">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadGradesTemplate(students, selectedSubject, selectedSemester)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-bold cursor-pointer transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Tải file mẫu Excel ({selectedSubject})
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 hover:bg-indigo-100 font-bold cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Cập nhật điểm từ Excel
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportGradesFile}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                {importStatus.type && (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold ${
                    importStatus.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {importStatus.type === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{importStatus.message}</span>
                    <button 
                      type="button" 
                      onClick={() => setImportStatus({ type: null, message: '' })} 
                      className="text-slate-400 hover:text-slate-600 ml-1 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleClearGradesConfirm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 hover:bg-rose-100 font-bold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Xóa toàn bộ điểm
                </button>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="overflow-x-auto" id="gradebook-table-wrapper">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">STT</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">Mã Học Sinh</th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider">Học Sinh</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">Miệng (Hệ số 1)</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">15P Lần 1 (HS1)</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">15P Lần 2 (HS1)</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">15P Lần 3 (HS1)</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">1 Tiết (Hệ số 2)</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">Thi HK (Hệ số 3)</th>
                  <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">ĐTB Môn</th>
                  {currentUser.role === 'teacher' && (
                    <th className="px-6 py-4 text-center text-xs uppercase tracking-wider">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
                {displayedStudents.map((student, idx) => {
                  const gradeObj = getStudentSubjectGrade(student, selectedSubject, selectedSemester);
                  const subjectAvg = getSubjectAverage(gradeObj);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors" id={`gradebook-row-${student.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-500">{student.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">{student.name}</td>
                      
                      {/* Oral Grade */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-slate-700">
                        {editingStudentId === student.id ? (
                          <input
                            type="text"
                            value={oralInput}
                            placeholder="8, 9, ..."
                            onChange={(e) => setOralInput(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-center text-xs w-20 bg-white focus:outline-indigo-500"
                          />
                        ) : (
                          gradeObj.oral.join(', ') || '-'
                        )}
                      </td>

                       {/* 15m Grade Lần 1 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-slate-700">
                        {editingStudentId === student.id ? (
                          <input
                            type="text"
                            value={m15Input1}
                            placeholder="7"
                            onChange={(e) => setM15Input1(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-center text-xs w-16 bg-white focus:outline-indigo-500"
                          />
                        ) : (
                          gradeObj.m15[0] !== undefined ? gradeObj.m15[0] : '-'
                        )}
                      </td>

                      {/* 15m Grade Lần 2 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-slate-700">
                        {editingStudentId === student.id ? (
                          <input
                            type="text"
                            value={m15Input2}
                            placeholder="8"
                            onChange={(e) => setM15Input2(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-center text-xs w-16 bg-white focus:outline-indigo-500"
                          />
                        ) : (
                          gradeObj.m15[1] !== undefined ? gradeObj.m15[1] : '-'
                        )}
                      </td>

                      {/* 15m Grade Lần 3 */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-slate-700">
                        {editingStudentId === student.id ? (
                          <input
                            type="text"
                            value={m15Input3}
                            placeholder="9"
                            onChange={(e) => setM15Input3(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-center text-xs w-16 bg-white focus:outline-indigo-500"
                          />
                        ) : (
                          gradeObj.m15[2] !== undefined ? gradeObj.m15[2] : '-'
                        )}
                      </td>

                      {/* 45m Grade */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-slate-700">
                        {editingStudentId === student.id ? (
                          <input
                            type="text"
                            value={m45Input}
                            placeholder="9, 10, ..."
                            onChange={(e) => setM45Input(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-center text-xs w-20 bg-white focus:outline-indigo-500"
                          />
                        ) : (
                          gradeObj.m45.join(', ') || '-'
                        )}
                      </td>

                      {/* Final Grade */}
                      <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-slate-700">
                        {editingStudentId === student.id ? (
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={finalInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFinalInput(val === '' ? '' : parseFloat(val));
                            }}
                            className="px-2 py-1 border border-slate-300 rounded text-center text-xs w-16 bg-white focus:outline-indigo-500"
                          />
                        ) : (
                          gradeObj.final !== undefined ? gradeObj.final : '-'
                        )}
                      </td>

                      {/* Subject Average */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-xs font-black font-display px-2 py-1 rounded border ${
                          subjectAvg === null ? 'bg-slate-50 border-slate-200 text-slate-400' :
                          subjectAvg >= 8.0 ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                          subjectAvg >= 6.5 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                          subjectAvg >= 5.0 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                          {subjectAvg !== null ? subjectAvg.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Actions (Teacher Only) */}
                      {currentUser.role === 'teacher' && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                          {editingStudentId === student.id ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                id={`save-grades-btn-${student.id}`}
                                onClick={() => handleSaveGrades(student.id)}
                                className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                id={`cancel-grades-btn-${student.id}`}
                                onClick={() => setEditingStudentId(null)}
                                className="p-1 px-2.5 bg-slate-100 text-slate-500 rounded text-xs cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              id={`edit-grade-btn-${student.id}`}
                              onClick={() => handleStartEdit(student)}
                              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-lg hover:border-indigo-100 transition-all cursor-pointer"
                            >
                              Sửa Điểm
                            </button>
                          )}
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
                Xác nhận xóa điểm
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Bạn có chắc chắn muốn xóa toàn bộ điểm số môn <strong className="text-slate-800">{selectedSubject}</strong> của tất cả học sinh? Hành động này sẽ đặt sổ điểm môn này về trạng thái trống và không thể hoàn tác.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={executeClearGrades}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 shadow-sm cursor-pointer"
                >
                  Xóa toàn bộ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
