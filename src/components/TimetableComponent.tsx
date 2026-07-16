import React, { useState, useEffect } from 'react';
import { TimetableDay, TimetablePeriod, User } from '../types';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  ShieldAlert, 
  RotateCcw, 
  Printer, 
  Edit3, 
  BookOpen, 
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface TimetableProps {
  currentUser: User;
  timetable: TimetableDay[];
  onUpdateTimetable: (day: string, periodIndex: number, updatedPeriod: Partial<TimetablePeriod>) => void;
}

// Configuration for the 12 periods matching school hours
const PERIODS_CONFIG = [
  // SÁNG (Periods 1-4)
  { id: 1, session: 'SÁNG', time: '08h00 - 08h45' },
  { id: 2, session: 'SÁNG', time: '08h45 - 09h30' },
  { id: 3, session: 'SÁNG', time: '10h00 - 10h45' },
  { id: 4, session: 'SÁNG', time: '10h45 - 11h30' },
  // CHIỀU (Periods 5-8)
  { id: 5, session: 'CHIỀU', time: '13h30 - 14h15' },
  { id: 6, session: 'CHIỀU', time: '14h15 - 15h00' },
  { id: 7, session: 'CHIỀU', time: '15h15 - 16h00' },
  { id: 8, session: 'CHIỀU', time: '16h00 - 16h45' },
  // TỐI (Periods 9-12)
  { id: 9, session: 'TỐI', time: '17h15 - 18h00' },
  { id: 10, session: 'TỐI', time: '18h00 - 18h45' },
  { id: 11, session: 'TỐI', time: '19h00 - 19h45' },
  { id: 12, session: 'TỐI', time: '19h45 - 20h30' }
];

// Days of week mapping to data keys
const DAYS_MAPPING = [
  { label: 'THỨ 2', key: 'Thứ Hai' },
  { label: 'THỨ 3', key: 'Thứ Ba' },
  { label: 'THỨ 4', key: 'Thứ Tư' },
  { label: 'THỨ 5', key: 'Thứ Năm' },
  { label: 'THỨ 6', key: 'Thứ Sáu' }
];

// Presets to speed up editing for Vietnamese teachers
const SUBJECT_PRESETS = [
  'Toán', 'Ngữ văn', 'Tiếng Anh', 'Bài tập', 'Vật lý', 'Hóa học', 
  'Sinh học', 'Sử', 'Địa lý', 'GDKTPL', 'Công nghệ', 'Tin học', 
  'Thể dục', 'LT. Toán', 'LT. Văn', 'LT. Sử', 'LT. KTPL', 'Chào cờ', 'Nghỉ', '-'
];

const TEACHER_PRESETS = [
  'T. Điền', 'T. Đạt', 'C. T.Dung', 'C. Xuân', 'T. Sơn', 'C. T.Hương', 
  'Cô Nhã', 'Cô Hạnh', 'Thầy Đức', 'Cô Oanh', 'Thầy Trung', ''
];

// Phú Lâm 12A1 standard template values for reset/recovery
const PHU_LAM_TEMPLATE: { [day: string]: { [period: number]: { subject: string, teacher: string } } } = {
  'Thứ Hai': {
    1: { subject: 'Chào cờ', teacher: '' },
    2: { subject: 'Bài tập', teacher: 'T. Đạt' },
    3: { subject: 'Bài tập', teacher: 'T. Đạt' },
    4: { subject: 'Toán', teacher: 'C. T.Dung' },
    5: { subject: 'Bài tập', teacher: 'T. Điền' },
    6: { subject: 'Sử', teacher: 'T. Sơn' },
    7: { subject: 'Sử', teacher: 'T. Sơn' },
    8: { subject: '-', teacher: '' },
    9: { subject: 'LT. Văn', teacher: 'C. Xuân' },
    10: { subject: 'LT. Văn', teacher: 'C. Xuân' },
    11: { subject: '-', teacher: '' },
    12: { subject: '-', teacher: '' }
  },
  'Thứ Ba': {
    1: { subject: 'Bài tập', teacher: 'T. Điền' },
    2: { subject: 'Bài tập', teacher: 'T. Điền' },
    3: { subject: 'Toán', teacher: 'C. T.Dung' },
    4: { subject: 'Văn', teacher: 'C. Xuân' },
    5: { subject: 'Sử', teacher: 'T. Sơn' },
    6: { subject: 'Sử', teacher: 'T. Sơn' },
    7: { subject: 'Văn', teacher: 'C. Xuân' },
    8: { subject: 'Văn', teacher: 'C. Xuân' },
    9: { subject: 'LT. Sử', teacher: 'T. Sơn' },
    10: { subject: 'LT. Sử', teacher: 'T. Sơn' },
    11: { subject: 'LT. Toán', teacher: 'C. T.Dung' },
    12: { subject: 'LT. Toán', teacher: 'C. T.Dung' }
  },
  'Thứ Tư': {
    1: { subject: 'Toán', teacher: 'C. T.Dung' },
    2: { subject: 'Toán', teacher: 'C. T.Dung' },
    3: { subject: 'Bài tập', teacher: 'T. Điền' },
    4: { subject: 'Bài tập', teacher: 'T. Điền' },
    5: { subject: 'Sử', teacher: 'T. Sơn' },
    6: { subject: 'Sử', teacher: 'T. Sơn' },
    7: { subject: 'Văn', teacher: 'C. Xuân' },
    8: { subject: 'Văn', teacher: 'C. Xuân' },
    9: { subject: 'LT. KTPL', teacher: 'C. T.Hương' },
    10: { subject: 'LT. KTPL', teacher: 'C. T.Hương' },
    11: { subject: 'LT. Sử', teacher: 'T. Sơn' },
    12: { subject: 'LT. Sử', teacher: 'T. Sơn' }
  },
  'Thứ Năm': {
    1: { subject: 'GDKTPL', teacher: 'C. T.Hương' },
    2: { subject: 'GDKTPL', teacher: 'C. T.Hương' },
    3: { subject: 'Bài tập', teacher: 'T. Điền' },
    4: { subject: 'Bài tập', teacher: 'T. Điền' },
    5: { subject: 'Bài tập', teacher: 'T. Đạt' },
    6: { subject: 'Bài tập', teacher: 'T. Đạt' },
    7: { subject: 'GDKTPL', teacher: 'C. T.Hương' },
    8: { subject: 'GDKTPL', teacher: 'C. T.Hương' },
    9: { subject: 'LT. KTPL', teacher: 'C. T.Hương' },
    10: { subject: 'LT. KTPL', teacher: 'C. T.Hương' },
    11: { subject: 'LT. Toán', teacher: 'C. T.Dung' },
    12: { subject: 'LT. Toán', teacher: 'C. T.Dung' }
  },
  'Thứ Sáu': {
    1: { subject: 'Toán', teacher: 'C. T.Dung' },
    2: { subject: 'Toán', teacher: 'C. T.Dung' },
    3: { subject: 'GDKTPL', teacher: 'C. T.Hương' },
    4: { subject: 'GDKTPL', teacher: 'C. T.Hương' },
    5: { subject: 'Sử', teacher: 'T. Sơn' },
    6: { subject: 'Sử', teacher: 'T. Sơn' },
    7: { subject: 'Văn', teacher: 'C. Xuân' },
    8: { subject: 'Văn', teacher: 'C. Xuân' },
    9: { subject: 'LT. Văn', teacher: 'C. Xuân' },
    10: { subject: 'LT. Văn', teacher: 'C. Xuân' },
    11: { subject: '-', teacher: '' },
    12: { subject: '-', teacher: '' }
  }
};

export default function TimetableComponent({ currentUser, timetable, onUpdateTimetable }: TimetableProps) {
  // Metadata fields matching the header design in the photo
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('timetable_school') || 'Trường THPT Phú Lâm');
  const [gvcnName, setGvcnName] = useState(() => localStorage.getItem('timetable_gvcn') || 'Thầy Nguyễn Văn Điền');
  const [className, setClassName] = useState(() => localStorage.getItem('timetable_class') || '12A1');
  const [effectiveDate, setEffectiveDate] = useState(() => localStorage.getItem('timetable_date') || '08/6/2026');
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('timetable_year') || '2025 - 2026');

  // Interactive editing states
  const [editingCell, setEditingCell] = useState<{ dayKey: string; periodNum: number } | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editingHeaderField, setEditingHeaderField] = useState<'school' | 'gvcn' | 'class' | 'date' | 'year' | null>(null);

  // Sync custom metadata to local storage
  useEffect(() => {
    localStorage.setItem('timetable_school', schoolName);
    localStorage.setItem('timetable_gvcn', gvcnName);
    localStorage.setItem('timetable_class', className);
    localStorage.setItem('timetable_date', effectiveDate);
    localStorage.setItem('timetable_year', academicYear);
  }, [schoolName, gvcnName, className, effectiveDate, academicYear]);

  // Helper to fetch subject/teacher for a specific day and period from state
  const getCellData = (dayKey: string, periodNum: number) => {
    const dayData = timetable.find(t => t.day === dayKey);
    if (dayData) {
      const periodData = dayData.periods.find(p => p.period === periodNum);
      if (periodData) {
        return periodData;
      }
    }
    return { period: periodNum, time: '', subject: '-', teacher: '' };
  };

  // Open edit modal for a specific cell
  const handleCellClick = (dayKey: string, periodNum: number) => {
    if (currentUser.role !== 'teacher') return; // Only teachers can edit
    const cell = getCellData(dayKey, periodNum);
    setEditingCell({ dayKey, periodNum });
    setEditSubject(cell.subject === '-' ? '' : cell.subject);
    setEditTeacher(cell.teacher);
  };

  // Save the edited cell back to database/parent state
  const handleSaveCell = () => {
    if (!editingCell) return;
    const { dayKey, periodNum } = editingCell;
    const finalSubject = editSubject.trim() === '' ? '-' : editSubject.trim();
    
    onUpdateTimetable(dayKey, periodNum - 1, {
      subject: finalSubject,
      teacher: editTeacher.trim()
    });
    setEditingCell(null);
  };

  // Restore the original timetable template exactly as requested from the image
  const handleRestoreTemplate = () => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục thời khóa biểu về mẫu chuẩn Phú Lâm từ hình ảnh? Thao tác này sẽ ghi đè lịch hiện tại.')) {
      return;
    }
    
    // Set standard metadata
    setSchoolName('Trường THPT Phú Lâm');
    setGvcnName('Thầy Nguyễn Văn Điền');
    setClassName('12A1');
    setEffectiveDate('08/6/2026');
    setAcademicYear('2025 - 2026');

    // Update each day and period
    DAYS_MAPPING.forEach(day => {
      const templateDay = PHU_LAM_TEMPLATE[day.key];
      if (templateDay) {
        PERIODS_CONFIG.forEach(period => {
          const val = templateDay[period.id] || { subject: '-', teacher: '' };
          onUpdateTimetable(day.key, period.id - 1, {
            subject: val.subject,
            teacher: val.teacher
          });
        });
      }
    });
  };

  // Trigger print optimized flow
  const handlePrint = () => {
    window.print();
  };

  const isTeacher = currentUser.role === 'teacher';

  return (
    <div className="space-y-6" id="timetable-page-container">
      
      {/* Top action bar with print/edit options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" id="timetable-toolbar">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Thời Khóa Biểu Học Tập Lớp {className}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem lịch học chi tiết 3 buổi: Sáng - Chiều - Tối. Xuất dữ liệu in ấn chuẩn theo mẫu nhà trường.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" id="toolbar-actions">
          {isTeacher && (
            <>
              <button
                type="button"
                id="btn-edit-metadata"
                onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isEditingMetadata 
                    ? 'bg-amber-50 border-amber-300 text-amber-700' 
                    : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditingMetadata ? 'Đóng bảng sửa' : 'Sửa thông tin đầu trang'}
              </button>

              <button
                type="button"
                id="btn-restore-template"
                onClick={handleRestoreTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                title="Đặt lại bảng theo ảnh mẫu"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Khôi phục mẫu Phú Lâm
              </button>
            </>
          )}

          <button
            type="button"
            id="btn-print-timetable"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            In thời khóa biểu (Print)
          </button>
        </div>
      </div>

      {/* Metadata editing drawer/card */}
      {isEditingMetadata && isTeacher && (
        <div className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-xl space-y-4" id="metadata-editor-panel">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            Cấu hình thông tin đầu trang Thời khóa biểu
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3" id="metadata-inputs-grid">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tên Trường</label>
              <input
                type="text"
                id="meta-input-school"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded bg-white focus:outline-emerald-500 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">GVCN</label>
              <input
                type="text"
                id="meta-input-gvcn"
                value={gvcnName}
                onChange={(e) => setGvcnName(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded bg-white focus:outline-emerald-500 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Lớp Học</label>
              <input
                type="text"
                id="meta-input-class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded bg-white focus:outline-emerald-500 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Thực hiện từ ngày</label>
              <input
                type="text"
                id="meta-input-date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded bg-white focus:outline-emerald-500 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Năm Học</label>
              <input
                type="text"
                id="meta-input-year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded bg-white focus:outline-emerald-500 text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Editing guideline for teachers */}
      {isTeacher && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-lg text-xs" id="teacher-edit-guide">
          <AlertCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            <strong>💡 Chế độ Giáo viên bật:</strong> Bạn có thể <strong>nhấp trực tiếp vào các tiêu đề đầu trang</strong> (tên trường, năm học, ngày áp dụng, GVCN, lớp) hoặc <strong>bất kỳ ô học tập nào</strong> trong bảng bên dưới để chỉnh sửa và tự động lưu.
          </span>
        </div>
      )}

      {/* Main Timetable Card (Print optimized wrapper) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-x-auto" id="timetable-print-content">
        <div className="min-w-[900px] p-2" id="timetable-canvas">
          
          {/* Header Block replicated from screenshot */}
          <div className="mb-6" id="school-timetable-header">
            {/* Row 1: School, Title, and Effective Date */}
            <div className="grid grid-cols-3 items-center pb-2 border-b border-slate-100">
              <div className="text-left">
                {editingHeaderField === 'school' ? (
                  <input
                    type="text"
                    id="inline-input-school"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    onBlur={() => setEditingHeaderField(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingHeaderField(null);
                    }}
                    autoFocus
                    className="text-xs font-bold border-b border-emerald-500 pb-0.5 inline-block text-slate-800 uppercase tracking-wide bg-emerald-50 outline-none px-1 rounded"
                  />
                ) : (
                  <span 
                    onClick={() => isTeacher && setEditingHeaderField('school')}
                    className={`text-xs font-bold border-b pb-0.5 inline-block text-slate-800 uppercase tracking-wide transition-all ${
                      isTeacher ? 'cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 border-dashed border-slate-400' : 'border-slate-800'
                    }`}
                    title={isTeacher ? "Nhấp để sửa trực tiếp" : undefined}
                  >
                    {schoolName}
                  </span>
                )}
              </div>
              
              <div className="text-center">
                {editingHeaderField === 'year' ? (
                  <h1 className="text-base font-extrabold text-slate-950 tracking-tight uppercase font-display flex items-center justify-center gap-1">
                    <span>THỜI KHÓA BIỂU NĂM HỌC </span>
                    <input
                      type="text"
                      id="inline-input-year"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      onBlur={() => setEditingHeaderField(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingHeaderField(null);
                      }}
                      autoFocus
                      className="text-base font-extrabold text-slate-950 bg-emerald-50 border-b border-emerald-500 outline-none px-1 rounded max-w-[150px] text-center"
                    />
                  </h1>
                ) : (
                  <h1 className="text-base font-extrabold text-slate-950 tracking-tight uppercase font-display flex items-center justify-center gap-1">
                    <span>THỜI KHÓA BIỂU NĂM HỌC </span>
                    <span
                      onClick={() => isTeacher && setEditingHeaderField('year')}
                      className={`inline-block transition-all ${
                        isTeacher ? 'cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 border-b border-dashed border-slate-400' : ''
                      }`}
                      title={isTeacher ? "Nhấp để sửa trực tiếp" : undefined}
                    >
                      {academicYear}
                    </span>
                  </h1>
                )}
              </div>
              
              <div className="flex justify-end items-center gap-2">
                <span className="text-[11px] font-bold underline text-slate-600">Thực hiện từ</span>
                {editingHeaderField === 'date' ? (
                  <input
                    type="text"
                    id="inline-input-date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    onBlur={() => setEditingHeaderField(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingHeaderField(null);
                    }}
                    autoFocus
                    className="bg-[#ff0000] text-white font-black px-2 py-1 text-xs tracking-wider uppercase rounded shadow-sm text-center max-w-[120px] outline-none"
                  />
                ) : (
                  <span 
                    onClick={() => isTeacher && setEditingHeaderField('date')}
                    className={`bg-[#ff0000] text-white font-black px-4 py-1 text-xs tracking-wider uppercase rounded shadow-sm transition-all ${
                      isTeacher ? 'cursor-pointer hover:bg-red-700 hover:scale-105' : ''
                    }`}
                    title={isTeacher ? "Nhấp để sửa trực tiếp" : undefined}
                  >
                    {effectiveDate}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: GVCN and Class Name */}
            <div className="grid grid-cols-3 items-center mt-2.5">
              <div className="col-span-2 text-left flex items-center">
                <span className="text-[11px] font-bold underline text-slate-500 mr-2">GVCN:</span>
                {editingHeaderField === 'gvcn' ? (
                  <input
                    type="text"
                    id="inline-input-gvcn"
                    value={gvcnName}
                    onChange={(e) => setGvcnName(e.target.value)}
                    onBlur={() => setEditingHeaderField(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingHeaderField(null);
                    }}
                    autoFocus
                    className="text-[#d92222] font-black text-sm tracking-wide bg-emerald-50 border-b border-emerald-500 outline-none px-1 rounded max-w-[200px]"
                  />
                ) : (
                  <span 
                    onClick={() => isTeacher && setEditingHeaderField('gvcn')}
                    className={`text-[#d92222] font-black text-sm tracking-wide transition-all ${
                      isTeacher ? 'cursor-pointer hover:bg-red-50 border-b border-dashed border-red-300 hover:border-[#d92222]' : ''
                    }`}
                    title={isTeacher ? "Nhấp để sửa trực tiếp" : undefined}
                  >
                    {gvcnName}
                  </span>
                )}
              </div>
              
              <div className="text-right flex items-center justify-end">
                <span className="text-[11px] font-bold underline text-slate-500 mr-2">Lớp:</span>
                {editingHeaderField === 'class' ? (
                  <input
                    type="text"
                    id="inline-input-class"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    onBlur={() => setEditingHeaderField(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingHeaderField(null);
                    }}
                    autoFocus
                    className="text-[#d92222] font-black text-sm tracking-wide bg-emerald-50 border-b border-emerald-500 outline-none px-1 rounded max-w-[100px] text-center"
                  />
                ) : (
                  <span 
                    onClick={() => isTeacher && setEditingHeaderField('class')}
                    className={`text-[#d92222] font-black text-sm tracking-wide transition-all ${
                      isTeacher ? 'cursor-pointer hover:bg-red-50 border-b border-dashed border-red-300 hover:border-[#d92222]' : ''
                    }`}
                    title={isTeacher ? "Nhấp để sửa trực tiếp" : undefined}
                  >
                    {className}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Excel styled school timetable grid */}
          <table className="w-full border-collapse border-2 border-slate-600 shadow-md" id="phu-lam-grid-table">
            <thead>
              <tr className="bg-[#438e44]">
                <th className="border border-slate-600 text-white font-extrabold text-xs uppercase py-3 px-1 w-[6%] text-center tracking-wide">BUỔI</th>
                <th className="border border-slate-600 text-white font-extrabold text-xs uppercase py-3 px-1 w-[14%] text-center tracking-wide">THỜI GIAN</th>
                <th className="border border-slate-600 text-white font-extrabold text-xs uppercase py-3 px-1 w-[6%] text-center tracking-wide">TIẾT</th>
                {DAYS_MAPPING.map(day => (
                  <th 
                    key={day.key} 
                    className="border border-slate-600 text-white font-extrabold text-xs uppercase py-3 px-2 w-[14.8%] text-center tracking-wide"
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y-2 divide-slate-600">
              {PERIODS_CONFIG.map((period, index) => {
                // Determine row spans for the "BUỔI" column (SÁNG: rows 0-3, CHIỀU: rows 4-7, TỐI: rows 8-11)
                const isFirstInSession = index % 4 === 0;
                
                return (
                  <tr key={period.id} className="hover:bg-slate-100/30 transition-colors">
                    
                    {/* BUỔI column with vertical text structure */}
                    {isFirstInSession && (
                      <td 
                        rowSpan={4} 
                        className={`border border-slate-600 align-middle text-center font-extrabold select-none p-1.5 ${
                          period.session === 'SÁNG' ? 'bg-[#e8f5e9]/80' :
                          period.session === 'CHIỀU' ? 'bg-[#fff3e0]/80' :
                          'bg-[#eef2ff]/80'
                        }`}
                      >
                        {period.session === 'SÁNG' && (
                          <div className="flex flex-col items-center justify-center text-[#1b5e20] text-xs font-black tracking-[0.2em] space-y-1 py-1">
                            <span>S</span><span>Á</span><span>N</span><span>G</span>
                          </div>
                        )}
                        {period.session === 'CHIỀU' && (
                          <div className="flex flex-col items-center justify-center text-[#e65100] text-xs font-black tracking-[0.2em] space-y-1 py-1">
                            <span>C</span><span>H</span><span>I</span><span>Ề</span><span>U</span>
                          </div>
                        )}
                        {period.session === 'TỐI' && (
                          <div className="flex flex-col items-center justify-center text-[#1a237e] text-xs font-black tracking-[0.2em] space-y-1 py-1">
                            <span>T</span><span>Ố</span><span>I</span>
                          </div>
                        )}
                      </td>
                    )}
                    
                    {/* THỜI GIAN Column */}
                    <td className="border border-slate-600 bg-slate-50 text-center font-mono text-[11px] text-slate-700 font-semibold py-3 px-1 select-none">
                      {period.time}
                    </td>
                    
                    {/* TIẾT Column */}
                    <td className="border border-slate-600 bg-slate-50/50 text-center font-mono text-xs font-extrabold text-slate-700 py-3 px-1 select-none">
                      {period.id}
                    </td>
                    
                    {/* THỨ 2 -> THỨ 6 columns */}
                    {DAYS_MAPPING.map(day => {
                      const cell = getCellData(day.key, period.id);
                      const hasClass = cell.subject && cell.subject !== '-';
                      
                      // Match colors dynamically based on Session
                      let cellClass = '';
                      if (hasClass) {
                        if (period.session === 'SÁNG') {
                          cellClass = 'bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#1b5e20]';
                        } else if (period.session === 'CHIỀU') {
                          cellClass = 'bg-[#fff3e0] hover:bg-[#ffe0b2] text-[#e65100]';
                        } else {
                          cellClass = 'bg-[#eef2ff] hover:bg-[#e0e7ff] text-[#1a237e]';
                        }
                      } else {
                        cellClass = 'bg-white text-slate-300';
                      }

                      return (
                        <td 
                          key={day.key}
                          onClick={() => handleCellClick(day.key, period.id)}
                          className={`border border-slate-600 text-center py-3 px-2 transition-all ${
                            isTeacher ? 'cursor-pointer select-none' : ''
                          } ${cellClass}`}
                        >
                          {hasClass ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-bold text-[12px] text-slate-950 font-sans tracking-wide leading-tight">
                                {cell.subject}
                              </span>
                              {cell.teacher && (
                                <span className={`text-[10px] font-bold mt-0.5 whitespace-nowrap ${
                                  period.session === 'SÁNG' ? 'text-[#2e7d32]/90' :
                                  period.session === 'CHIỀU' ? 'text-[#d84315]/90' :
                                  'text-[#3f51b5]/90'
                                }`}>
                                  - {cell.teacher}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-bold text-xs select-none text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      </div>

      {/* Editing Dialog Modal (Pops up when a teacher clicks on any cell) */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in" id="edit-cell-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden" id="edit-cell-dialog">
            
            {/* Modal Header */}
            <div className="bg-emerald-700 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide">CHỈNH SỬA LỊCH HỌC</h3>
                  <p className="text-[10px] text-emerald-100 font-medium">
                    Tiết {editingCell.periodNum} • {editingCell.dayKey}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingCell(null)}
                className="text-white hover:text-emerald-100 p-1 cursor-pointer rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-emerald-600" /> Tên môn học
                  </label>
                  <input
                    type="text"
                    id="edit-cell-subject-input"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Nhập tên môn..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-emerald-500 font-semibold text-slate-800 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-emerald-600" /> Giáo viên / Chú thích
                  </label>
                  <input
                    type="text"
                    id="edit-cell-teacher-input"
                    value={editTeacher}
                    onChange={(e) => setEditTeacher(e.target.value)}
                    placeholder="VD: C. Xuân, T. Sơn..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-emerald-500 font-semibold text-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Subject Presets list */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Mẫu môn học chọn nhanh</span>
                <div className="flex flex-wrap gap-1" id="subject-presets">
                  {SUBJECT_PRESETS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setEditSubject(sub === '-' ? '' : sub)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                        editSubject === sub 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher Presets list */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Mẫu giáo viên chọn nhanh</span>
                <div className="flex flex-wrap gap-1" id="teacher-presets">
                  {TEACHER_PRESETS.map((teach) => (
                    <button
                      key={teach || 'clear'}
                      type="button"
                      onClick={() => setEditTeacher(teach)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                        editTeacher === teach 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {teach || 'Bỏ chọn GV'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                id="btn-modal-cancel"
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="btn-modal-save"
                onClick={handleSaveCell}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Lưu học tập
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
