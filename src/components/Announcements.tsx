import React, { useState } from 'react';
import { Announcement, User } from '../types';
import { Megaphone, Pin, Plus, Trash2, Edit2, Calendar, FileText } from 'lucide-react';

interface AnnouncementsProps {
  currentUser: User;
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'date' | 'author'>) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export default function Announcements({ 
  currentUser, 
  announcements, 
  onAddAnnouncement, 
  onDeleteAnnouncement 
}: AnnouncementsProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onAddAnnouncement({
      title,
      content,
      isPinned
    });

    // Reset
    setTitle('');
    setContent('');
    setIsPinned(false);
    setShowForm(false);
  };

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned vs non-pinned
  const pinnedList = filteredAnnouncements.filter(a => a.isPinned);
  const generalList = filteredAnnouncements.filter(a => !a.isPinned);
  const sortedAnnouncements = [...pinnedList, ...generalList];

  return (
    <div className="space-y-6" id="announcements-tab">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="ann-header">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-indigo-600" />
            Thông Báo Lớp Học
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Các thông tin quan trọng được cập nhật bởi Giáo viên chủ nhiệm & Ban giám hiệu Nhà trường
          </p>
        </div>

        {currentUser.role === 'teacher' && (
          <button
            type="button"
            id="add-ann-btn"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            {showForm ? 'Đóng bảng' : 'Tạo thông báo mới'}
          </button>
        )}
      </div>

      {/* Add Announcement Form (Teacher Only) */}
      {showForm && currentUser.role === 'teacher' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm space-y-4" id="add-ann-form">
          <h3 className="font-bold text-slate-800 font-display text-sm uppercase tracking-wider">Soạn Thảo Thông Báo Mới</h3>
          
          <div className="space-y-1">
            <label htmlFor="ann-title" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu đề thông báo</label>
            <input
              id="ann-title"
              type="text"
              required
              placeholder="VD: Nhắc nhở mặc đồng phục đúng quy định..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ann-content" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nội dung chi tiết</label>
            <textarea
              id="ann-content"
              required
              rows={4}
              placeholder="Nhập nội dung thông báo cụ thể..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ann-pin"
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="ann-pin" className="text-sm text-slate-700 font-medium flex items-center gap-1 cursor-pointer">
              <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Ghim thông báo này lên đầu trang
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Đăng thông báo
          </button>
        </form>
      )}

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2" id="ann-search-bar">
        <span className="text-slate-400 text-xs">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm nội dung thông báo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full bg-transparent border-0 p-0 text-sm focus:outline-none text-slate-700"
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-4" id="announcements-list-wrapper">
        {sortedAnnouncements.map((ann) => (
          <div 
            key={ann.id} 
            className={`bg-white p-6 rounded-xl border transition-all shadow-sm ${
              ann.isPinned 
                ? 'border-amber-200 bg-amber-50/10' 
                : 'border-slate-200 hover:border-indigo-200'
            }`}
            id={`ann-card-${ann.id}`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {ann.date}
                  </span>
                  <span>•</span>
                  <span>Đăng bởi: {ann.author}</span>
                  {ann.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
                      Tin Ghim
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display mt-1">{ann.title}</h3>
              </div>

              {currentUser.role === 'teacher' && (
                <button
                  type="button"
                  id={`del-ann-${ann.id}`}
                  onClick={() => onDeleteAnnouncement(ann.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200"
                  title="Xóa thông báo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed border-t border-slate-200 pt-3">
              {ann.content}
            </p>
          </div>
        ))}

        {sortedAnnouncements.length === 0 && (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 italic shadow-sm">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-2" />
            Không tìm thấy thông báo nào phù hợp với từ khóa tìm kiếm.
          </div>
        )}
      </div>
    </div>
  );
}
