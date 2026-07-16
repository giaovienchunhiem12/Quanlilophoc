export type UserRole = 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  studentId?: string; // If student or parent, relates to a student record
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isPinned: boolean;
  author: string;
}

export interface SubjectGrade {
  subject: string;
  semester?: 'HK1' | 'HK2';
  oral: number[]; // Điểm miệng
  m15: number[]; // Điểm 15 phút
  m45: number[]; // Điểm 1 tiết
  final?: number; // Điểm học kỳ
  average?: number; // Điểm trung bình môn
}

export type LearningMode = 'Bán trú' | 'Ngoại trú';
export type BusStatus = 'Tự đi' | 'Đăng ký xe bus' | 'Đăng ký xe';

export interface Student {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  parentName: string;
  parentPhone: string;
  address: string;
  learningMode: LearningMode; // Chế độ học
  busStatus: BusStatus; // Học sinh đi xe
  busRoute?: string; // Tuyến xe (nếu đi xe bus)
  attendance: { [date: string]: 'present' | 'late' | 'excused' | 'absent' | 'pending' }; // Điểm danh theo ngày
  grades: SubjectGrade[]; // Kết quả học tập
  tuitionPaid: boolean; // Trạng thái đóng học phí
  tuitionAmount: number; // Học phí phải đóng
  
  // New fields from excel standard format
  ethnic?: string;           // DÂN TỘC
  studentPhone?: string;     // SĐT HS
  cccd?: string;             // SỐ CCCD
  email?: string;            // GMAIL
  pob?: string;              // Nơi sinh
  fatherName?: string;       // Cha
  fatherPhone?: string;      // SĐT cha
  fatherJob?: string;        // Nghề cha
  motherName?: string;       // Mẹ
  motherPhone?: string;      // SĐT mẹ
  motherJob?: string;        // Nghề mẹ
  permanentAddress?: string; // ĐC thường trú
  transportMethod?: 'Tự đi' | 'PH đưa đón' | 'Đi xe'; // Hình thức đi học
  vehicleType?: 'Xe đạp' | 'Xe máy điện' | 'Xe máy' | 'Xe đạp điện' | 'Không có'; // Loại xe
  lunchAmount?: number;      // Tiền cơm bán trú
  lunchPaid?: boolean;       // Trạng thái đóng tiền cơm
  paymentPromiseDate?: string; // Hẹn ngày đóng
}

export interface TimetablePeriod {
  period: number; // Tiết 1, 2, 3, 4, 5
  time: string;
  subject: string;
  teacher: string;
}

export interface TimetableDay {
  day: string; // Thứ Hai, Thứ Ba, ...
  periods: TimetablePeriod[];
}

export interface DailyLesson {
  id: string;
  date: string;
  lessons: {
    subject: string;
    content: string; // Nội dung bài học/báo bài
    homework: string; // Bài tập về nhà / dặn dò
  }[];
}
