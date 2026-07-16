import { Student, Announcement, TimetableDay, DailyLesson } from '../types';

// Mock students data for Class 12A4
export const initialStudents: Student[] = [
  {
    id: 'HS001',
    name: 'Nguyễn Văn An',
    gender: 'Nam',
    dob: '2008-05-15',
    parentName: 'Nguyễn Văn Bình',
    parentPhone: '0901234567',
    address: '123 Nguyễn Trãi, Quận 1, TP. HCM',
    learningMode: 'Bán trú',
    busStatus: 'Đăng ký xe bus',
    busRoute: 'Tuyến số 01 (Quận 1 - Quận 3)',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'excused',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 2500000,
    tuitionPaid: true,
    grades: [
      { subject: 'Toán', oral: [8, 9], m15: [7, 8], m45: [8, 9], final: 8.5 },
      { subject: 'Ngữ văn', oral: [7], m15: [8], m45: [7, 8], final: 7.8 },
      { subject: 'Tiếng Anh', oral: [9, 10], m15: [9], m45: [9, 10], final: 9.2 },
      { subject: 'Vật lý', oral: [8], m15: [8, 9], m45: [8], final: 8.2 },
      { subject: 'Hóa học', oral: [9], m15: [10], m45: [9], final: 9.0 }
    ]
  },
  {
    id: 'HS002',
    name: 'Lê Thị Bình',
    gender: 'Nữ',
    dob: '2008-09-20',
    parentName: 'Lê Hoàng Nam',
    parentPhone: '0912345678',
    address: '456 Lê Lợi, Quận 1, TP. HCM',
    learningMode: 'Bán trú',
    busStatus: 'Tự đi',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 2200000,
    tuitionPaid: false,
    grades: [
      { subject: 'Toán', oral: [6, 7], m15: [8, 7], m45: [7, 8], final: 7.2 },
      { subject: 'Ngữ văn', oral: [9, 8], m15: [9], m45: [8, 9], final: 8.7 },
      { subject: 'Tiếng Anh', oral: [8, 8], m15: [8], m45: [7, 8], final: 8.0 },
      { subject: 'Vật lý', oral: [7], m15: [6, 8], m45: [7], final: 7.0 },
      { subject: 'Hóa học', oral: [8], m15: [7], m45: [8], final: 7.5 }
    ]
  },
  {
    id: 'HS003',
    name: 'Trần Thanh Hải',
    gender: 'Nam',
    dob: '2008-01-10',
    parentName: 'Trần Quốc Bảo',
    parentPhone: '0923456789',
    address: '789 Điện Biên Phủ, Bình Thạnh, TP. HCM',
    learningMode: 'Ngoại trú',
    busStatus: 'Tự đi',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'absent',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 1800000,
    tuitionPaid: true,
    grades: [
      { subject: 'Toán', oral: [9, 10], m15: [9, 10], m45: [10, 9], final: 9.6 },
      { subject: 'Ngữ văn', oral: [6], m15: [7], m45: [6, 7], final: 6.5 },
      { subject: 'Tiếng Anh', oral: [7, 8], m15: [8], m45: [8, 7], final: 7.8 },
      { subject: 'Vật lý', oral: [10], m15: [9, 10], m45: [10], final: 9.8 },
      { subject: 'Hóa học', oral: [9], m15: [10], m45: [9, 10], final: 9.5 }
    ]
  },
  {
    id: 'HS004',
    name: 'Phạm Minh Đăng',
    gender: 'Nam',
    dob: '2008-11-12',
    parentName: 'Phạm Văn Hùng',
    parentPhone: '0934567890',
    address: '12 Phan Đăng Lưu, Phú Nhuận, TP. HCM',
    learningMode: 'Bán trú',
    busStatus: 'Đăng ký xe',
    busRoute: 'Tuyến số 02 (Phú Nhuận - Bình Thạnh)',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 2500000,
    tuitionPaid: false,
    grades: [
      { subject: 'Toán', oral: [5, 6], m15: [6], m45: [5, 6], final: 5.8 },
      { subject: 'Ngữ văn', oral: [6, 7], m15: [7], m45: [7, 6], final: 6.4 },
      { subject: 'Tiếng Anh', oral: [5, 6], m15: [5], m45: [6, 5], final: 5.5 },
      { subject: 'Vật lý', oral: [6], m15: [5, 6], m45: [6], final: 5.8 },
      { subject: 'Hóa học', oral: [5], m15: [6], m45: [5], final: 5.3 }
    ]
  },
  {
    id: 'HS005',
    name: 'Hoàng Thùy Dương',
    gender: 'Nữ',
    dob: '2008-03-25',
    parentName: 'Hoàng Trung Kiên',
    parentPhone: '0945678901',
    address: '88 Nguyễn Đình Chiểu, Quận 3, TP. HCM',
    learningMode: 'Bán trú',
    busStatus: 'Đăng ký xe bus',
    busRoute: 'Tuyến số 01 (Quận 1 - Quận 3)',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 2500000,
    tuitionPaid: true,
    grades: [
      { subject: 'Toán', oral: [9, 9], m15: [8, 9], m45: [9, 9], final: 9.0 },
      { subject: 'Ngữ văn', oral: [8, 9], m15: [8], m45: [8, 9], final: 8.5 },
      { subject: 'Tiếng Anh', oral: [10, 10], m15: [9, 10], m45: [10, 10], final: 9.8 },
      { subject: 'Vật lý', oral: [8], m15: [8], m45: [9], final: 8.5 },
      { subject: 'Hóa học', oral: [9], m15: [8], m45: [8], final: 8.3 }
    ]
  },
  {
    id: 'HS006',
    name: 'Vũ Quốc Anh',
    gender: 'Nam',
    dob: '2008-07-04',
    parentName: 'Vũ Mạnh Cường',
    parentPhone: '0956789012',
    address: '321 Hoàng Văn Thụ, Tân Bình, TP. HCM',
    learningMode: 'Ngoại trú',
    busStatus: 'Tự đi',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 1800000,
    tuitionPaid: true,
    grades: [
      { subject: 'Toán', oral: [8, 7], m15: [8, 9], m45: [7, 8], final: 7.9 },
      { subject: 'Ngữ văn', oral: [7], m15: [7], m45: [7, 7], final: 7.0 },
      { subject: 'Tiếng Anh', oral: [8, 7], m15: [8], m45: [8, 8], final: 7.8 },
      { subject: 'Vật lý', oral: [8], m15: [8, 9], m45: [8], final: 8.1 },
      { subject: 'Hóa học', oral: [7], m15: [8], m45: [8], final: 7.8 }
    ]
  },
  {
    id: 'HS007',
    name: 'Đỗ Thảo Chi',
    gender: 'Nữ',
    dob: '2008-12-30',
    parentName: 'Đỗ Quốc Thắng',
    parentPhone: '0967890123',
    address: '159 Cách Mạng Tháng 8, Quận 10, TP. HCM',
    learningMode: 'Bán trú',
    busStatus: 'Tự đi',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 2200000,
    tuitionPaid: false,
    grades: [
      { subject: 'Toán', oral: [7, 8], m15: [8], m45: [8, 9], final: 8.2 },
      { subject: 'Ngữ văn', oral: [9, 9], m15: [9], m45: [8, 9], final: 8.8 },
      { subject: 'Tiếng Anh', oral: [9, 8], m15: [9], m45: [9, 8], final: 8.6 },
      { subject: 'Vật lý', oral: [7], m15: [8], m45: [8], final: 7.9 },
      { subject: 'Hóa học', oral: [8], m15: [8], m45: [7], final: 7.7 }
    ]
  },
  {
    id: 'HS008',
    name: 'Phan Văn Giang',
    gender: 'Nam',
    dob: '2008-02-18',
    parentName: 'Phan Văn Tuấn',
    parentPhone: '0978901234',
    address: '22 Võ Thị Sáu, Quận 1, TP. HCM',
    learningMode: 'Bán trú',
    busStatus: 'Đăng ký xe bus',
    busRoute: 'Tuyến số 01 (Quận 1 - Quận 3)',
    attendance: {
      '2026-07-06': 'present',
      '2026-07-07': 'present',
      '2026-07-08': 'present',
      '2026-07-09': 'present',
      '2026-07-10': 'present',
      '2026-07-11': 'present',
    },
    tuitionAmount: 2500000,
    tuitionPaid: true,
    grades: [
      { subject: 'Toán', oral: [7], m15: [7], m45: [6, 7], final: 6.8 },
      { subject: 'Ngữ văn', oral: [6, 6], m15: [6], m45: [7, 6], final: 6.2 },
      { subject: 'Tiếng Anh', oral: [7], m15: [7, 8], m45: [7], final: 7.1 },
      { subject: 'Vật lý', oral: [6], m15: [7], m45: [7], final: 6.9 },
      { subject: 'Hóa học', oral: [7], m15: [6, 7], m45: [7], final: 6.8 }
    ]
  }
];

// Mock Announcements
export const initialAnnouncements: Announcement[] = [
  {
    id: 'TB001',
    title: 'Thông báo họp Phụ huynh cuối Học kỳ I',
    content: 'Kính gửi các bậc Phụ huynh lớp 12A4, GVCN xin kính mời quý phụ huynh tới tham dự buổi họp phụ huynh vào lúc 8h00 ngày Chủ Nhật (19/07/2026) tại phòng học 302 lầu 3. Buổi họp nhằm tổng kết kết quả học tập của các em học sinh trong học kỳ vừa qua và triển khai kế hoạch học kỳ mới. Rất mong quý phụ huynh có mặt đầy đủ và đúng giờ.',
    date: '2026-07-11',
    isPinned: true,
    author: 'Thầy Nguyễn Văn Điền (GVCN)'
  },
  {
    id: 'TB002',
    title: 'Nhắc nhở nộp Học phí tháng 7/2026',
    content: 'Đề nghị quý phụ huynh và các em học sinh lưu ý thời hạn hoàn thành học phí tháng 7 là trước ngày 15/07/2026. Các khoản phí bao gồm học phí chính khóa, phí bán trú và tiền xe đưa đón (đối với học sinh đăng ký). Nhà trường hỗ trợ nộp trực tuyến qua cổng thanh toán của ứng dụng hoặc chuyển khoản trực tiếp.',
    date: '2026-07-10',
    isPinned: true,
    author: 'Văn phòng Nhà trường'
  },
  {
    id: 'TB003',
    title: 'Kế hoạch thi thử Trung học phổ thông Quốc gia',
    content: 'Nhà trường sẽ tổ chức đợt thi thử THPT Quốc gia đầu tiên dành riêng cho học sinh khối 12 vào ba ngày 23, 24 và 25 tháng 7. Các môn thi bắt buộc bao gồm: Toán, Ngữ Văn, Tiếng Anh và các môn tự chọn Khoa học Tự nhiên/Khoa học Xã hội. Đề nghị các em chủ động ôn tập kỹ lưỡng theo đề cương của các tổ bộ môn đã phát.',
    date: '2026-07-08',
    isPinned: false,
    author: 'Tổ Chuyên môn'
  }
];

// Mock Timetable
export const initialTimetable: TimetableDay[] = [
  {
    day: 'Thứ Hai',
    periods: [
      { period: 1, time: '08h00 - 08h45', subject: 'Chào cờ', teacher: '' },
      { period: 2, time: '08h45 - 09h30', subject: 'Bài tập', teacher: 'T. Đạt' },
      { period: 3, time: '10h00 - 10h45', subject: 'Bài tập', teacher: 'T. Đạt' },
      { period: 4, time: '10h45 - 11h30', subject: 'Toán', teacher: 'C. T.Dung' },
      { period: 5, time: '13h30 - 14h15', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 6, time: '14h15 - 15h00', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 7, time: '15h15 - 16h00', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 8, time: '16h00 - 16h45', subject: '-', teacher: '' },
      { period: 9, time: '17h15 - 18h00', subject: 'LT. Văn', teacher: 'C. Xuân' },
      { period: 10, time: '18h00 - 18h45', subject: 'LT. Văn', teacher: 'C. Xuân' },
      { period: 11, time: '19h00 - 19h45', subject: '-', teacher: '' },
      { period: 12, time: '19h45 - 20h30', subject: '-', teacher: '' }
    ]
  },
  {
    day: 'Thứ Ba',
    periods: [
      { period: 1, time: '08h00 - 08h45', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 2, time: '08h45 - 09h30', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 3, time: '10h00 - 10h45', subject: 'Toán', teacher: 'C. T.Dung' },
      { period: 4, time: '10h45 - 11h30', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 5, time: '13h30 - 14h15', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 6, time: '14h15 - 15h00', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 7, time: '15h15 - 16h00', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 8, time: '16h00 - 16h45', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 9, time: '17h15 - 18h00', subject: 'LT. Sử', teacher: 'T. Sơn' },
      { period: 10, time: '18h00 - 18h45', subject: 'LT. Sử', teacher: 'T. Sơn' },
      { period: 11, time: '19h00 - 19h45', subject: 'LT. Toán', teacher: 'C. T.Dung' },
      { period: 12, time: '19h45 - 20h30', subject: 'LT. Toán', teacher: 'C. T.Dung' }
    ]
  },
  {
    day: 'Thứ Tư',
    periods: [
      { period: 1, time: '08h00 - 08h45', subject: 'Toán', teacher: 'C. T.Dung' },
      { period: 2, time: '08h45 - 09h30', subject: 'Toán', teacher: 'C. T.Dung' },
      { period: 3, time: '10h00 - 10h45', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 4, time: '10h45 - 11h30', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 5, time: '13h30 - 14h15', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 6, time: '14h15 - 15h00', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 7, time: '15h15 - 16h00', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 8, time: '16h00 - 16h45', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 9, time: '17h15 - 18h00', subject: 'LT. KTPL', teacher: 'C. T.Hương' },
      { period: 10, time: '18h00 - 18h45', subject: 'LT. KTPL', teacher: 'C. T.Hương' },
      { period: 11, time: '19h00 - 19h45', subject: 'LT. Sử', teacher: 'T. Sơn' },
      { period: 12, time: '19h45 - 20h30', subject: 'LT. Sử', teacher: 'T. Sơn' }
    ]
  },
  {
    day: 'Thứ Năm',
    periods: [
      { period: 1, time: '08h00 - 08h45', subject: 'GDKTPL', teacher: 'C. T.Hương' },
      { period: 2, time: '08h45 - 09h30', subject: 'GDKTPL', teacher: 'C. T.Hương' },
      { period: 3, time: '10h00 - 10h45', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 4, time: '10h45 - 11h30', subject: 'Bài tập', teacher: 'T. Điền' },
      { period: 5, time: '13h30 - 14h15', subject: 'Bài tập', teacher: 'T. Đạt' },
      { period: 6, time: '14h15 - 15h00', subject: 'Bài tập', teacher: 'T. Đạt' },
      { period: 7, time: '15h15 - 16h00', subject: 'GDKTPL', teacher: 'C. T.Hương' },
      { period: 8, time: '16h00 - 16h45', subject: 'GDKTPL', teacher: 'C. T.Hương' },
      { period: 9, time: '17h15 - 18h00', subject: 'LT. KTPL', teacher: 'C. T.Hương' },
      { period: 10, time: '18h00 - 18h45', subject: 'LT. KTPL', teacher: 'C. T.Hương' },
      { period: 11, time: '19h00 - 19h45', subject: 'LT. Toán', teacher: 'C. T.Dung' },
      { period: 12, time: '19h45 - 20h30', subject: 'LT. Toán', teacher: 'C. T.Dung' }
    ]
  },
  {
    day: 'Thứ Sáu',
    periods: [
      { period: 1, time: '08h00 - 08h45', subject: 'Toán', teacher: 'C. T.Dung' },
      { period: 2, time: '08h45 - 09h30', subject: 'Toán', teacher: 'C. T.Dung' },
      { period: 3, time: '10h00 - 10h45', subject: 'GDKTPL', teacher: 'C. T.Hương' },
      { period: 4, time: '10h45 - 11h30', subject: 'GDKTPL', teacher: 'C. T.Hương' },
      { period: 5, time: '13h30 - 14h15', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 6, time: '14h15 - 15h00', subject: 'Sử', teacher: 'T. Sơn' },
      { period: 7, time: '15h15 - 16h00', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 8, time: '16h00 - 16h45', subject: 'Văn', teacher: 'C. Xuân' },
      { period: 9, time: '17h15 - 18h00', subject: 'LT. Văn', teacher: 'C. Xuân' },
      { period: 10, time: '18h00 - 18h45', subject: 'LT. Văn', teacher: 'C. Xuân' },
      { period: 11, time: '19h00 - 19h45', subject: '-', teacher: '' },
      { period: 12, time: '19h45 - 20h30', subject: '-', teacher: '' }
    ]
  }
];

// Mock Daily Lesson Planner / homework (Báo bài)
export const initialDailyLessons: DailyLesson[] = [
  {
    id: 'BB001',
    date: '2026-07-13',
    lessons: [
      {
        subject: 'Toán học',
        content: 'Học bài Lũy thừa và Hàm số lũy thừa. Giải bài tập 1, 2, 3 trang 56 SGK Giải tích 12.',
        homework: 'Hoàn thành phiếu bài tập toán chuyên đề lũy thừa được phát trên lớp.'
      },
      {
        subject: 'Ngữ văn',
        content: 'Đọc và phân tích đoạn trích tác phẩm Tuyên ngôn Độc lập (Hồ Chí Minh) - Phần tác giả.',
        homework: 'Viết đoạn văn ngắn (200 chữ) nêu cảm nhận về tinh thần yêu nước trong Tuyên ngôn Độc lập.'
      },
      {
        subject: 'Tiếng Anh',
        content: 'Unit 1: Life stories - Reading and Vocabulary.',
        homework: 'Học thuộc từ mới phần Unit 1 và hoàn thành bài tập 2, 3 phần Reading trong sách bài tập.'
      }
    ]
  },
  {
    id: 'BB002',
    date: '2026-07-14',
    lessons: [
      {
        subject: 'Vật lý',
        content: 'Chủ đề: Dao động điều hòa. Viết công thức, giải thích các đại lượng.',
        homework: 'Giải 10 bài tập trắc nghiệm trong đề cương trang 12.'
      },
      {
        subject: 'Hóa học',
        content: 'Khái niệm về Este và Lipit. Viết các đồng phân este của C3H6O2 và C4H8O2.',
        homework: 'Chuẩn bị bài thực hành thí nghiệm phản ứng xà phòng hóa chất béo.'
      }
    ]
  }
];
