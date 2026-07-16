import * as XLSX from 'xlsx';
import { Student } from '../types';

/**
 * Calculates average grade for a single student across all subjects
 */
function calculateStudentAverage(student: Student): string {
  const validGrades = student.grades.map(g => {
    const oralAvg = g.oral.length > 0 ? g.oral.reduce((a, b) => a + b, 0) / g.oral.length : 0;
    const m15Avg = g.m15.length > 0 ? g.m15.reduce((a, b) => a + b, 0) / g.m15.length : 0;
    const m45Avg = g.m45.length > 0 ? g.m45.reduce((a, b) => a + b, 0) / g.m45.length : 0;
    
    // Weights: oral: 1, m15: 1, m45: 2, final: 3
    let totalWeight = 0;
    let weightedSum = 0;

    if (g.oral.length > 0) { weightedSum += oralAvg * 1; totalWeight += 1; }
    if (g.m15.length > 0) { weightedSum += m15Avg * 1; totalWeight += 1; }
    if (g.m45.length > 0) { weightedSum += m45Avg * 2; totalWeight += 2; }
    weightedSum += g.final * 3; totalWeight += 3;

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  });

  if (validGrades.length === 0) return '0.0';
  const overall = validGrades.reduce((a, b) => a + b, 0) / validGrades.length;
  return overall.toFixed(2);
}

/**
 * Helper to export Student List
 */
export function exportStudentListToExcel(students: Student[], className: string = '12A4') {
  const data = students.map((s, index) => ({
    'STT': index + 1,
    'Mã Học Sinh': s.id,
    'Họ tên': s.name,
    'ngày sinh': s.dob ? (() => {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s.dob)) return s.dob;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s.dob)) {
        const [year, month, day] = s.dob.split('-');
        return `${day}/${month}/${year}`;
      }
      return s.dob;
    })() : '',
    'GIỚI TÍNH': s.gender,
    'DÂN TỘC': s.ethnic || 'Kinh',
    'SĐT HS': s.studentPhone || '',
    'SỐ CCCD': s.cccd || '',
    'GMAIL': s.email || '',
    'Nơi sinh': s.pob || 'TP. HCM',
    'Cha': s.fatherName || s.parentName || '',
    'SĐT cha': s.fatherPhone || s.parentPhone || '',
    'Nghề cha': s.fatherJob || 'Tự do',
    'Mẹ': s.motherName || '',
    'SĐT mẹ': s.motherPhone || '',
    'Nghề mẹ': s.motherJob || '',
    'ĐC hiện nay': s.address,
    'ĐC thường trú': s.permanentAddress || s.address,
    'CHẾ ĐỘ HỌC': s.learningMode,
    'HÌNH THỨC ĐI HỌC': s.transportMethod || 'Tự đi',
    'ĐĂNG KÝ XE': s.busStatus || 'Tự đi',
    'LOẠI XE': s.vehicleType || 'Không có'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const max_widths = [
    { wch: 6 },  // STT
    { wch: 15 }, // Mã Học Sinh
    { wch: 25 }, // Họ tên
    { wch: 12 }, // ngày sinh
    { wch: 10 }, // GIỚI TÍNH
    { wch: 10 }, // DÂN TỘC
    { wch: 15 }, // SĐT HS
    { wch: 18 }, // SỐ CCCD
    { wch: 25 }, // GMAIL
    { wch: 15 }, // Nơi sinh
    { wch: 20 }, // Cha
    { wch: 15 }, // SĐT cha
    { wch: 15 }, // Nghề cha
    { wch: 20 }, // Mẹ
    { wch: 15 }, // SĐT mẹ
    { wch: 15 }, // Nghề mẹ
    { wch: 35 }, // ĐC hiện nay
    { wch: 35 }, // ĐC thường trú
    { wch: 15 }, // CHẾ ĐỘ HỌC
    { wch: 20 }, // HÌNH THỨC ĐI HỌC
    { wch: 15 }, // ĐĂNG KÝ XE
    { wch: 15 }  // LOẠI XE
  ];
  worksheet['!cols'] = max_widths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Lớp');
  XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_Lop_${className}.xlsx`);
}

/**
 * Helper to export Attendance Log
 */
export function exportAttendanceToExcel(students: Student[], dates: string[], className: string = '12A4') {
  const data = students.map((s, index) => {
    const row: any = {
      'STT': index + 1,
      'Mã Học Sinh': s.id,
      'Họ và Tên': s.name
    };

    dates.forEach(date => {
      const status = s.attendance[date];
      let statusText = 'Chưa điểm danh';
      if (status === 'present') statusText = 'Có mặt (x)';
      else if (status === 'late') statusText = 'Đi trễ (T)';
      else if (status === 'excused') statusText = 'Phép (P)';
      else if (status === 'absent') statusText = 'Vắng (KP)';
      row[date] = statusText;
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Điểm Danh');
  XLSX.writeFile(workbook, `Bao_Cao_Diem_Danh_Lop_${className}.xlsx`);
}

/**
 * Helper to export Student Grades (Bảng Điểm)
 */
export function exportGradesToExcel(students: Student[], className: string = '12A4') {
  const data = students.map((s, index) => {
    const row: any = {
      'STT': index + 1,
      'Mã Học Sinh': s.id,
      'Họ và Tên': s.name
    };

    s.grades.forEach(g => {
      const oralText = g.oral.join(', ') || '-';
      const m15Text = g.m15.join(', ') || '-';
      const m45Text = g.m45.join(', ') || '-';
      const finalVal = g.final !== undefined ? g.final : '-';

      // Calc subject average
      const oralAvg = g.oral.length > 0 ? g.oral.reduce((a, b) => a + b, 0) / g.oral.length : 0;
      const m15Avg = g.m15.length > 0 ? g.m15.reduce((a, b) => a + b, 0) / g.m15.length : 0;
      const m45Avg = g.m45.length > 0 ? g.m45.reduce((a, b) => a + b, 0) / g.m45.length : 0;
      
      let totalWeight = 0;
      let weightedSum = 0;

      if (g.oral.length > 0) { weightedSum += oralAvg * 1; totalWeight += 1; }
      if (g.m15.length > 0) { weightedSum += m15Avg * 1; totalWeight += 1; }
      if (g.m45.length > 0) { weightedSum += m45Avg * 2; totalWeight += 2; }
      weightedSum += g.final * 3; totalWeight += 3;

      const subAvg = totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '-';

      row[`${g.subject} (Miệng)`] = oralText;
      row[`${g.subject} (15Phút)`] = m15Text;
      row[`${g.subject} (1Tiết)`] = m45Text;
      row[`${g.subject} (Thi HK)`] = finalVal;
      row[`${g.subject} (TBM)`] = subAvg;
    });

    row['ĐTB Chung'] = calculateStudentAverage(s);

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết Quả Học Tập');
  XLSX.writeFile(workbook, `Bang_Diem_Lop_${className}.xlsx`);
}

/**
 * Helper to export Tuition Status
 */
export function exportTuitionToExcel(students: Student[], className: string = '12A4') {
  const data = students.map((s, index) => ({
    'STT': index + 1,
    'Mã Học Sinh': s.id,
    'Họ và Tên': s.name,
    'Họ Tên Phụ Huynh': s.parentName,
    'Số Điện Thoại PH': s.parentPhone,
    'Số Tiền Học Phí (VND)': s.tuitionAmount,
    'Trạng Thái Thanh Toán': s.tuitionPaid ? 'Đã thanh toán' : 'Chưa thanh toán'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  // Set column widths
  const max_widths = [
    { wch: 6 },  // STT
    { wch: 15 }, // Mã Học Sinh
    { wch: 25 }, // Họ và Tên
    { wch: 20 }, // Họ Tên Phụ Huynh
    { wch: 15 }, // Số Điện Thoại PH
    { wch: 22 }, // Số Tiền Học Phí
    { wch: 22 }  // Trạng Thái
  ];
  worksheet['!cols'] = max_widths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Học Phí');
  XLSX.writeFile(workbook, `Bao_Cao_Hoc_Phi_Lop_${className}.xlsx`);
}

/**
 * Helper to download an Excel import template for student list
 */
export function downloadStudentListTemplate() {
  const sampleData = [
    {
      'Mã Học Sinh': 'HS010',
      'Họ tên': 'Nguyễn Văn Hải',
      'ngày sinh': '12/04/2008',
      'GIỚI TÍNH': 'Nam',
      'DÂN TỘC': 'Kinh',
      'SĐT HS': '0812345678',
      'SỐ CCCD': '079208012345',
      'GMAIL': 'hai.nguyen@gmail.com',
      'Nơi sinh': 'TP. HCM',
      'Cha': 'Nguyễn Văn Định',
      'SĐT cha': '0901234567',
      'Nghề cha': 'Kỹ sư',
      'Mẹ': 'Lê Thị Hồng',
      'SĐT mẹ': '0909876543',
      'Nghề mẹ': 'Giáo viên',
      'ĐC hiện nay': '45 Lê Lợi, Quận 1, TP. HCM',
      'ĐC thường trú': '45 Lê Lợi, Quận 1, TP. HCM',
      'CHẾ ĐỘ HỌC': 'Bán trú',
      'HÌNH THỨC ĐI HỌC': 'Đi xe',
      'ĐĂNG KÝ XE': 'Đăng ký xe',
      'LOẠI XE': 'Xe đạp điện'
    },
    {
      'Mã Học Sinh': 'HS011',
      'Họ tên': 'Phạm Thị Mai',
      'ngày sinh': '25/09/2008',
      'GIỚI TÍNH': 'Nữ',
      'DÂN TỘC': 'Kinh',
      'SĐT HS': '0898765432',
      'SỐ CCCD': '079208054321',
      'GMAIL': 'mai.pham@gmail.com',
      'Nơi sinh': 'Hà Nội',
      'Cha': 'Phạm Văn Hùng',
      'SĐT cha': '0912345678',
      'Nghề cha': 'Kinh doanh',
      'Mẹ': 'Nguyễn Thị Minh',
      'SĐT mẹ': '0918765432',
      'Nghề mẹ': 'Nội trợ',
      'ĐC hiện nay': '120 Quang Trung, Gò Vấp, TP. HCM',
      'ĐC thường trú': '120 Quang Trung, Gò Vấp, TP. HCM',
      'CHẾ ĐỘ HỌC': 'Ngoại trú',
      'HÌNH THỨC ĐI HỌC': 'Tự đi',
      'ĐĂNG KÝ XE': 'Tự đi',
      'LOẠI XE': 'Xe máy điện'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mẫu nhập học sinh');
  
  // Set column widths
  const max_widths = [
    { wch: 15 }, // Mã Học Sinh
    { wch: 25 }, // Họ tên
    { wch: 15 }, // ngày sinh
    { wch: 12 }, // GIỚI TÍNH
    { wch: 12 }, // DÂN TỘC
    { wch: 15 }, // SĐT HS
    { wch: 18 }, // SỐ CCCD
    { wch: 25 }, // GMAIL
    { wch: 15 }, // Nơi sinh
    { wch: 20 }, // Cha
    { wch: 15 }, // SĐT cha
    { wch: 15 }, // Nghề cha
    { wch: 20 }, // Mẹ
    { wch: 15 }, // SĐT mẹ
    { wch: 15 }, // Nghề mẹ
    { wch: 35 }, // ĐC hiện nay
    { wch: 35 }, // ĐC thường trú
    { wch: 15 }, // CHẾ ĐỘ HỌC
    { wch: 20 }, // HÌNH THỨC ĐI HỌC
    { wch: 15 }, // ĐĂNG KÝ XE
    { wch: 15 }  // LOẠI XE
  ];
  worksheet['!cols'] = max_widths;

  XLSX.writeFile(workbook, 'Mau_Danh_Sach_Hoc_Sinh_12A4.xlsx');
}

/**
 * Helper to download an Excel import template for student grades
 */
export function downloadGradesTemplate(students: Student[], subject: string, semester: 'HK1' | 'HK2') {
  const data = students.map(s => {
    // Try to get current grades if any, to pre-fill
    let oral = '';
    let m15_1 = '';
    let m15_2 = '';
    let m15_3 = '';
    let m45 = '';
    let final = '';

    const gradeObj = s.grades.find(g => g.subject === subject && g.semester === semester);
    if (gradeObj) {
      oral = gradeObj.oral.join(', ');
      m15_1 = gradeObj.m15[0] !== undefined ? gradeObj.m15[0].toString() : '';
      m15_2 = gradeObj.m15[1] !== undefined ? gradeObj.m15[1].toString() : '';
      m15_3 = gradeObj.m15[2] !== undefined ? gradeObj.m15[2].toString() : '';
      m45 = gradeObj.m45.join(', ');
      final = gradeObj.final !== undefined ? gradeObj.final.toString() : '';
    }

    return {
      'Mã Học Sinh': s.id,
      'Họ và Tên': s.name,
      'Môn Học': subject,
      'Học Kỳ': semester,
      'Điểm Miệng (Hệ số 1)': oral,
      'Điểm 15 Phút lần 1 (Hệ số 1)': m15_1,
      'Điểm 15 Phút lần 2 (Hệ số 1)': m15_2,
      'Điểm 15 Phút lần 3 (Hệ số 1)': m15_3,
      'Điểm 1 Tiết (Hệ số 2)': m45,
      'Điểm Thi HK (Hệ số 3)': final
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Nhập Điểm');

  // Set column widths
  const max_widths = [
    { wch: 15 }, // Mã Học Sinh
    { wch: 25 }, // Họ và Tên
    { wch: 15 }, // Môn Học
    { wch: 12 }, // Học Kỳ
    { wch: 22 }, // Điểm Miệng
    { wch: 26 }, // Điểm 15 Phút Lần 1
    { wch: 26 }, // Điểm 15 Phút Lần 2
    { wch: 26 }, // Điểm 15 Phút Lần 3
    { wch: 22 }, // Điểm 1 Tiết
    { wch: 22 }  // Điểm Thi HK
  ];
  worksheet['!cols'] = max_widths;

  XLSX.writeFile(workbook, `Mau_Nhap_Diem_Mon_${subject}_${semester}.xlsx`);
}

