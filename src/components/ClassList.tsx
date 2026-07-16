import React, { useState, useRef } from 'react';
import { Student, User, LearningMode, BusStatus } from '../types';
import { exportStudentListToExcel, downloadStudentListTemplate } from '../utils/excelExport';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload,
  FileSpreadsheet,
  Bus, 
  Home, 
  ShieldAlert,
  Save,
  X,
  UserPlus
} from 'lucide-react';

const formatDateForDisplay = (dobStr: string): string => {
  if (!dobStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dobStr)) {
    return dobStr;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
    const [year, month, day] = dobStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const date = new Date(dobStr);
    if (!isNaN(date.getTime())) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
  } catch (e) {
    // ignore
  }
  return dobStr;
};

interface ClassListProps {
  currentUser: User;
  students: Student[];
  onAddStudent: (student: Omit<Student, 'attendance' | 'grades' | 'tuitionPaid'>) => void;
  onUpdateStudent: (id: string, updatedFields: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onImportStudents: (newStudentsList: Omit<Student, 'attendance' | 'grades' | 'tuitionPaid'>[]) => void;
}

export default function ClassList({ 
  currentUser, 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  onImportStudents
}: ClassListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleImportClick = () => {
    setImportStatus({ type: null, message: '' });
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            message: 'File Excel không có dữ liệu học sinh!'
          });
          return;
        }

        // Validate structure
        const headers = Object.keys(jsonData[0]);
        const hasName = headers.includes('Họ tên') || headers.includes('Họ và Tên');
        const hasGender = headers.includes('GIỚI TÍNH') || headers.includes('Giới Tính');
        const hasDob = headers.includes('ngày sinh') || headers.includes('Ngày Sinh');

        if (!hasName || !hasGender || !hasDob) {
          setImportStatus({
            type: 'error',
            message: `File mẫu sai định dạng hoặc thiếu các cột bắt buộc tối thiểu: Họ tên, GIỚI TÍNH, ngày sinh`
          });
          return;
        }

        // Convert rows to Student list
        const listToImport: Omit<Student, 'attendance' | 'grades' | 'tuitionPaid'>[] = jsonData.map((row, idx) => {
          const rawId = (row['Mã Học Sinh'] || row['Mã HS'])?.toString().trim();
          // Generate a custom ID if missing or empty
          const generatedId = rawId || `HS${String(students.length + idx + 1).padStart(3, '0')}`;
          
          const rawLearningMode = (row['CHẾ ĐỘ HỌC'] || row['Chế Độ Học'])?.toString().trim() || 'Bán trú';
          const finalLearningMode: LearningMode = (rawLearningMode === 'Ngoại trú') ? 'Ngoại trú' : 'Bán trú';
          
                  const nameValue = (row['Họ tên'] || row['Họ và Tên'])?.toString().trim() || 'Học sinh mới';
          const genderValue = ((row['GIỚI TÍNH'] || row['Giới Tính'])?.toString().trim() === 'Nữ' || (row['GIỚI TÍNH'] || row['Giới Tính'])?.toString().trim() === 'nữ') ? 'Nữ' : 'Nam';
          
          const rawDob = (row['ngày sinh'] || row['Ngày Sinh'])?.toString().trim() || '2008-01-01';
          let dobValue = rawDob;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDob)) {
            const [day, month, year] = rawDob.split('/');
            dobValue = `${year}-${month}-${day}`;
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDob)) {
            const [day, month, year] = rawDob.split('-');
            dobValue = `${year}-${month}-${day}`;
          }
          
          const fatherNameVal = row['Cha']?.toString().trim();
          const motherNameVal = row['Mẹ']?.toString().trim();
          const legacyParentName = row['Tên Phụ Huynh']?.toString().trim();
          const finalParentName = legacyParentName || fatherNameVal || motherNameVal || 'Phụ huynh';

          const fatherPhoneVal = row['SĐT cha']?.toString().trim();
          const motherPhoneVal = row['SĐT mẹ']?.toString().trim();
          const legacyParentPhone = row['Số Điện Thoại PH']?.toString().trim();
          const finalParentPhone = legacyParentPhone || fatherPhoneVal || motherPhoneVal || '0900000000';

          const addressValue = (row['ĐC hiện nay'] || row['Địa Chỉ'])?.toString().trim() || 'Chưa cập nhật';
          const permanentAddressValue = row['ĐC thường trú']?.toString().trim() || addressValue;

          let transportMethodVal: 'Tự đi' | 'PH đưa đón' | 'Đi xe' = 'Tự đi';
          const rawTM = (row['HÌNH THỨC ĐI HỌC'] || row['Hình thức đi học'] || row['HÌNH THỨC'])?.toString().trim();
          if (rawTM === 'PH đưa đón') transportMethodVal = 'PH đưa đón';
          else if (rawTM === 'Đi xe' || rawTM === 'Đi xe bus' || rawTM === 'Xe bus') transportMethodVal = 'Đi xe';

          let busStatusVal: BusStatus = 'Tự đi';
          const rawBS = (row['ĐĂNG KÝ XE'] || row['Đăng ký xe'] || row['Đăng Ký Xe'])?.toString().trim();
          if (rawBS === 'Đăng ký xe bus' || rawBS === 'Xe bus' || rawBS === 'Đăng ký xe Bus Trường') {
            busStatusVal = 'Đăng ký xe bus';
          } else if (rawBS === 'Đăng ký xe' || rawBS === 'Đăng ký gửi xe' || rawBS === 'Có đăng ký') {
            busStatusVal = 'Đăng ký xe';
          }

          let vehicleTypeVal: 'Xe đạp' | 'Xe máy điện' | 'Xe máy' | 'Xe đạp điện' | 'Không có' = 'Không có';
          const rawVT = (row['LOẠI XE'] || row['Loại xe'])?.toString().trim();
          if (rawVT === 'Xe đạp') vehicleTypeVal = 'Xe đạp';
          else if (rawVT === 'Xe máy điện') vehicleTypeVal = 'Xe máy điện';
          else if (rawVT === 'Xe máy' || rawVT === 'Xe Máy') vehicleTypeVal = 'Xe máy';
          else if (rawVT === 'Xe đạp điện') vehicleTypeVal = 'Xe đạp điện';

          return {
            id: generatedId,
            name: nameValue,
            gender: genderValue,
            dob: dobValue,
            parentName: finalParentName,
            parentPhone: finalParentPhone,
            address: addressValue,
            learningMode: finalLearningMode,
            busStatus: busStatusVal,
            tuitionAmount: finalLearningMode === 'Bán trú' ? 2200000 : 1800000,
            
            // New specific fields
            ethnic: row['DÂN TỘC']?.toString().trim() || 'Kinh',
            studentPhone: row['SĐT HS']?.toString().trim() || '',
            cccd: row['SỐ CCCD']?.toString().trim() || '',
            email: row['GMAIL']?.toString().trim() || '',
            pob: row['Nơi sinh']?.toString().trim() || 'TP. HCM',
            fatherName: fatherNameVal || '',
            fatherPhone: fatherPhoneVal || '',
            fatherJob: row['Nghề cha']?.toString().trim() || '',
            motherName: motherNameVal || '',
            motherPhone: motherPhoneVal || '',
            motherJob: row['Nghề mẹ']?.toString().trim() || '',
            permanentAddress: permanentAddressValue,
            transportMethod: transportMethodVal,
            vehicleType: vehicleTypeVal
          };
        });

        onImportStudents(listToImport);
        setImportStatus({
          type: 'success',
          message: `Nhập thành công ${listToImport.length} học sinh mới từ file Excel! Toàn bộ dữ liệu cũ đã bị xóa và thay thế.`
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error(err);
        setImportStatus({
          type: 'error',
          message: 'Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file!'
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [learningMode, setLearningMode] = useState<LearningMode>('Bán trú');
  const [busStatus, setBusStatus] = useState<BusStatus>('Tự đi');
  const [busRoute, setBusRoute] = useState('');

  // New fields
  const [ethnic, setEthnic] = useState('Kinh');
  const [studentPhone, setStudentPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [email, setEmail] = useState('');
  const [pob, setPob] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [fatherJob, setFatherJob] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [motherJob, setMotherJob] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // Transport and Vehicle fields
  const [transportMethod, setTransportMethod] = useState<'Tự đi' | 'PH đưa đón' | 'Đi xe'>('Tự đi');
  const [vehicleType, setVehicleType] = useState<'Xe đạp' | 'Xe máy điện' | 'Xe máy' | 'Xe đạp điện' | 'Không có'>('Không có');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dob) return;

    // Generate unique student ID
    const newId = `HS${String(students.length + 1).padStart(3, '0')}`;
    
    onAddStudent({
      id: newId,
      name,
      gender,
      dob,
      parentName: parentName || fatherName || motherName || 'Phụ huynh',
      parentPhone: parentPhone || fatherPhone || motherPhone || '0900000000',
      address: address || 'Chưa cập nhật',
      learningMode,
      busStatus,
      busRoute: busStatus === 'Đăng ký xe bus' ? (busRoute || 'Tuyến số 01') : undefined,
      tuitionAmount: learningMode === 'Bán trú' ? 2200000 : 1800000, // Base calculation
      
      // New fields
      ethnic: ethnic || 'Kinh',
      studentPhone: studentPhone || '',
      cccd: cccd || '',
      email: email || '',
      pob: pob || 'TP. HCM',
      fatherName: fatherName || '',
      fatherPhone: fatherPhone || '',
      fatherJob: fatherJob || '',
      motherName: motherName || '',
      motherPhone: motherPhone || '',
      motherJob: motherJob || '',
      permanentAddress: permanentAddress || address || 'Chưa cập nhật',
      transportMethod: transportMethod || 'Tự đi',
      vehicleType: vehicleType || 'Không có'
    });

    // Reset Form
    setName('');
    setDob('');
    setParentName('');
    setParentPhone('');
    setAddress('');
    setLearningMode('Bán trú');
    setBusStatus('Tự đi');
    setBusRoute('');
    setEthnic('Kinh');
    setStudentPhone('');
    setCccd('');
    setEmail('');
    setPob('');
    setFatherName('');
    setFatherPhone('');
    setFatherJob('');
    setMotherName('');
    setMotherPhone('');
    setMotherJob('');
    setPermanentAddress('');
    setTransportMethod('Tự đi');
    setVehicleType('Không có');
    setShowAddForm(false);
  };

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setName(student.name);
    setGender(student.gender);
    setDob(student.dob);
    setParentName(student.parentName);
    setParentPhone(student.parentPhone);
    setAddress(student.address);
    setLearningMode(student.learningMode);
    setBusStatus(student.busStatus);
    setBusRoute(student.busRoute || '');
    
    // New fields
    setEthnic(student.ethnic || 'Kinh');
    setStudentPhone(student.studentPhone || '');
    setCccd(student.cccd || '');
    setEmail(student.email || '');
    setPob(student.pob || 'TP. HCM');
    setFatherName(student.fatherName || student.parentName || '');
    setFatherPhone(student.fatherPhone || student.parentPhone || '');
    setFatherJob(student.fatherJob || 'Tự do');
    setMotherName(student.motherName || '');
    setMotherPhone(student.motherPhone || '');
    setMotherJob(student.motherJob || '');
    setPermanentAddress(student.permanentAddress || student.address || '');
    setTransportMethod(student.transportMethod || 'Tự đi');
    setVehicleType(student.vehicleType || 'Không có');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateStudent(id, {
      name,
      gender,
      dob,
      parentName: parentName || fatherName || motherName || 'Phụ huynh',
      parentPhone: parentPhone || fatherPhone || motherPhone || '0900000000',
      address,
      learningMode,
      busStatus,
      busRoute: busStatus === 'Đăng ký xe bus' ? busRoute : undefined,
      
      // New fields
      ethnic,
      studentPhone,
      cccd,
      email,
      pob,
      fatherName,
      fatherPhone,
      fatherJob,
      motherName,
      motherPhone,
      motherJob,
      permanentAddress,
      transportMethod,
      vehicleType
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6" id="class-list-tab">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="classlist-header">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Danh Sách Lớp Học - Lớp 12A4
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý lý lịch trích ngang, chế độ bán trú/ngoại trú và thông tin đăng kí xe (xe cá nhân, xe bus trường) của học sinh
          </p>
        </div>

        <div className="flex flex-wrap gap-2" id="classlist-actions">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx, .xls" 
            className="hidden" 
            id="excel-import-input"
          />

          {currentUser.role === 'teacher' && (
            <>
              <button
                type="button"
                id="download-template-btn"
                onClick={downloadStudentListTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 transition-colors cursor-pointer shadow-sm"
                title="Tải tệp mẫu Excel có định dạng chuẩn để nhập học sinh"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Tải file mẫu
              </button>

              <button
                type="button"
                id="import-excel-btn"
                onClick={handleImportClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 transition-colors cursor-pointer shadow-sm"
                title="Nhập danh sách học sinh từ file Excel (LƯU Ý: Dữ liệu học sinh cũ sẽ bị xóa hoàn toàn)"
              >
                <Upload className="h-4 w-4 text-indigo-600" />
                Nhập từ Excel
              </button>
            </>
          )}

          <button
            type="button"
            id="export-classlist-btn"
            onClick={() => exportStudentListToExcel(students, '12A4')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4 text-indigo-500" />
            Xuất Excel
          </button>

          {currentUser.role === 'teacher' && (
            <button
              type="button"
              id="show-add-student-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              {showAddForm ? 'Đóng bảng' : 'Thêm học sinh'}
            </button>
          )}
        </div>
      </div>

      {/* Excel Import Feedback Banner */}
      {importStatus.type && (
        <div 
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            importStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
          id="excel-import-status"
        >
          <div className="flex-1 text-sm font-medium">
            {importStatus.type === 'success' ? '🎉 ' : '⚠️ '}
            {importStatus.message}
          </div>
          <button 
            type="button" 
            onClick={() => setImportStatus({ type: null, message: '' })}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Student Form (Teacher Only) */}
      {showAddForm && currentUser.role === 'teacher' && (
        <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm space-y-6" id="add-student-form">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 font-display text-base">Hồ Sơ Nhập Học Mới</h3>
            <p className="text-xs text-slate-500 mt-0.5">Vui lòng điền đầy đủ thông tin chi tiết của học sinh để đồng bộ hóa học bạ lý lịch</p>
          </div>

          {/* Section 1: Thông tin học sinh */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">1. Thông tin cá nhân học sinh</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Tên */}
              <div className="space-y-1">
                <label htmlFor="st-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ và Tên <span className="text-rose-500">*</span></label>
                <input
                  id="st-name"
                  type="text"
                  required
                  placeholder="VD: Nguyễn Thành Đạt"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Giới tính */}
              <div className="space-y-1">
                <label htmlFor="st-gender" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Giới tính</label>
                <select
                  id="st-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              {/* Ngày sinh */}
              <div className="space-y-1">
                <label htmlFor="st-dob" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày sinh <span className="text-rose-500">*</span></label>
                <input
                  id="st-dob"
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dân tộc */}
              <div className="space-y-1">
                <label htmlFor="st-ethnic" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Dân tộc</label>
                <input
                  id="st-ethnic"
                  type="text"
                  placeholder="VD: Kinh, Tày, Hoa..."
                  value={ethnic}
                  onChange={(e) => setEthnic(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* SĐT Học sinh */}
              <div className="space-y-1">
                <label htmlFor="st-studentPhone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Số điện thoại HS</label>
                <input
                  id="st-studentPhone"
                  type="tel"
                  placeholder="Nhập SĐT của riêng học sinh..."
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* CCCD */}
              <div className="space-y-1">
                <label htmlFor="st-cccd" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Số định danh / CCCD</label>
                <input
                  id="st-cccd"
                  type="text"
                  placeholder="12 chữ số CCCD..."
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="st-email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Địa chỉ Gmail</label>
                <input
                  id="st-email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Nơi sinh */}
              <div className="space-y-1">
                <label htmlFor="st-pob" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nơi sinh (Tỉnh/TP)</label>
                <input
                  id="st-pob"
                  type="text"
                  placeholder="VD: TP. Hồ Chí Minh"
                  value={pob}
                  onChange={(e) => setPob(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin gia đình */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">2. Thông tin phụ huynh (Cha, Mẹ)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Họ tên Cha */}
              <div className="space-y-1">
                <label htmlFor="st-fatherName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ tên Cha</label>
                <input
                  id="st-fatherName"
                  type="text"
                  placeholder="Họ tên cha học sinh..."
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* SĐT Cha */}
              <div className="space-y-1">
                <label htmlFor="st-fatherPhone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">SĐT Cha</label>
                <input
                  id="st-fatherPhone"
                  type="tel"
                  placeholder="Số điện thoại của cha..."
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Nghề nghiệp Cha */}
              <div className="space-y-1">
                <label htmlFor="st-fatherJob" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nghề nghiệp Cha</label>
                <input
                  id="st-fatherJob"
                  type="text"
                  placeholder="Nghề nghiệp của cha..."
                  value={fatherJob}
                  onChange={(e) => setFatherJob(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Họ tên Mẹ */}
              <div className="space-y-1">
                <label htmlFor="st-motherName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ tên Mẹ</label>
                <input
                  id="st-motherName"
                  type="text"
                  placeholder="Họ tên mẹ học sinh..."
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* SĐT Mẹ */}
              <div className="space-y-1">
                <label htmlFor="st-motherPhone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">SĐT Mẹ</label>
                <input
                  id="st-motherPhone"
                  type="tel"
                  placeholder="Số điện thoại của mẹ..."
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Nghề nghiệp Mẹ */}
              <div className="space-y-1">
                <label htmlFor="st-motherJob" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Nghề nghiệp Mẹ</label>
                <input
                  id="st-motherJob"
                  type="text"
                  placeholder="Nghề nghiệp của mẹ..."
                  value={motherJob}
                  onChange={(e) => setMotherJob(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tên liên hệ chính (Phụ huynh đại diện) */}
              <div className="space-y-1">
                <label htmlFor="st-parent" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ tên người liên hệ khẩn cấp</label>
                <input
                  id="st-parent"
                  type="text"
                  placeholder="Để trống nếu là Cha hoặc Mẹ..."
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* SĐT liên hệ chính */}
              <div className="space-y-1">
                <label htmlFor="st-phone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">SĐT người liên hệ khẩn cấp</label>
                <input
                  id="st-phone"
                  type="tel"
                  placeholder="SĐT liên hệ chính khẩn cấp..."
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Địa chỉ & chế độ học tập */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">3. Thông tin địa chỉ & chế độ học tập</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Địa chỉ hiện nay */}
              <div className="space-y-1">
                <label htmlFor="st-address" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Địa chỉ hiện nay (Tạm trú)</label>
                <input
                  id="st-address"
                  type="text"
                  placeholder="Số nhà, tên đường, tổ dân phố, phường xã..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Địa chỉ thường trú */}
              <div className="space-y-1">
                <label htmlFor="st-permanentAddress" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Địa chỉ thường trú (Hộ khẩu)</label>
                <input
                  id="st-permanentAddress"
                  type="text"
                  placeholder="Địa chỉ ghi trên sổ hộ khẩu thường trú..."
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Chế độ học */}
              <div className="space-y-1">
                <label htmlFor="st-learning-mode" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Chế độ học</label>
                <select
                  id="st-learning-mode"
                  value={learningMode}
                  onChange={(e) => setLearningMode(e.target.value as LearningMode)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Bán trú">Bán trú (Học cả ngày + bán trú trưa)</option>
                  <option value="Ngoại trú">Ngoại trú (Học một buổi / tự túc)</option>
                </select>
              </div>

              {/* Đăng ký xe / Đưa đón */}
              <div className="space-y-1">
                <label htmlFor="st-bus" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Đăng ký xe / Đưa đón</label>
                <select
                  id="st-bus"
                  value={busStatus}
                  onChange={(e) => setBusStatus(e.target.value as BusStatus)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Tự đi">Gia đình tự túc đưa đón / Tự đi bộ</option>
                  <option value="Đăng ký xe bus">Đăng ký dịch vụ xe Bus Trường</option>
                  <option value="Đăng ký xe">Đăng ký xe cá nhân gửi tại trường</option>
                </select>
              </div>

              {/* Hình thức đi học */}
              <div className="space-y-1">
                <label htmlFor="st-transport-method" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">Hình thức đi học</label>
                <select
                  id="st-transport-method"
                  value={transportMethod}
                  onChange={(e) => setTransportMethod(e.target.value as 'Tự đi' | 'PH đưa đón' | 'Đi xe')}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Tự đi">Tự đi</option>
                  <option value="PH đưa đón">PH đưa đón</option>
                  <option value="Đi xe">Đi xe</option>
                </select>
              </div>

              {/* Loại xe */}
              <div className="space-y-1">
                <label htmlFor="st-vehicle-type" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">Loại xe</label>
                <select
                  id="st-vehicle-type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Không có">Không có</option>
                  <option value="Xe đạp">Xe đạp</option>
                  <option value="Xe đạp điện">Xe đạp điện</option>
                  <option value="Xe máy điện">Xe máy điện</option>
                  <option value="Xe máy">Xe máy</option>
                </select>
              </div>

              {/* Tuyến xe bus */}
              {busStatus === 'Đăng ký xe bus' && (
                <div className="space-y-1 md:col-span-2 animate-fade-in" id="bus-route-field">
                  <label htmlFor="st-busroute" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Tuyến xe bus đăng ký</label>
                  <input
                    id="st-busroute"
                    type="text"
                    placeholder="Tuyến số 01 (Quận 1 - Q3)..."
                    value={busRoute}
                    onChange={(e) => setBusRoute(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Lưu lý lịch học sinh
            </button>
          </div>
        </form>
      )}

      {/* Class List Table view */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" id="classlist-table-section">
        <div className="overflow-x-auto" id="classlist-table-wrapper">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-200">
              <tr className="divide-x divide-slate-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                <th style={{ left: 0, width: '48px', minWidth: '48px', maxWidth: '48px' }} className="px-3 py-3 text-center sticky left-0 bg-slate-50 z-20">STT</th>
                <th style={{ left: '48px', width: '100px', minWidth: '100px', maxWidth: '100px' }} className="px-3 py-3 text-left sticky bg-slate-50 z-20">Mã học sinh</th>
                <th style={{ left: '148px', width: '160px', minWidth: '160px', maxWidth: '160px' }} className="px-4 py-3 text-left sticky bg-slate-50 z-20">Họ tên</th>
                <th style={{ left: '308px', width: '110px', minWidth: '110px', maxWidth: '110px' }} className="px-3 py-3 text-center sticky bg-slate-50 z-20 border-r-2 border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">NGÀY SINH</th>
                <th className="px-3 py-3 text-center">GIỚI TÍNH</th>
                <th className="px-3 py-3 text-left">DÂN TỘC</th>
                <th className="px-3 py-3 text-left">SĐT HS</th>
                <th className="px-3 py-3 text-left">SỐ CCCD</th>
                <th className="px-4 py-3 text-left">GMAIL</th>
                <th className="px-3 py-3 text-left">Nơi sinh</th>
                <th className="px-3 py-3 text-left">Cha</th>
                <th className="px-3 py-3 text-left">SĐT cha</th>
                <th className="px-3 py-3 text-left">Nghề cha</th>
                <th className="px-3 py-3 text-left">Mẹ</th>
                <th className="px-3 py-3 text-left">SĐT mẹ</th>
                <th className="px-3 py-3 text-left">Nghề mẹ</th>
                <th className="px-4 py-3 text-left">ĐC hiện nay</th>
                <th className="px-4 py-3 text-left">ĐC thường trú</th>
                <th className="px-3 py-3 text-center">CHẾ ĐỘ HỌC</th>
                <th className="px-3 py-3 text-center">HÌNH THỨC ĐI HỌC</th>
                <th className="px-3 py-3 text-center">ĐĂNG KÝ XE</th>
                <th className="px-3 py-3 text-center">LOẠI XE</th>
                {currentUser.role === 'teacher' && (
                  <th className="px-3 py-3 text-center">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-600 text-xs">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-100" id={`student-row-${student.id}`}>
                  
                  {/* STT */}
                  <td style={{ left: 0, width: '48px', minWidth: '48px', maxWidth: '48px' }} className="px-3 py-3.5 text-center text-slate-400 font-semibold sticky left-0 bg-white z-10">
                    {idx + 1}
                  </td>

                  {/* ID */}
                  <td style={{ left: '48px', width: '100px', minWidth: '100px', maxWidth: '100px' }} className="px-3 py-3.5 font-mono text-slate-500 font-bold whitespace-nowrap sticky bg-white z-10 text-left">
                    {student.id}
                  </td>

                  {/* Name */}
                  <td style={{ left: '148px', width: '160px', minWidth: '160px', maxWidth: '160px' }} className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap sticky bg-white z-10 text-left">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-full"
                      />
                    ) : (
                      student.name
                    )}
                  </td>

                  {/* DOB */}
                  <td style={{ left: '308px', width: '110px', minWidth: '110px', maxWidth: '110px' }} className="px-3 py-3.5 text-center font-mono text-slate-500 whitespace-nowrap sticky bg-white z-10 border-r-2 border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    {editingId === student.id ? (
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="px-1 py-0.5 border border-slate-300 rounded text-xs font-normal w-full"
                      />
                    ) : (
                      formatDateForDisplay(student.dob)
                    )}
                  </td>

                  {/* Gender */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {editingId === student.id ? (
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                        className="px-1 py-0.5 border border-slate-300 rounded text-xs bg-white w-14"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        student.gender === 'Nam' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {student.gender}
                      </span>
                    )}
                  </td>

                  {/* Ethnic */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-slate-700">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={ethnic}
                        onChange={(e) => setEthnic(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-20"
                      />
                    ) : (
                      student.ethnic || 'Kinh'
                    )}
                  </td>

                  {/* Student Phone */}
                  <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-500">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-28"
                      />
                    ) : (
                      student.studentPhone || '-'
                    )}
                  </td>

                  {/* CCCD */}
                  <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-500">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={cccd}
                        onChange={(e) => setCccd(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-32"
                      />
                    ) : (
                      student.cccd || '-'
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3.5 text-slate-500 max-w-[150px] truncate" title={student.email}>
                    {editingId === student.id ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-36"
                      />
                    ) : (
                      student.email || '-'
                    )}
                  </td>

                  {/* Place of Birth */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-slate-700">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={pob}
                        onChange={(e) => setPob(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-24"
                      />
                    ) : (
                      student.pob || 'TP. HCM'
                    )}
                  </td>

                  {/* Father Name */}
                  <td className="px-3 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-28"
                      />
                    ) : (
                      student.fatherName || student.parentName || '-'
                    )}
                  </td>

                  {/* Father Phone */}
                  <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-500">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-28"
                      />
                    ) : (
                      student.fatherPhone || student.parentPhone || '-'
                    )}
                  </td>

                  {/* Father Job */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={fatherJob}
                        onChange={(e) => setFatherJob(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-24"
                      />
                    ) : (
                      student.fatherJob || 'Tự do'
                    )}
                  </td>

                  {/* Mother Name */}
                  <td className="px-3 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-28"
                      />
                    ) : (
                      student.motherName || '-'
                    )}
                  </td>

                  {/* Mother Phone */}
                  <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-500">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={motherPhone}
                        onChange={(e) => setMotherPhone(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-28"
                      />
                    ) : (
                      student.motherPhone || '-'
                    )}
                  </td>

                  {/* Mother Job */}
                  <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={motherJob}
                        onChange={(e) => setMotherJob(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-24"
                      />
                    ) : (
                      student.motherJob || '-'
                    )}
                  </td>

                  {/* Address Present */}
                  <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate" title={student.address}>
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-40"
                      />
                    ) : (
                      student.address
                    )}
                  </td>

                  {/* Permanent Address */}
                  <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate" title={student.permanentAddress || student.address}>
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-normal w-40"
                      />
                    ) : (
                      student.permanentAddress || student.address
                    )}
                  </td>

                  {/* Learning Mode */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {editingId === student.id ? (
                      <select
                        value={learningMode}
                        onChange={(e) => setLearningMode(e.target.value as LearningMode)}
                        className="px-1 py-0.5 border border-slate-300 rounded text-xs bg-white w-24"
                      >
                        <option value="Bán trú">Bán trú</option>
                        <option value="Ngoại trú">Ngoại trú</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        student.learningMode === 'Bán trú' ? 'text-indigo-600' : 'text-slate-500'
                      }`}>
                        {student.learningMode === 'Bán trú' ? '🏢 Bán trú' : '🏠 Ngoại trú'}
                      </span>
                    )}
                  </td>

                  {/* Transport Method */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {editingId === student.id ? (
                      <select
                        value={transportMethod}
                        onChange={(e) => setTransportMethod(e.target.value as 'Tự đi' | 'PH đưa đón' | 'Đi xe')}
                        className="px-1 py-0.5 border border-slate-300 rounded text-xs bg-white w-24"
                      >
                        <option value="Tự đi">Tự đi</option>
                        <option value="PH đưa đón">PH đưa đón</option>
                        <option value="Đi xe">Đi xe</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                        student.transportMethod === 'PH đưa đón' ? 'text-amber-600' : student.transportMethod === 'Đi xe' ? 'text-blue-600' : 'text-slate-600'
                      }`}>
                        {student.transportMethod || 'Tự đi'}
                      </span>
                    )}
                  </td>

                  {/* Bus/Vehicle Status (Đăng ký xe) */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {editingId === student.id ? (
                      <select
                        value={busStatus}
                        onChange={(e) => setBusStatus(e.target.value as BusStatus)}
                        className="px-1 py-0.5 border border-slate-300 rounded text-xs bg-white w-32"
                      >
                        <option value="Tự đi">Tự đi</option>
                        <option value="Đăng ký xe bus">Đăng ký xe bus</option>
                        <option value="Đăng ký xe">Đăng ký xe</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                        student.busStatus === 'Đăng ký xe bus' ? 'text-indigo-600' : student.busStatus === 'Đăng ký xe' ? 'text-teal-600' : 'text-slate-500'
                      }`}>
                        {student.busStatus || 'Tự đi'}
                      </span>
                    )}
                  </td>

                  {/* Vehicle Type */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    {editingId === student.id ? (
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as any)}
                        className="px-1 py-0.5 border border-slate-300 rounded text-xs bg-white w-28"
                      >
                        <option value="Không có">Không có</option>
                        <option value="Xe đạp">Xe đạp</option>
                        <option value="Xe đạp điện">Xe đạp điện</option>
                        <option value="Xe máy điện">Xe máy điện</option>
                        <option value="Xe máy">Xe máy</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        student.vehicleType && student.vehicleType !== 'Không có' ? 'text-slate-800 font-semibold' : 'text-slate-400'
                      }`}>
                        {student.vehicleType || 'Không có'}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  {currentUser.role === 'teacher' && (
                    <td className="px-3 py-3.5 whitespace-nowrap text-center text-xs">
                      {editingId === student.id ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            id={`save-edit-stud-${student.id}`}
                            onClick={() => handleSaveEdit(student.id)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                            title="Lưu lại"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            id={`cancel-edit-stud-${student.id}`}
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                            title="Hủy"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            id={`edit-stud-${student.id}`}
                            onClick={() => handleStartEdit(student)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                            title="Sửa lý lịch"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            id={`del-stud-${student.id}`}
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa học sinh ${student.name} khỏi lớp học?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Xóa khỏi lớp"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
