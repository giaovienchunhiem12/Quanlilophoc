import React, { useState } from 'react';
import { DailyLesson, User } from '../types';
import { ClipboardList, Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface DailyLessonsProps {
  currentUser: User;
  dailyLessons: DailyLesson[];
  onAddDailyLesson: (lesson: Omit<DailyLesson, 'id'>) => void;
  onDeleteDailyLesson: (id: string) => void;
}

export default function DailyLessons({ currentUser, dailyLessons, onAddDailyLesson, onDeleteDailyLesson }: DailyLessonsProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  
  // Custom structure for adding multiple subjects to a single daily report
  const [lessonsList, setLessonsList] = useState<{ subject: string; content: string; homework: string }[]>([
    { subject: 'Toán học', content: '', homework: '' },
    { subject: 'Ngữ văn', content: '', homework: '' }
  ]);

  const handleAddSubjectField = () => {
    setLessonsList([...lessonsList, { subject: '', content: '', homework: '' }]);
  };

  const handleRemoveSubjectField = (index: number) => {
    setLessonsList(lessonsList.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: 'subject' | 'content' | 'homework', value: string) => {
    const updated = [...lessonsList];
    updated[index][field] = value;
    setLessonsList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    // Filter out rows with empty subject name
    const validLessons = lessonsList.filter(l => l.subject.trim() !== '');
    if (validLessons.length === 0) return;

    onAddDailyLesson({
      date,
      lessons: validLessons
    });

    // Reset
    setDate('');
    setLessonsList([
      { subject: 'Toán học', content: '', homework: '' },
      { subject: 'Ngữ văn', content: '', homework: '' }
    ]);
    setShowForm(false);
  };

  return (
    <div className="space-y-6" id="daily-lessons-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="daily-lessons-header">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-600" />
            Sổ Báo Bài Hàng Ngày
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dặn dò chuẩn bị bài mới, ghi chú nội dung học tập và bài tập về nhà của từng buổi học
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            type="button"
            id="add-lesson-btn"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Đóng bảng' : 'Đăng báo bài mới'}
          </button>
        )}
      </div>

      {/* Add New Daily Lesson Form (Teacher Only) */}
      {showForm && currentUser.role === 'teacher' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm space-y-4" id="add-daily-lessons-form">
          <h3 className="font-bold text-slate-800 font-display text-xs uppercase tracking-wider">Soạn Sổ Báo Bài</h3>

          {/* Date Picker */}
          <div className="max-w-xs space-y-1">
            <label htmlFor="lesson-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày học áp dụng</label>
            <input
              id="lesson-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-indigo-500"
            />
          </div>

          {/* List of Lessons */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục dặn dò theo môn</span>
              <button
                type="button"
                onClick={handleAddSubjectField}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                + Thêm môn học
              </button>
            </div>

            {lessonsList.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50/50 rounded-lg border border-slate-200 space-y-3 relative" id={`lesson-input-row-${idx}`}>
                {lessonsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSubjectField(idx)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                  >
                    Xóa dòng
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Môn học</label>
                    <input
                      type="text"
                      required
                      placeholder="Toán, Văn, Anh..."
                      value={item.subject}
                      onChange={(e) => handleFieldChange(idx, 'subject', e.target.value)}
                      className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nội dung bài học</label>
                    <input
                      type="text"
                      required
                      placeholder="Học lý thuyết trang..."
                      value={item.content}
                      onChange={(e) => handleFieldChange(idx, 'content', e.target.value)}
                      className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dặn dò / Bài tập về nhà</label>
                    <input
                      type="text"
                      required
                      placeholder="Bài tập 1 đến 5 trang..."
                      value={item.homework}
                      onChange={(e) => handleFieldChange(idx, 'homework', e.target.value)}
                      className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Đăng sổ báo bài
          </button>
        </form>
      )}

      {/* Sổ Báo Bài List */}
      <div className="space-y-6" id="daily-lessons-list">
        {dailyLessons.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" id={`report-card-${report.id}`}>
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-display text-sm">Báo Bài Ngày {report.date}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Lớp 12A4 • Trường THPT Chuyên</p>
                </div>
              </div>

              {currentUser.role === 'teacher' && (
                <button
                  type="button"
                  id={`del-lesson-${report.id}`}
                  onClick={() => onDeleteDailyLesson(report.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa báo bài ngày này"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* List of subjects in this report */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id={`report-lessons-grid-${report.id}`}>
              {report.lessons.map((item, idx) => (
                <div key={idx} className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-2.5" id={`sub-lesson-box-${idx}`}>
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase border border-indigo-200">Môn học</span>
                    <h4 className="font-bold text-slate-900 text-sm">{item.subject}</h4>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p>
                      📚 <b className="text-slate-700">Bài học:</b> {item.content}
                    </p>
                    <p className="text-indigo-700 font-medium">
                      📝 <b className="text-indigo-800">Dặn dò:</b> {item.homework}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {dailyLessons.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 italic font-medium">
            <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            Sổ báo bài trống. Vui lòng bấm "Đăng báo bài mới" để dặn dò học sinh chuẩn bị.
          </div>
        )}
      </div>
    </div>
  );
}
